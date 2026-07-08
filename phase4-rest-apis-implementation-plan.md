# Implementation Plan — Phase 4: REST APIs

## Purpose of This Phase

By the end of Phase 3, correct data is already flowing into PostgreSQL entirely on its own. This phase does *not* introduce new data logic — it exposes what's already correctly stored, through a clean, documented, secure HTTP interface. Because the hard data-correctness work is already done, this phase should be comparatively straightforward — but it's also highly visible to evaluators (they'll likely open Swagger and click around before reading a line of code), so polish and correctness of the *contract* matters a lot here.

**Definition of done for this phase:** every required endpoint is implemented, documented in Swagger/OpenAPI, returns consistent and well-typed response shapes, handles bad input gracefully, and has been manually exercised (via Swagger UI or Postman) against real data from Phase 3 — with no frontend involved yet.

---

## Sub-feature 4.1 — API Contract Design (Before Writing Endpoint Code)

**Goal:** Decide the shape of every request/response up front, so you're not redesigning endpoints halfway through.

Tasks:
- [ ] Define a consistent response envelope convention project-wide, e.g.:
  ```
  { "data": ..., "meta": { ... } }        // success
  { "error": { "code": ..., "message": ... } }  // failure
  ```
  Consistency here matters more than the exact shape chosen — pick one and apply it everywhere.
- [ ] Decide pagination strategy for the transaction list endpoint: offset-based (`?page=1&limit=20`) is simpler and sufficient for this assessment's scope; cursor-based is more "correct" at scale but adds complexity you can mention as a future improvement instead of building now.
- [ ] Decide filter/sort parameters for the list endpoint (e.g., `?status=confirmed`, `?sortBy=block_timestamp&order=desc`) based on the "required queries" list you wrote in Phase 2 Sub-feature 2.1.
- [ ] Write out, in plain text or a quick OpenAPI stub, the exact request/response shape for all four required endpoint groups before implementing any of them.

**Acceptance criteria:** A short design note (or draft OpenAPI YAML) listing every endpoint, its parameters, and its exact response shape — reviewed once, before code, rather than discovered endpoint-by-endpoint.

---

## Sub-feature 4.2 — DTOs & Response Models

**Goal:** Create the typed layer between your database entities and what actually goes out over HTTP — never return raw ORM entities directly.

Tasks:
- [ ] Create a `TransactionResponseDto` (or equivalent) that explicitly lists only the fields that should be public — this is also a security boundary, since your DB rows might contain internal-only fields you don't want exposed (e.g., raw webhook payload references, internal processing metadata).
- [ ] Create request DTOs for query parameters (pagination, filters) with validation decorators (e.g., `class-validator` if using NestJS) — e.g., `page` must be a positive integer, `status` must be one of the known enum values.
- [ ] Create a `StatsResponseDto` matching exactly what the dashboard will need: total transaction count, total USDT received, confirmed count, pending count.
- [ ] Set up automatic transformation from DB entity → DTO (e.g., NestJS's `ClassSerializerInterceptor` or a manual mapper function) so this happens consistently rather than being reimplemented per-endpoint.

**Acceptance criteria:** A clear, reusable mapping layer such that no controller method ever returns a raw database entity directly to the client.

---

## Sub-feature 4.3 — `GET /api/transactions` (List, Paginated & Filterable)

**Goal:** Implement the primary listing endpoint.

Tasks:
- [ ] Implement pagination using the strategy decided in 4.1.
- [ ] Implement filtering by `confirmation_status` (pending/confirmed) and optionally `processing_status`.
- [ ] Implement sorting (default: most recent first, by `block_timestamp` descending — most useful default for a monitoring dashboard).
- [ ] Return total count alongside the page of results (needed for the frontend to render pagination controls correctly).
- [ ] Validate query parameters and return a clear `400` with a descriptive message for invalid input (e.g., `status=banana`) rather than a generic `500`.

**Acceptance criteria:** Calling this endpoint with various combinations of page/limit/status/sort parameters against real Phase 3 data returns correct, correctly-paginated, correctly-filtered results.

---

## Sub-feature 4.4 — `GET /api/transactions/:id` (Single Transaction Detail)

**Goal:** Implement the detail-lookup endpoint.

Tasks:
- [ ] Implement lookup by internal ID (UUID).
- [ ] Return a proper `404` (with a clear error body, per your envelope convention) when the ID doesn't exist — don't let this fall through to a generic server error.
- [ ] Validate the ID parameter is a well-formed UUID before querying (reject malformed input early and cheaply, rather than hitting the database with a guaranteed-to-fail query).

**Acceptance criteria:** Valid IDs return full transaction detail; invalid/missing IDs return clean, well-typed `404`/`400` responses, not stack traces.

---

## Sub-feature 4.5 — `GET /api/transactions/search?hash=` (Search by Transaction Hash)

**Goal:** Implement the hash-search endpoint required by the assignment.

Tasks:
- [ ] Implement lookup by `transaction_hash` (this is the field with the unique constraint from Phase 2, so this query is naturally fast).
- [ ] Validate the hash parameter's format/length before querying (reuse validation logic from Phase 3's ingestion validation if possible, rather than duplicating the rule).
- [ ] Decide and document the behavior for a hash that doesn't exist: `404` (recommended, consistent with 4.4) vs. `200` with an empty result — pick one and be consistent with how "not found" is handled elsewhere in the API.

**Acceptance criteria:** Searching with a real hash from your Phase 3 test data returns the correct transaction; searching with a nonexistent or malformed hash returns a clean, well-typed error response.

---

## Sub-feature 4.6 — `GET /api/stats` (Dashboard Statistics)

**Goal:** Implement the aggregate endpoint the dashboard's summary cards depend on.

Tasks:
- [ ] Implement the four required aggregate values: total transaction count, total USDT received (sum of `amount` where appropriate — decide whether this sums *all* transactions or only *confirmed* ones, and document that choice, since it's a meaningful business-logic decision, not just a query detail), confirmed count, pending count.
- [ ] Write this as a single efficient query (or a small number of them) rather than fetching all rows and computing in application code — this is a good moment to demonstrate SQL/query-layer competence (e.g., `COUNT`, `SUM`, `GROUP BY` at the database level).
- [ ] Consider adding a "recent transactions" array to this same endpoint (last N transactions) if that's how you want the dashboard to fetch its "Recent Transactions" panel — alternatively, have the dashboard just call the existing list endpoint with `limit=5`. Decide and document which approach you're taking, to avoid building two ways to get the same data.

**Acceptance criteria:** Stats returned by this endpoint are manually verified to be arithmetically correct against the real data sitting in the database (e.g., manually count rows via `psql` and confirm the API agrees).

---

## Sub-feature 4.7 — Global Error Handling

**Goal:** Ensure every error path across the whole API is caught and returned in your consistent envelope shape — not just the specific validation cases handled per-endpoint.

Tasks:
- [ ] Implement a global exception filter (NestJS) that catches any unhandled error and converts it into your standard error envelope, with an appropriate HTTP status code, rather than letting raw stack traces leak to the client.
- [ ] Ensure database connection errors, unexpected nulls, etc. are all caught at this global layer as a safety net, in addition to specific validation you added per-endpoint.
- [ ] Make sure error responses never leak sensitive internals (stack traces, SQL query text, internal file paths) in anything other than server-side logs.

**Acceptance criteria:** Deliberately triggering an unexpected error (e.g., temporarily breaking the DB connection) results in a clean, well-formed error response, not an ugly raw exception dump.

---

## Sub-feature 4.8 — Swagger / OpenAPI Documentation

**Goal:** Satisfy the explicit assignment requirement for interactive API docs, and make the API easy for evaluators to explore without reading your source code.

Tasks:
- [ ] Set up `@nestjs/swagger`  and expose the interactive UI at `/docs`.
- [ ] Annotate every controller method and DTO with proper Swagger decorators (`@ApiOperation`, `@ApiResponse`, `@ApiProperty`, etc.) so the generated docs actually describe real behavior, not just auto-generated generic descriptions.
- [ ] Include example values in the Swagger annotations (e.g., a realistic transaction hash, a realistic amount) so the "Try it out" feature in Swagger UI is immediately usable without the evaluator needing to guess valid input.
- [ ] Document possible error responses (400/404/500) for each endpoint, not just the happy path.

**Acceptance criteria:** Opening `/docs` in a browser shows a complete, accurate, example-populated interactive API reference that an evaluator could use to test every endpoint without reading a single line of your code.

---

## Sub-feature 4.9 — Security Hardening at the API Layer

**Goal:** Apply the security considerations from your concept note concretely at this layer.

Tasks:
- [ ] Add rate limiting (e.g., `@nestjs/throttler`) to public endpoints to prevent abuse.
- [ ] Configure CORS explicitly (allow only your known frontend origin in production config, rather than a permissive wildcard).
- [ ] Add basic security headers (e.g., via `helmet`).
- [ ] Confirm all query parameter validation from earlier sub-features actually prevents injection-style abuse (this should already be true if you used parameterized queries / ORM query builders throughout, but explicitly verify no raw string concatenation into SQL exists anywhere).
- [ ] Ensure no endpoint accidentally exposes internal-only fields (re-verify against your DTOs from 4.2).

**Acceptance criteria:** A short written checklist confirming each of these protections is in place, ready to reference directly in your security write-up and technical discussion.

---

## Sub-feature 4.10 — Automated Tests for the API Layer

**Goal:** Cover this layer with tests, both as a bonus-points item and as a real safety net.

Tasks:
- [ ] Write unit tests for DTO validation logic (e.g., invalid status value rejected, invalid UUID rejected).
- [ ] Write integration tests (Supertest) for each endpoint against a real (test) database instance: list with various filters, detail lookup (found/not found), search (found/not found), and stats (verified against known seeded data).
- [ ] Include at least one test explicitly proving the "no duplicate" guarantee is visible at the API level too (e.g., seed two attempts at the same transaction hash at the DB layer, confirm the API only ever shows one).

**Acceptance criteria:** A test suite that runs in CI (tying into Phase 7) and gives you confidence that regressions in this layer would be caught automatically.

---

## Sub-feature 4.11 — Manual End-to-End Verification (API Layer, No Frontend Yet)

**Goal:** Prove the whole API surface works correctly against real Phase 3 data before building the dashboard on top of it.

Tasks:
- [ ] Using Swagger UI (or Postman), manually exercise every endpoint against the real database populated by your Phase 3 jobs.
- [ ] Confirm pagination, filtering, and sorting all behave correctly with real data volumes (even if small).
- [ ] Confirm stats match manual database counts.
- [ ] Confirm all error paths (bad ID, bad hash, bad query params) behave as designed.

**Acceptance criteria:** A short manual test log (even just a checklist you tick through once) confirming every endpoint behaves correctly against real data, before Phase 6 begins.

---

## Consolidated Output of Phase 4 (what you carry forward)

By the end of this phase you should have:
1. A finalized, documented API contract (envelope, pagination, filtering conventions)
2. A DTO/mapping layer that never exposes raw database entities
3. All four required endpoint groups implemented, validated, and manually verified against real data
4. Global, consistent error handling
5. Complete, accurate, example-populated Swagger/OpenAPI docs at `/docs`
6. Security hardening (rate limiting, CORS, headers) applied and checklisted
7. An automated test suite for this layer
8. `.env.example` updated with any new API-layer config (e.g., rate limit thresholds, allowed CORS origin)

This is the stable surface Phase 6 (frontend dashboard) will consume, and Phase 5 (webhook endpoint) is really just one more controller added into this same layer.

---

## Suggested Order to Tackle These Sub-features

4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6 → 4.7 → 4.8 → 4.9 → 4.10 → 4.11

The contract design (4.1) and DTO layer (4.2) genuinely need to come first — every endpoint after that reuses them. Swagger docs (4.8) are listed after the endpoints exist because annotating real, finished methods is easier than documenting a moving target, but in practice you may find it natural to add Swagger decorators endpoint-by-endpoint as you build each one (4.2 → 4.3+docs → 4.4+docs, etc.) rather than as a separate pass at the end — either order works, just don't leave documentation entirely until last, since it's easy to run out of time for it.

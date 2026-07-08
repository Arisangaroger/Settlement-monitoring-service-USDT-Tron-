# Implementation Plan — Phase 5: Webhook Endpoint

## Purpose of This Phase

Your system already works correctly end-to-end using polling alone (Phases 3–4 proved that). This phase adds the **fast path** on top of that already-solid foundation: a webhook receiver that lets a provider (QuickNode) push new transactions to you in near real-time, while the reconciliation poller keeps acting as the safety net for anything the webhook misses.

Because this is explicitly the "enhancement layer" (per your architecture decision earlier), the guiding principle here is: **the webhook must slot into the exact same ingestion pipeline as polling, not create a second parallel system.** If you find yourself duplicating logic between the poll path and the webhook path, that's a signal something's structured wrong.

**Definition of done for this phase:** a real QuickNode webhook, configured against your monitored testnet wallet, successfully delivers a payload to your running backend, which parses it, validates it, and stores it via the same `IngestionService` from Phase 3 — with no duplicate row created if the reconciliation poller also happens to pick up the same transaction.

---

## Sub-feature 5.1 — Provider-Side Webhook Configuration

**Goal:** Get a real webhook actually configured and firing, before writing your receiver code — so you have real payloads to build against, same philosophy as Phase 1.

Tasks:
- [ ] In your QuickNode dashboard, use the guided wizard to create a new webhook for the TRON network, filtered to "wallet transfers" for your specific monitored Nile testnet address.
- [ ] Initially point it at a temporary inspection tool (e.g., webhook.site) rather than your own server — you already captured one sample payload this way in Phase 1 Sub-feature 1.7; now confirm the payload shape is stable by triggering a couple more test transactions.
- [ ] Note the webhook's validation/signing token from the QuickNode dashboard (you'll need this for Sub-feature 5.3).
- [ ] Once your local receiver exists (later sub-features), update the webhook's target URL to point at your real endpoint via a tunnel (see Sub-feature 5.8).

**Acceptance criteria:** A configured, active QuickNode webhook that you've confirmed fires correctly for your test wallet, with at least two real sample payloads saved for reference.

---

## Sub-feature 5.2 — Webhook Receiver Endpoint (Basic Skeleton)

**Goal:** Stand up the actual HTTP endpoint that will receive these payloads.

Tasks:
- [ ] Implement `POST /api/webhooks/tron` as a new controller within your existing backend (per Phase 4's module structure — this is just one more controller, not a new service).
- [ ] Initially, make it do the simplest possible thing: log the raw incoming payload and return `200 OK` — get this working and confirm real delivery before adding parsing/validation logic on top.
- [ ] Confirm (using a local tunnel, see Sub-feature 5.8) that a real QuickNode webhook can successfully reach this endpoint and that you see the payload land in your logs.

**Acceptance criteria:** A real, externally-triggered webhook delivery visibly logged by your running backend.

---

## Sub-feature 5.3 — Signature / Token Validation

**Goal:** Ensure your endpoint only accepts genuine payloads from your configured provider, not spoofed requests from anyone who discovers the URL.

Tasks:
- [ ] Read tatum's documentation on how their webhook validation token/signature is included in requests (typically a header).
- [ ] Implement validation logic that checks this token/signature on every incoming request **before** any parsing or persistence logic runs.
- [ ] Return `401 Unauthorized` immediately for any request that fails this check, and log it as a security-relevant event (without crashing or leaking internal details in the response).
- [ ] Store the expected token/secret via environment variable (`QUICKNODE_WEBHOOK_SECRET` or similar), never hardcoded — add it to `.env.example`.
- [ ] Deliberately test this by sending a fake request with a missing/wrong token (e.g., via `curl` or Postman) and confirming it's correctly rejected.

**Acceptance criteria:** Genuine QuickNode requests are accepted; manually crafted fake requests without a valid token are rejected with `401`, proven by an actual test.

---

## Sub-feature 5.4 — Payload Parsing & Normalization

**Goal:** Convert the QuickNode webhook payload shape into the exact same normalized internal shape your `IngestionService` already expects from the polling path (Phase 3) — this is the key piece that keeps the two ingestion paths from diverging.

Tasks:
- [ ] Using your saved sample payloads from Sub-feature 5.1, define a TypeScript interface for the raw webhook payload shape (this will differ structurally from the raw TronGrid REST response you modeled in Phase 3 — expect different field names/nesting).
- [ ] Write a mapping function that converts this webhook-specific shape into the same normalized "incoming transaction" shape used internally (the same shape your `TronGridClient` in Phase 3 already produces) — so `IngestionService.processTransaction(...)` doesn't need to know or care which path the data came from.
- [ ] Apply the same amount-decimal conversion, timestamp handling, and address-format normalization logic here as you did in Phase 3 — reuse those existing pure functions rather than reimplementing them.
- [ ] Apply the same USDT contract-address verification check (reject look-alike tokens) here too, exactly as done in the polling path.

**Acceptance criteria:** A real webhook payload, once run through this mapping function, produces output that is structurally identical to what the polling path produces for the same underlying transaction.

---

## Sub-feature 5.5 — Wiring Into the Shared Ingestion Service

**Goal:** Actually connect this path to persistence, using the exact same safety guarantees as polling.

Tasks:
- [ ] Call `IngestionService.processTransaction(normalizedTx)` with `source: 'webhook'` from the controller, after validation (5.3) and normalization (5.4) succeed.
- [ ] Confirm — by testing, not just by reasoning — that if the reconciliation poller and this webhook both independently discover the same transaction, only one row ends up in the database (this is the payoff of Phase 3's upsert-based dedup: it should just work here with zero additional code).
- [ ] Do not implement any separate duplicate-checking logic specific to the webhook path — if you find yourself writing one, it's a sign the shared service isn't being reused correctly.

**Acceptance criteria:** A live test where you trigger a real transaction, let both the webhook and (by temporarily lowering its interval) the reconciliation poller see it, and confirm exactly one database row results, with `source` reflecting whichever path happened to arrive first.

---

## Sub-feature 5.6 — Idempotency & Replay Handling

**Goal:** Handle the reality that webhook providers sometimes redeliver the same event (e.g., after a timeout on their end, even if your endpoint actually succeeded).

Tasks:
- [ ] Confirm this is already handled "for free" by the same unique-constraint/upsert mechanism — a redelivered webhook for an already-processed transaction hash should simply be a no-op, not an error.
- [ ] Explicitly test this: manually replay the exact same captured payload twice against your endpoint and confirm the second attempt is safely ignored (and still returns a success-style response, since from the provider's perspective, nothing went wrong).
- [ ] Return `200 OK` even for a "duplicate, already-processed" case — returning an error here could cause the provider to keep retrying pointlessly.

**Acceptance criteria:** Manually replaying a captured payload never creates a duplicate row and always results in an appropriate (success) response back to the sender.

---

## Sub-feature 5.7 — Raw Payload Audit Logging (`webhook_events_log`)

**Goal:** Use the supporting table designed in Phase 2 to keep a record of every webhook delivery, successful or not — valuable for debugging and for demonstrating operational maturity.

Tasks:
- [ ] On every incoming request (after signature validation passes), insert a row into `webhook_events_log` with the raw payload and a `received_at` timestamp, before attempting to process it.
- [ ] Update that row's `processed` flag based on whether ingestion succeeded.
- [ ] Consider what happens if the process crashes between receiving and processing — the raw log row means you haven't lost the data, and could build a small recovery script later that reprocesses any `processed = false` rows (worth mentioning as a resilience feature even if not fully built out).

**Acceptance criteria:** Every webhook delivery, including deliberately malformed test ones, leaves a traceable row in `webhook_events_log`.

---

## Sub-feature 5.8 — Error Handling & Response Timing

**Goal:** Respond correctly and quickly, since slow or wrong responses can cause providers to retry unnecessarily or mark your endpoint unhealthy.

Tasks:
- [ ] Ensure the endpoint responds quickly (ideally under a second) — if any processing step could be slow, consider acknowledging receipt immediately (`200 OK`) and doing the actual ingestion asynchronously (e.g., pushing to an internal queue/job), rather than making the provider wait on your full database write.
- [ ] Return appropriate status codes: `401` for failed validation, `400` for structurally malformed payloads, `200` for anything successfully accepted (including duplicates, per 5.6).
- [ ] Make sure a single malformed payload can't crash the endpoint or affect other requests — wrap processing in proper try/catch, consistent with the resilience approach from Phase 3.

**Acceptance criteria:** The endpoint responds quickly and correctly under normal conditions, malformed input, and duplicate replay — all without ever crashing the process.

---

## Sub-feature 5.9 — Local Testing Strategy (Exposing Localhost)

**Goal:** Solve the practical problem flagged earlier — QuickNode needs a public URL, but you're developing locally.

Tasks:
- [ ] Use a tunneling tool (e.g., `ngrok`) to expose your local backend's webhook endpoint temporarily during development.
- [ ] Update the QuickNode webhook's target URL to this tunnel URL while testing.
- [ ] Document this clearly in your README as a **development-only** step — make explicit that in production, this endpoint would be exposed via your actual deployed domain, not a tunnel.
- [ ] Since the evaluator will likely run this via Docker Compose locally without a public URL, make sure your README is explicit that the webhook path is a demonstrated, working, but optional enhancement — and that the **polling path alone is sufficient** to fully exercise the system's core requirements without any tunnel setup.

**Acceptance criteria:** A clear, written explanation in your docs of exactly how you tested the webhook locally, and confirmation that the system doesn't *require* this for an evaluator to see it work.

---

## Sub-feature 5.10 — Automated Tests for the Webhook Path

**Goal:** Cover this endpoint with tests, mirroring the same discipline applied in Phase 4.

Tasks:
- [ ] Unit test the payload-mapping function (5.4) using your saved sample payloads, asserting the normalized output shape matches expectations.
- [ ] Integration test the full endpoint: valid signature + valid payload → row created; invalid signature → `401`; malformed payload → `400`; replayed/duplicate payload → `200` with no new row.
- [ ] Reuse the same test-database setup from Phase 4's integration tests rather than building a separate test harness.

**Acceptance criteria:** A test suite that would catch a regression in signature validation, payload parsing, or dedup behavior on this path specifically.

---

## Consolidated Output of Phase 5 (what you carry forward)

By the end of this phase you should have:
1. A real, configured QuickNode webhook firing against your testnet wallet
2. A secured, validated webhook receiver endpoint
3. A payload-normalization layer producing output identical in shape to the polling path
4. Proven, tested dedup behavior across both ingestion paths simultaneously
5. Audit logging of every webhook delivery via `webhook_events_log`
6. Fast, correct, resilient HTTP responses under success/failure/duplicate conditions
7. A clearly documented local testing approach (ngrok) with an explicit note that this is optional/demonstrative, not required for core evaluation
8. Automated tests for this path
9. `.env.example` updated with the webhook secret/token variable

At this point, your backend is fully feature-complete per the assignment's functional requirements — Phase 6 only needs to *display* what's already correctly flowing in through both paths.

---

## Suggested Order to Tackle These Sub-features

5.1 → 5.2 → 5.3 → 5.4 → 5.5 → 5.6 → 5.7 → 5.8 → 5.9 → 5.10

Note that 5.9 (local tunnel setup) is listed later here only because it's referenced throughout, but in practice you'll need to set up the tunnel as early as 5.2 to actually test your skeleton endpoint against real deliveries — treat 5.1/5.2/5.9 as a tightly coupled loop you'll cycle through together at the start, then move linearly through 5.3–5.8, and finish with 5.10.

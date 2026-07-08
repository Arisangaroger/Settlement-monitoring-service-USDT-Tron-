# Implementation Plan — Phase 3: Backend Core (Persistence + Polling/Reconciliation Logic)

## Purpose of This Phase

This is where the disposable Phase 1 script and the paper schema from Phase 2 become a real, running service. By the end of this phase, you should have a backend process that — with **no frontend and no REST API yet** — continuously and correctly populates your PostgreSQL database with real transaction data, handles duplicates safely, and tracks confirmations over time, entirely on its own.

**Definition of done for this phase:** you can start the service, watch it run for a few minutes, and verify directly in the database (via `psql` or a DB GUI) that transactions appear, confirmations update, and no duplicates are ever created — all before a single API endpoint exists.

---

## Sub-feature 3.1 — Project Scaffolding & Module Structure

**Goal:** Set up the real backend project with a structure that cleanly separates concerns from day one.

Tasks:
- [ ] Initialize the real backend project (NestJS recommended for this, since its module system naturally maps to the separation you need: ingestion, jobs, blockchain client, persistence).
- [ ] Create a clear module layout, e.g.:
  - `blockchain/` — TronGrid client, response parsing/normalization
  - `ingestion/` — the shared service that both webhook and poll paths call to persist a transaction
  - `jobs/` — reconciliation job, confirmation-updater job, scheduler wiring
  - `transactions/` — data access layer (repository) for the `transactions` table
  - `wallets/` — data access for `monitoring_wallets`
  - `config/` — centralized environment/config loading
- [ ] Connect the ORM (Prisma) from Phase 2 to this real project, pointing at the same Dockerized Postgres instance.
- [ ] Confirm the app boots and can successfully run a trivial query against the existing schema (e.g., count rows in `transactions`) before writing any real logic — this catches connection/config issues early.

**Acceptance criteria:** A running NestJS app with a clean module structure and a confirmed working database connection.

---

## Sub-feature 3.2 — Blockchain Client Module (Productionizing the Phase 1 PoC)

**Goal:** Turn your throwaway Phase 1 script into a proper, reusable, well-typed service.

Tasks:
- [ ] Create a `TronGridClient` service wrapping the HTTP calls you prototyped in Phase 1: fetch TRC20 transfers for an address, fetch latest block number.
- [ ] Define TypeScript interfaces/types for the raw TronGrid response shapes, based on your Phase 1 field glossary — this gives you compile-time safety everywhere else in the app that consumes this data.
- [ ] Implement the amount-conversion function (raw integer → human-readable, using token decimals) as a small, independently unit-testable pure function — not inline in the middle of other logic.
- [ ] Implement the confirmation-count calculation (`latest_block - tx_block`) as another small, pure, testable function.
- [ ] Implement incremental fetching using the pagination/cursor approach you identified in Phase 1 Sub-feature 1.5 (fetch only transactions after a given block number).
- [ ] Wrap all TronGrid calls with basic retry logic (e.g., retry twice with backoff) for transient network failures — informed by the rate-limit/error behavior you observed in Phase 1 Sub-feature 1.6.
- [ ] Read the TronGrid API key from config/environment, never hardcoded.

**Acceptance criteria:** A `TronGridClient` service, independent of any job or API code, that you can call directly (e.g., from a test script or unit test) and get back clean, correctly-typed, correctly-converted transaction data.

---

## Sub-feature 3.3 — Shared Transaction Ingestion Service

**Goal:** Build the single, shared "front door" that both the webhook path (Phase 5) and the polling path (this phase) will call — this is the piece that actually enforces your dedup and data-integrity guarantees, so it needs to be correct before anything else depends on it.

Tasks:
- [ ] Create an `IngestionService.processTransaction(rawTx)` method that: normalizes the raw data into your DB shape (using the Sub-feature 3.2 conversion functions), determines the correct `source` value (`poll` for this phase; `webhook` will be passed in Phase 5), and attempts to persist it.
- [ ] Implement the persist step using an **upsert / "insert ... on conflict (transaction_hash) do nothing"** pattern (per your Phase 2 Sub-feature 2.3 constraint) rather than a "check-then-insert" pattern — this is what actually makes concurrent webhook + poll writes safe.
- [ ] Return a clear result from this method (e.g., `{ status: 'inserted' | 'duplicate_ignored' | 'failed' }`) so calling code (and your logs) can distinguish these cases.
- [ ] Validate the token contract address against the known real USDT-TRC20 contract address (the security check you identified in Phase 1 Sub-feature 1.3) before persisting — reject/flag transfers of look-alike tokens.
- [ ] Add basic input validation (correct hash format/length, positive amount, valid addresses) before attempting to persist — fail loudly and log clearly rather than silently storing malformed data.

**Acceptance criteria:** A single, well-tested service method that can safely be called twice with the exact same transaction and only ever result in one database row, with a clear returned status each time.

---

## Sub-feature 3.4 — Reconciliation Polling Job

**Goal:** Implement the actual 5-minute safety-net job described in your concept note.

Tasks:
- [ ] Implement a scheduled job (using NestJS's built-in `@Cron`/schedule module, or BullMQ if you want job-queue features like retries/observability — recommend starting simple with `@nestjs/schedule` unless you have a specific reason for a queue).
- [ ] On each run: read `last_synced_block` from the `monitoring_wallets` table for the monitored address.
- [ ] Call `TronGridClient` to fetch transactions after that block number.
- [ ] For each returned transaction, call `IngestionService.processTransaction(...)` with `source: 'poll'`.
- [ ] After processing, update `last_synced_block` to the highest block number seen in this run — so the next run doesn't re-fetch old data.
- [ ] Make the interval configurable via `RECONCILIATION_INTERVAL_MS` (defaulting to 5 minutes / 300000ms), not hardcoded.
- [ ] Add structured logging around each run: how many transactions fetched, how many new vs. duplicate, how long the run took.

**Acceptance criteria:** Starting the app and waiting causes this job to run automatically on schedule, correctly advancing `last_synced_block` and inserting only genuinely new transactions each time.

---

## Sub-feature 3.5 — Confirmation Updater Job

**Goal:** Implement the 12-second job that keeps confirmation counts (and derived status) fresh for anything still pending.

Tasks:
- [ ] Implement a second scheduled job, running on its own configurable interval (`CONFIRMATION_CHECK_INTERVAL_MS`, defaulting to 12000ms).
- [ ] Query the database for all transactions where `confirmation_status = 'pending'` (this is exactly the query the Phase 2 index on `confirmation_status` was designed to support).
- [ ] Fetch the current latest block number once per run (not once per transaction — avoid unnecessary duplicate calls within the same run).
- [ ] For each pending transaction, recompute `confirmations = latest_block - block_number`, and update the row.
- [ ] Apply your chosen confirmation threshold (from Phase 1 Sub-feature 1.4) to flip `confirmation_status` to `confirmed` once the threshold is reached.
- [ ] Log how many transactions were checked and how many transitioned to confirmed in each run.

**Acceptance criteria:** A transaction inserted as `pending` visibly transitions to `confirmed` in the database within the expected time window, purely from this job running on schedule, with no manual intervention.

---

## Sub-feature 3.6 — Concurrency & Race Condition Handling

**Goal:** Explicitly reason about (and test) what happens when things overlap — this is exactly the kind of edge case the technical discussion is likely to probe.

Tasks:
- [ ] Consider: what happens if the confirmation-updater job is still running when the next 12-second tick fires (e.g., due to a slow TronGrid response)? Ensure jobs don't overlap — either via a simple "is this job already running" flag, or your scheduler's built-in overlap prevention.
- [ ] Consider: what happens if the reconciliation job and a (future, Phase 5) webhook event both try to process the same transaction hash within the same second? Confirm this is safe purely because of the Sub-feature 3.3 upsert pattern — write a quick test simulating this by calling `processTransaction` twice concurrently (e.g., via `Promise.all`) with the same input and confirming only one row results.
- [ ] Document these findings — this becomes a strong, concrete answer to "how did you handle race conditions?" in the technical discussion.

**Acceptance criteria:** A written note (or an actual test) demonstrating that concurrent ingestion attempts for the same transaction are safely handled.

---

## Sub-feature 3.7 — Error Handling & Resilience

**Goal:** Make sure one bad transaction or one failed TronGrid call doesn't silently stop the whole pipeline.

Tasks:
- [ ] Wrap each job run in a top-level try/catch so an error on one iteration doesn't crash the scheduler or prevent future runs.
- [ ] Ensure a single malformed transaction within a batch doesn't stop processing of the rest of the batch — process each transaction independently, catching and logging per-item errors.
- [ ] Ensure TronGrid API failures (timeouts, 5xx errors, rate limiting) are caught, logged clearly, and simply retried on the *next* scheduled run rather than crashing — the job's own interval is itself a natural retry mechanism.
- [ ] Consider adding a `failed` processing_status path: if a transaction repeatedly fails validation/parsing, mark it as `failed` rather than endlessly retrying it forever.

**Acceptance criteria:** You can deliberately feed the system a malformed/invalid transaction (e.g., manually crafted bad data) and confirm the rest of the system keeps running normally, with the failure clearly logged.

---

## Sub-feature 3.8 — Logging

**Goal:** Give yourself (and evaluators) real visibility into what the backend is doing, since there's no frontend yet to "see" anything.

Tasks:
- [ ] Set up structured logging (Pino ) rather than plain `console.log` — even at this early stage, since it's the habit that makes Phase 7's "logging and monitoring" bonus nearly free later.
- [ ] Log at minimum: job start/end with duration, count of transactions fetched/inserted/duplicated per run, and any errors with enough context to debug (transaction hash, block number) without leaking secrets (API keys).
- [ ] Keep log levels sensible (info for normal operation, warn for recoverable issues like rate limits, error for real failures).

**Acceptance criteria:** Running the app for a few minutes produces a readable log stream that tells a clear story of what happened, without needing to query the database to understand system behavior.

---

## Sub-feature 3.9 — Configuration Management

**Goal:** Centralize all the tunable values this phase introduced, consistent with the "configurable, not hardcoded" principle from earlier phases.

Tasks:
- [ ] Create a single config module/service that reads and validates all environment variables at startup (fail fast with a clear error if something required is missing, rather than failing confusingly later).
- [ ] Include at minimum: `DATABASE_URL`, `TRONGRID_API_KEY`, `RECONCILIATION_INTERVAL_MS`, `CONFIRMATION_CHECK_INTERVAL_MS`, `CONFIRMATION_THRESHOLD`, `MONITORED_WALLET_ADDRESS`, `USDT_CONTRACT_ADDRESS`.
- [ ] Add all of these (with placeholder/example values) to `.env.example` now, incrementally, rather than reconstructing it from memory at the end in Phase 7.

**Acceptance criteria:** Every tunable value introduced in this phase is read from config, and `.env.example` is already up to date as you go.

---

## Sub-feature 3.10 — Manual End-to-End Verification (No Frontend, No API Yet)

**Goal:** Prove the whole persistence + polling/reconciliation pipeline genuinely works before building anything on top of it.

Tasks:
- [ ] Start the full backend service.
- [ ] Send a real test transaction to your monitored Nile testnet wallet (same technique as Phase 1).
- [ ] Watch the logs: confirm the reconciliation job picks it up within one interval, confirm it's inserted with `pending` status.
- [ ] Watch the confirmation-updater logs over the next couple of minutes: confirm the confirmation count increases and eventually flips to `confirmed`.
- [ ] Directly query the database to confirm the final row looks exactly as expected: correct amount, correct addresses, correct status, `source = 'poll'`.
- [ ] Attempt to manually trigger processing of the same transaction hash again (e.g., temporarily lower the interval or re-run the job manually) and confirm no duplicate row is created.

**Acceptance criteria:** A full, observed, real end-to-end cycle — real testnet transaction in, correctly parsed and stored data out, confirmation tracked over time, duplication proven impossible — with zero API or frontend code involved.

---

## Consolidated Output of Phase 3 (what you carry forward)

By the end of this phase you should have:
1. A running backend service with a clean module structure
2. A productionized, typed, tested `TronGridClient`
3. A shared `IngestionService` proven safe under concurrent/duplicate input
4. Two working scheduled jobs (reconciliation @ 5 min, confirmation updater @ 12 sec), both interval-configurable
5. Demonstrated resilience to malformed data and transient errors
6. Structured logs telling a clear operational story
7. An up-to-date `.env.example`
8. A real, observed end-to-end verification with genuine testnet data

This is the foundation Phase 4 (REST APIs) simply exposes, and Phase 5 (webhook) plugs into via the same `IngestionService`.

---

## Suggested Order to Tackle These Sub-features

3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6 → 3.7 → 3.8 (ongoing alongside others) → 3.9 (ongoing alongside others) → 3.10

Note that 3.8 (logging) and 3.9 (config) aren't really "steps 8 and 9" in a strict sequence — they're better added incrementally as you build 3.1–3.7, rather than bolted on at the end. 3.10 (manual verification) is genuinely last, since it requires everything else to exist and be wired together correctly.

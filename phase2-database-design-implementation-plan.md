# Implementation Plan — Phase 2: Database Design

## Purpose of This Phase

Phase 1 gave you real, verified facts about what TRON/TRC20 transaction data actually looks like — field names, formats, decimal handling, confirmation mechanics. Phase 2 turns those facts into a proper relational schema: one that's correct, prevents duplicate/inconsistent data by construction (not just by careful application code), and will comfortably support the queries your API and dashboard will need later.

**Definition of done for this phase:** a finalized, migrated PostgreSQL schema (running in a real Postgres instance, not just a diagram), an ERD document, and written justification for every non-obvious design decision (types chosen, constraints added, indexes added) — because "why did you design it this way" is explicitly one of the technical discussion topics.

---

## Sub-feature 2.1 — Re-derive Requirements from Phase 1 Findings + Assignment Spec

**Goal:** Don't design in a vacuum — go back to two sources of truth before writing any schema.

Tasks:
- [ ] Re-read the assignment's required transaction fields list (hash, sender, recipient, amount, token symbol, block number, timestamp, confirmation status, processing status) and treat it as your non-negotiable baseline.
- [ ] Re-read your Phase 1 field glossary and note anywhere the real TronGrid data has more nuance than the assignment's simple list implies (e.g., raw amount vs. decimals, contract address for verifying real USDT, base58 vs hex address formats).
- [ ] Decide explicitly: are you storing addresses in base58 ("T...") format, hex format, or both? (Recommendation: store base58 as the canonical display format, since that's what block explorers and users recognize — but note this decision and reasoning in your README.)
- [ ] List every query the system will need to run against this data before finalizing tables — this prevents realizing later that a needed field or index is missing. At minimum: "get all transactions," "get by hash," "get by status," "sum of confirmed amounts," "count by status," "find transactions still pending for confirmation-check job," "find last-seen block per wallet for reconciliation."

**Acceptance criteria:** A short written list of required queries, and a confirmed decision on address format storage, both committed to a design notes file before touching any schema code.

---

## Sub-feature 2.2 — Core `transactions` Table Design

**Goal:** Design the central table with correct types, not just "make it work" types.

Tasks:
- [ ] Choose a primary key strategy: UUID (recommended — avoids exposing sequential IDs externally, and plays well if you ever shard/replicate) vs. auto-increment integer. Document the choice.
- [ ] Define `transaction_hash` as `varchar` with an exact length matching what you observed in Phase 1 (TRON tx hashes are fixed-length hex strings) — using a fixed/checked length rather than an unbounded text field is a small but real data-integrity decision worth mentioning.
- [ ] Define `amount` as a fixed-precision numeric type (e.g., `numeric(38,6)`), **never** float/double — floating point cannot represent currency amounts safely, and this is exactly the kind of decision they may probe in the technical discussion.
- [ ] Decide whether to also store the **raw, undivided integer amount** (as returned by TronGrid) alongside the human-readable converted amount — recommended, since it lets you re-verify/re-derive if a decimals bug is ever found, without needing to re-fetch from the chain.
- [ ] Define `block_number` as `bigint` (not `int`) — block numbers grow indefinitely and some chains already exceed 32-bit int range; using `bigint` from day one avoids a future migration.
- [ ] Define `block_timestamp` as `timestamptz`, storing in UTC, based on the unit/format you confirmed in Phase 1 (convert at write-time, not read-time).
- [ ] Define `confirmations` as `integer`, updated by the confirmation-check job.
- [ ] Define `confirmation_status` as a Postgres enum (`pending`, `confirmed`) rather than a free-text string — enums prevent typos/invalid values at the database level, not just in application code.
- [ ] Define `processing_status` as a separate enum (`new`, `processed`, `duplicate_ignored`, `failed`) — kept distinct from `confirmation_status` because they represent different concerns: one is about blockchain finality, the other is about your own pipeline's handling state. Be ready to explain this separation if asked.
- [ ] Define `source` as an enum (`webhook`, `poll`) to record which ingestion path first captured each transaction — useful operational/debugging data, and demonstrates awareness of your own hybrid architecture at the schema level.
- [ ] Add `created_at` / `updated_at` timestamp columns (standard audit practice).

**Acceptance criteria:** A written column-by-column table definition (name, type, nullable?, default, reasoning) for `transactions`, ready to translate directly into a migration file.

---

## Sub-feature 2.3 — Constraints: Making Duplicates Impossible, Not Just Unlikely

**Goal:** Enforce your dedup requirement at the database layer, since that's the layer both your webhook path and polling path ultimately write through.

Tasks:
- [ ] Add a **unique constraint** on `transaction_hash`. This is the actual mechanism that prevents duplicate transaction processing (requirement #4) — not application-level "check if it exists first" logic, which has race conditions if webhook and poll both fire near-simultaneously.
- [ ] Decide the conflict-handling strategy at the application layer: use an "upsert"/"insert ... on conflict do nothing" pattern (or your ORM's equivalent) so a duplicate insert attempt fails silently and safely rather than crashing the ingestion service.
- [ ] Add a `NOT NULL` constraint on all fields that should never legitimately be empty (hash, sender, recipient, amount, block number).
- [ ] Consider a `CHECK` constraint ensuring `amount > 0` — a zero or negative amount for an incoming transfer would indicate a parsing bug worth catching immediately rather than silently storing bad data.

**Acceptance criteria:** You can explain, using this constraint, exactly what happens if the webhook and the reconciliation poller both attempt to insert the same transaction hash within milliseconds of each other.

---

## Sub-feature 2.4 — Indexing Strategy

**Goal:** Make the required queries fast, and be able to justify each index rather than "index everything."

Tasks:
- [ ] Confirm `transaction_hash` is indexed (it will be automatically, since it's unique — but explicitly note this).
- [ ] Add an index on `confirmation_status` — the confirmation-updater job will frequently query "all transactions where status = pending," and the dashboard stats endpoint needs fast counts by status.
- [ ] Add an index on `block_number` — supports the reconciliation job's "give me anything after block X" query pattern.
- [ ] Add an index on `recipient_address` if you plan to eventually support multi-wallet monitoring (per the `monitoring_wallets` table from your concept note) — even for a single-wallet assessment, this shows forward-thinking design.
- [ ] Consciously avoid over-indexing fields that are rarely queried (e.g., `sender_address` may not need an index for this assessment's scope) — being able to explain *why* you didn't index something is as valuable as explaining why you did.

**Acceptance criteria:** A short written list of every index added, each with a one-line justification tied to a real query from your Sub-feature 2.1 list.

---

## Sub-feature 2.5 — Supporting Tables

**Goal:** Model the two supporting entities from your concept note, and decide their real necessity for this specific assessment.

Tasks:
- [ ] **`monitoring_wallets`**: even if you're only monitoring one address for this assessment, model this as a proper table (rather than an env variable) — it's what makes multi-wallet support (mentioned as a discussion topic: "scalability improvements") trivial to add later, and it's where `last_synced_block` naturally lives (needed by the reconciliation job).
- [ ] **`webhook_events_log`**: decide whether to include this for the assessment. Recommendation: include it — it's a small table, it directly demonstrates good operational thinking ("what happened when a webhook arrived that we couldn't process?"), and gives you something concrete to show if asked about debugging/observability.
- [ ] Define the foreign key relationship: should `transactions` reference `monitoring_wallets` via a `wallet_id` column? Recommendation: yes — this is cleaner than duplicating the "which wallet is this for" logic elsewhere, and makes the multi-wallet story coherent at the schema level.

**Acceptance criteria:** Written column definitions for both supporting tables, plus a clear statement of the foreign key relationship between `transactions` and `monitoring_wallets`.

---

## Sub-feature 2.6 — Choose Migration Tooling & Set Up the Real Database

**Goal:** Move from "designed on paper" to "running in Postgres," using proper migrations rather than a manually-run SQL script.

Tasks:
- [ ] Choose Prisma or TypeORM (Prisma recommended for a TypeScript-first project — clearer schema file, strong migration history, good DX). Document the choice and a one-line reason.
- [ ] Set up a local PostgreSQL instance (via Docker, so it matches your eventual `docker-compose.yml` from Phase 7 — no reason to use a different setup now and switch later).
- [ ] Write the schema in your chosen ORM's schema language, translating every decision from 2.2–2.5.
- [ ] Generate and run the first migration.
- [ ] Manually inspect the created tables via `psql` or a GUI tool (e.g., TablePlus, pgAdmin) to visually confirm types, constraints, and indexes landed as intended — don't just trust that the migration "ran successfully."

**Acceptance criteria:** A running Postgres instance with all tables, constraints, and indexes created via a versioned migration file (not manual SQL), verified by direct inspection.

---

## Sub-feature 2.7 — Populate with Real Sample Data from Phase 1

**Goal:** Prove the schema actually fits real data, not just data you imagined.

Tasks:
- [ ] Take the real sample transaction(s) saved in Phase 1 (`sample-responses/trc20-transfer-raw.json`) and manually insert them into the new schema (via a quick script or even a manual SQL insert).
- [ ] Confirm the amount conversion, timestamp conversion, and address format all fit cleanly with no truncation, type errors, or precision loss.
- [ ] Deliberately attempt to insert the *same* transaction hash twice and confirm the unique constraint correctly rejects/ignores the duplicate (this is your dedup requirement, proven at the DB level before any application code exists).

**Acceptance criteria:** Real Phase 1 sample data sitting correctly in the database, and a demonstrated, working duplicate-rejection test.

---

## Sub-feature 2.8 — Produce the ERD Document

**Goal:** Turn the finalized schema into the actual ERD deliverable required by the assignment.

Tasks:
- [ ] Generate an ERD diagram showing `transactions`, `monitoring_wallets`, and `webhook_events_log`, with all fields, types, PK/FK markers, and the relationship between tables (crow's-foot or equivalent notation).
- [ ] Use a tool that can generate this directly from your schema where possible (e.g., Prisma has ERD-generation plugins) — reduces the risk of the diagram drifting out of sync with the real schema.
- [ ] Annotate the diagram (or accompanying notes) with the reasoning for the two separate status enums (`confirmation_status` vs `processing_status`) and the `source` field — these are the parts most likely to prompt "why did you design it this way?" questions.

**Acceptance criteria:** A finished ERD image/document, matching the actual running schema exactly (verified by comparing side-by-side), ready to include in the final deliverables.

---

## Sub-feature 2.9 — Write the Design Rationale Notes

**Goal:** Prepare the explanation you'll need to give live, per the assignment's technical discussion stage on "Database Design."

Tasks:
- [ ] Write a short (half-page) rationale document covering: why `numeric` over `float` for amount, why a DB-level unique constraint over application-level dedup checks, why two separate status enums instead of one combined status, why `bigint` for block number, why UUID primary keys, and why `monitoring_wallets` exists even for a single-wallet assessment.
- [ ] Keep this alongside the ERD in your repo's `/docs` folder — this becomes direct prep material for your live technical discussion, not just a formality.

**Acceptance criteria:** A written rationale document you could read from directly if asked to defend any of these decisions live.

---

## Consolidated Output of Phase 2 (what you carry forward)

By the end of this phase you should have:
1. A running PostgreSQL database (in Docker) with all tables created via versioned migrations
2. Real Phase 1 sample data inserted and verified, including a proven duplicate-rejection test
3. A finished ERD document
4. A written design rationale document
5. A confirmed list of "required queries" (from 2.1) that your Phase 4 REST API will need to satisfy

This is what Phase 3 (backend ingestion logic) and Phase 4 (REST APIs) will be built directly on top of.

---

## Suggested Order to Tackle These Sub-features

2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 → 2.7 → 2.8 → 2.9

Design decisions (2.1–2.5) should be fully thought through on paper/in notes *before* touching migration tooling (2.6) — changing your mind about a column type after you've already run and tested migrations is far more annoying than changing your mind on paper. The ERD (2.8) and rationale notes (2.9) are last because they should describe the schema as it actually ended up, not as originally planned.

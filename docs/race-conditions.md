# Race Condition Handling

How Phase 3 prevents duplicate data and unsafe concurrent behavior.

---

## 1. Duplicate ingestion (webhook + poll, or poll + poll)

**Scenario:** The reconciliation job and a future webhook (Phase 5) detect the same `transaction_hash` within milliseconds.

**Mechanism:**

```
Path A ──┐
         ├──► IngestionService.processTransaction()
Path B ──┘              │
                        ▼
              INSERT INTO transactions (...)
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
   First writer succeeds        Second writer hits
   → status: inserted           UNIQUE(transaction_hash)
                                → Prisma P2002 caught
                                → status: duplicate_ignored
```

- **Database:** `UNIQUE` constraint on `transaction_hash` (Phase 2)
- **Application:** `create()` + catch `P2002` — no "SELECT then INSERT" race window
- **Result:** Exactly one row, no crash, clear log/status

**Test:** `npm run test --prefix backend` includes concurrent `processTransaction` simulation; `npm run db:test:duplicate` proves this at DB level.

---

## 2. Overlapping scheduled jobs

**Scenario:** Confirmation updater takes >12s (slow TronGrid) and the next tick fires.

**Mechanism:** `JobMutex` per job name (`reconciliation`, `confirmation-updater`).

- If a run is in progress, the new tick is **skipped** with a warn log
- Prevents double-processing pending rows and duplicate TronGrid calls in parallel

---

## 3. Batch processing isolation

**Scenario:** One malformed transfer in a reconciliation batch.

**Mechanism:** Each transfer is processed in its own `try/catch` inside the loop.

- One failure → logged, counted as `failed`
- Remaining transfers in the batch continue
- Top-level job `try/catch` ensures the scheduler keeps running

---

## 4. Watermark updates

**Scenario:** Reconciliation crashes after inserting txs but before updating `last_synced_timestamp`.

**Mechanism:**

- Re-fetching overlapping timestamps is **safe** because dedup is hash-based
- Watermark only advances after a successful batch when `transfers.length > 0`
- Worst case: re-process known hashes → all `duplicate_ignored`

---

## Technical discussion one-liner

> "We don't rely on application-level locks for dedup — the database unique constraint is the source of truth. Jobs use in-memory mutexes only to prevent overlapping scheduler ticks, not to coordinate writers."

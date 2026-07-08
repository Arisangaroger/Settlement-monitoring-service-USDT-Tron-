# Database Design Rationale

Short reference for the technical discussion — "Database Design" topic.

---

## Why `NUMERIC(38,6)` instead of float/double?

Currency amounts must be exact. IEEE floating point cannot represent decimal fractions like `0.1` precisely. A `numeric` type stores exact decimal values and matches USDT's 6-decimal precision. We also store `amount_raw` (the undivided integer from TronGrid) so amounts can be re-derived if a decimals bug is ever discovered.

## Why a DB-level unique constraint instead of application dedup?

The hybrid architecture has two ingestion paths (webhook + poll) that can detect the same transaction within milliseconds. Application-level "SELECT then INSERT" has a race window. `UNIQUE (transaction_hash)` makes duplicates impossible at the database layer. Ingestion uses `INSERT ... ON CONFLICT DO NOTHING` / Prisma `skipDuplicates` so the loser path exits cleanly without crashing.

## Why two status enums instead of one?

| Enum | Represents |
|------|------------|
| `confirmation_status` | Blockchain finality (pending → confirmed) |
| `processing_status` | Internal pipeline state (new → processed / failed) |

A transaction can be **confirmed on-chain** but still **new** in our pipeline (not yet forwarded to a downstream system). Combining them into one field would conflate external blockchain state with internal application state and make queries ambiguous.

## Why `BIGINT` for block number?

Block heights grow without bound. TRON mainnet is already in the tens of millions; other chains exceed 32-bit integer max (~2.1B). Using `bigint` from day one avoids a painful migration later.

## Why UUID primary keys?

- Non-sequential — external API consumers cannot infer row count or scrape by ID
- Safe for distributed ingestion and future replication
- Standard practice for service-owned entities

## Why `monitoring_wallets` for a single-wallet assessment?

Even with one wallet today, reconciliation needs a per-wallet bookmark (`last_synced_timestamp`, `last_synced_block`). A table makes multi-wallet support a configuration change, not a schema rewrite. Transactions link via `wallet_id` FK rather than duplicating the monitored address on every row.

## Why `webhook_events_log`?

When a webhook payload fails to parse or ingest, the raw JSON is the only artifact for debugging. Storing it separately (with `processed` flag) demonstrates operational maturity without polluting the transactions table with partial records.

## Why index `confirmation_status` but not `sender_address`?

The confirmation updater queries `WHERE confirmation_status = 'pending'` every 12 seconds. Dashboard stats count by status. `sender_address` is display-only in this assessment — no query or job filters by sender, so indexing it would add write overhead with no read benefit.

## Address format: base58 only

TronGrid returns base58 in TRC20 responses. Users and explorers expect `T...` addresses. Storing one canonical format avoids hex/base58 mismatch bugs.

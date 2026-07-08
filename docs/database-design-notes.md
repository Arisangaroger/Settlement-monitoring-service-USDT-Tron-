# Database Design Notes (Phase 2)

Design decisions captured **before** migration tooling, per Phase 2 plan sub-features 2.1–2.5.

---

## 2.1 — Requirements & Query Inventory

### Assignment baseline (non-negotiable fields)

| Assignment field | DB column | Notes |
|------------------|-----------|-------|
| Transaction Hash | `transaction_hash` | 64-char hex, unique |
| Sender Wallet Address | `sender_address` | base58 |
| Recipient Wallet Address | `recipient_address` | base58 |
| Amount | `amount` | numeric(38,6) human USDT |
| Token Symbol | `token_symbol` | e.g. USDT |
| Block Number | `block_number` | bigint |
| Transaction Timestamp | `block_timestamp` | timestamptz UTC |
| Confirmation Status | `confirmation_status` | enum pending/confirmed |
| Processing Status | `processing_status` | enum new/processed/duplicate_ignored/failed |

### Phase 1 extras (beyond assignment list)

| Field | Why store it |
|-------|--------------|
| `amount_raw` | Re-verify conversion without re-fetching chain |
| `contract_address` | Authoritative USDT verification (not symbol alone) |
| `confirmations` | Integer count updated by confirmation job |
| `source` | webhook vs poll — hybrid architecture observability |
| `wallet_id` | FK to monitored wallet (multi-wallet ready) |

### Address format decision

**Store base58 (`T...`) only** as the canonical format.

- TronGrid TRC20 responses return base58 for `from` / `to`
- Block explorers and wallets display base58
- Hex can be derived at display time if ever needed; storing both adds sync risk

### Required queries (Phase 4 API + Phase 3 jobs)

| # | Query | Used by |
|---|-------|---------|
| Q1 | List all transactions (paginated, newest first) | `GET /api/transactions` |
| Q2 | Get transaction by internal UUID | `GET /api/transactions/:id` |
| Q3 | Get transaction by hash | `GET /api/transactions/search?hash=` |
| Q4 | Filter by `confirmation_status` | Dashboard filter, list API |
| Q5 | Count transactions by `confirmation_status` | Dashboard stats |
| Q6 | Sum `amount` where `confirmation_status = confirmed` | Total USDT received stat |
| Q7 | Find pending txs for confirmation updater | Confirmation job (every 12s) |
| Q8 | Get active monitoring wallets | Reconciliation job |
| Q9 | Get `last_synced_timestamp` per wallet | Incremental poll (min_timestamp) |
| Q10 | Insert transaction (idempotent on hash) | Ingestion service |
| Q11 | Log raw webhook payload | Webhook receiver audit |

---

## 2.2 — `transactions` Column Definition

| Column | Type | Nullable | Default | Reasoning |
|--------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | PK; non-sequential external IDs |
| `wallet_id` | UUID | NO | — | FK → monitoring_wallets |
| `transaction_hash` | CHAR(64) | NO | — | Fixed-length TRON txID hex |
| `sender_address` | VARCHAR(34) | NO | — | TRON base58 max ~34 chars |
| `recipient_address` | VARCHAR(34) | NO | — | Monitored wallet (base58) |
| `amount` | NUMERIC(38,6) | NO | — | Human USDT; never float |
| `amount_raw` | VARCHAR(78) | NO | — | Raw integer string from TronGrid |
| `token_symbol` | VARCHAR(20) | NO | — | Display metadata |
| `contract_address` | VARCHAR(34) | NO | — | Official USDT contract check |
| `block_number` | BIGINT | NO | — | Chain block height |
| `block_timestamp` | TIMESTAMPTZ | NO | — | UTC; converted at write-time |
| `confirmations` | INTEGER | NO | 0 | Updated by confirmation job |
| `confirmation_status` | ENUM | NO | pending | Blockchain finality |
| `processing_status` | ENUM | NO | new | Pipeline handling state |
| `source` | ENUM | NO | — | webhook or poll |
| `created_at` | TIMESTAMPTZ | NO | now() | Audit |
| `updated_at` | TIMESTAMPTZ | NO | now() | Audit; auto-updated |

**PK strategy:** UUID — avoids exposing sequential IDs, safe for replication/sharding.

---

## 2.3 — Constraints

| Constraint | Mechanism |
|------------|-----------|
| Dedup | `UNIQUE (transaction_hash)` |
| Required fields | `NOT NULL` on hash, addresses, amount, amount_raw, block_number, block_timestamp, source |
| Positive amount | `CHECK (amount > 0)` |
| Wallet integrity | `FK wallet_id → monitoring_wallets(id)` |

### Duplicate insert race (webhook + poll)

Both paths call `INSERT ... ON CONFLICT (transaction_hash) DO NOTHING` (Prisma: `createMany({ skipDuplicates: true })` or raw upsert).

1. Path A inserts hash → succeeds, row created
2. Path B inserts same hash milliseconds later → unique constraint triggers conflict → no-op, no crash
3. Application returns `duplicate_ignored` processing status only if explicitly tracking failed inserts in a separate audit path; primary row remains from first writer

---

## 2.4 — Indexes

| Index | Column(s) | Justification |
|-------|-----------|---------------|
| (automatic) | `transaction_hash` UNIQUE | Q3 hash lookup + dedup |
| `transactions_confirmation_status_idx` | `confirmation_status` | Q5, Q7 pending scan |
| `transactions_block_number_idx` | `block_number` | Q9 block-based queries |
| `transactions_recipient_address_idx` | `recipient_address` | Multi-wallet filter |
| `monitoring_wallets_address_idx` | `address` UNIQUE | Wallet lookup by address |

**Not indexed:** `sender_address` — not queried in assessment scope; explain in rationale.

---

## 2.5 — Supporting Tables

### `monitoring_wallets`

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | UUID | NO | PK |
| `address` | VARCHAR(34) | NO | UNIQUE, base58 |
| `label` | VARCHAR(100) | YES | Human name |
| `active` | BOOLEAN | NO | default true |
| `last_synced_block` | BIGINT | YES | Reconciliation bookmark |
| `last_synced_timestamp` | TIMESTAMPTZ | YES | min_timestamp watermark (Phase 1) |
| `created_at` | TIMESTAMPTZ | NO | Audit |
| `updated_at` | TIMESTAMPTZ | NO | Audit |

### `webhook_events_log`

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | UUID | NO | PK |
| `raw_payload` | JSONB | NO | Full webhook body |
| `received_at` | TIMESTAMPTZ | NO | default now() |
| `processed` | BOOLEAN | NO | default false |
| `error_message` | TEXT | YES | If processing failed |

### Relationships

```
monitoring_wallets (1) ──< (N) transactions
webhook_events_log — standalone audit table (no FK to transactions; payload may not always parse)
```

`transactions.wallet_id` → `monitoring_wallets.id` (ON DELETE RESTRICT)

---

## Tooling choice

**Prisma** — TypeScript-first schema language, versioned migrations, excellent NestJS integration in Phase 3.

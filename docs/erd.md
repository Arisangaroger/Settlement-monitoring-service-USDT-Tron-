# Entity Relationship Diagram (ERD)

Generated from `prisma/schema.prisma` and migration `20260707210000_init`.  
**Last verified:** Phase 7 — matches live schema.

## Diagram

Rendered image: [erd.png](diagrams/erd.png) · [erd.svg](diagrams/erd.svg) (source: [diagrams/erd.mmd](diagrams/erd.mmd)).

![ERD](diagrams/erd.png)

```mermaid
erDiagram
    monitoring_wallets {
        uuid id PK
        varchar_34 address UK "TRON base58"
        varchar_100 label "nullable"
        boolean active "default true"
        bigint last_synced_block "nullable, poll watermark"
        timestamptz last_synced_timestamp "nullable"
        timestamptz created_at
        timestamptz updated_at
    }

    transactions {
        uuid id PK
        uuid wallet_id FK
        char_64 transaction_hash UK "hex, dedup key"
        varchar_34 sender_address
        varchar_34 recipient_address
        numeric_38_6 amount "human USDT"
        varchar_78 amount_raw "integer string from chain"
        varchar_20 token_symbol
        varchar_34 contract_address
        bigint block_number
        timestamptz block_timestamp
        int confirmations
        enum confirmation_status "pending | confirmed"
        enum processing_status "new | processed | duplicate_ignored | failed"
        enum source "webhook | poll"
        timestamptz created_at
        timestamptz updated_at
    }

    webhook_events_log {
        uuid id PK
        jsonb raw_payload "full provider body"
        timestamptz received_at
        boolean processed "default false"
        text error_message "nullable"
    }

    monitoring_wallets ||--o{ transactions : "wallet_id"
```

## Relationship summary

| Parent | Child | Cardinality | Foreign key | On delete |
|--------|-------|-------------|-------------|-----------|
| `monitoring_wallets` | `transactions` | 1:N | `transactions.wallet_id` | RESTRICT |
| — | `webhook_events_log` | standalone audit | — | — |

## Indexes and constraints

| Table | Constraint / index | Purpose |
|-------|-------------------|---------|
| `monitoring_wallets` | UNIQUE `address` | One row per watched wallet |
| `transactions` | UNIQUE `transaction_hash` | Cross-path deduplication |
| `transactions` | INDEX `confirmation_status` | Pending scans, stats |
| `transactions` | INDEX `block_number` | Reconciliation ordering |
| `transactions` | INDEX `recipient_address` | Future multi-wallet filter |
| `transactions` | CHECK `amount > 0` | Reject zero/negative (SQL migration) |

## Enum reference

| Enum | Values | Used for |
|------|--------|----------|
| `ConfirmationStatus` | `pending`, `confirmed` | Chain finality |
| `ProcessingStatus` | `new`, `processed`, `duplicate_ignored`, `failed` | Internal pipeline |
| `TransactionSource` | `webhook`, `poll` | Which path inserted first |

## Field notes

### `confirmation_status` vs `processing_status`

- **confirmation_status** — blockchain depth (updated by confirmation job)
- **processing_status** — ingestion/downstream state (extensible for future workers)

### `amount` + `amount_raw`

- **amount_raw** — exact integer string from TronGrid/Tatum (`1000000` = 1 USDT)
- **amount** — human-readable `DECIMAL(38,6)`

### `webhook_events_log`

Audit trail for every authenticated webhook delivery. Supports replay/debug if ingestion fails mid-flight.

## Verify against live DB

```bash
# Docker Compose
docker compose exec postgres psql -U settlement -d settlement_monitor -c "\dt"
docker compose exec postgres psql -U settlement -d settlement_monitor -c "\d transactions"

# Local dev (port 5433)
psql "postgresql://settlement:settlement@localhost:5433/settlement_monitor" -c "\d monitoring_wallets"
```

## Prisma source

See [`prisma/schema.prisma`](../prisma/schema.prisma) for the canonical ORM definition.

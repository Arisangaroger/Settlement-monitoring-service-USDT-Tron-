# Stablecoin Settlement Monitor — Architecture

This document reflects the **implemented** system. Verified against `prisma/schema.prisma`, NestJS modules, and `docker-compose.yml` (July 2026).

Rendered image: [architecture.png](diagrams/architecture.png) · [architecture.svg](diagrams/architecture.svg) (source: [diagrams/architecture.mmd](diagrams/architecture.mmd)).

![Architecture](diagrams/architecture.png)

## System context

```mermaid
flowchart TB
    subgraph External["External systems"]
        TRON[(TRON Shasta Testnet)]
        TATUM[Tatum Notifications]
        TRONGRID[TronGrid API]
    end

    subgraph Ingestion["Ingestion layer (NestJS backend)"]
        WH["POST /api/webhooks/tron<br/>HMAC validated"]
        RECON["Reconciliation job<br/>every 4 min"]
        CONF["Confirmation updater<br/>every 12 sec"]
        ING["IngestionService<br/>dedup via unique tx hash"]
    end

    subgraph Storage["Persistence"]
        PG[(PostgreSQL)]
        MW[(monitoring_wallets)]
        TX[(transactions)]
        LOG[(webhook_events_log)]
    end

    subgraph API["REST API"]
        REST["GET /transactions, /stats, /health<br/>Swagger /docs"]
    end

    subgraph UI["Presentation"]
        DASH["Next.js Dashboard<br/>port 3001"]
    end

    TRON --> TRONGRID
    TRON --> TATUM

    TATUM -->|webhook push| WH
    TRONGRID -->|poll TRC20| RECON

    WH --> ING
    RECON --> ING
    CONF --> TRONGRID
    CONF --> TX

    ING --> TX
    ING --> MW
    WH --> LOG

    TX --> PG
    MW --> PG
    LOG --> PG

    PG --> REST
    REST --> DASH
```

## Data flow — dual path ingestion

```mermaid
sequenceDiagram
    participant Chain as TRON Shasta
    participant Tatum as Tatum Webhook
    participant API as Backend API
    participant Poll as Reconciliation Job
    participant TG as TronGrid
    participant Ing as IngestionService
    participant DB as PostgreSQL

    Note over Chain,DB: Fast path (optional enhancement)
    Chain->>Tatum: USDT transfer detected
    Tatum->>API: POST /api/webhooks/tron + x-payload-hash
    API->>API: Verify HMAC secret
    API->>Ing: normalize Tatum → TRC20 shape
    Ing->>DB: INSERT (source=webhook) or skip duplicate

    Note over Chain,DB: Safety net (required)
    Poll->>TG: fetch incoming USDT since watermark
    TG-->>Poll: TRC20 transfers
    Poll->>Ing: processTrc20Transfer (source=poll)
    Ing->>DB: INSERT or skip duplicate (P2002)

    Note over Chain,DB: Confirmation tracking
    loop every 12s
        API->>DB: pending transactions
        API->>TG: latest block
        API->>DB: update confirmations / status
    end
```

## Component responsibilities

| Component | Role | Interval / trigger |
|-----------|------|-------------------|
| **Tatum webhook** | Push near-real-time token transfers | On-chain event |
| **Reconciliation job** | Poll TronGrid for missed events | 240s default |
| **Confirmation updater** | Advance pending → confirmed | 12s default |
| **IngestionService** | Validate, dedup, persist | Both paths |
| **REST API** | Read model for dashboard | On request |
| **Dashboard** | Stats, table, search, filters | Poll API every 10s |

## Deployment (Docker Compose)

```mermaid
flowchart LR
    USER[Browser] --> FE[frontend :3001]
    FE -->|NEXT_PUBLIC_API_URL| BE[backend :3000]
    BE --> PG[postgres :5432 internal]
    BE --> TRONGRID
    TATUM -->|public URL only| BE
```

## Key design decisions

1. **Hybrid webhook + polling** — webhook is fast path; polling is the reliability guarantee.
2. **Single ingestion pipeline** — both paths normalize to `TronGridTrc20Transfer` before `IngestionService`.
3. **Dedup at DB** — unique `transaction_hash`; concurrent inserts catch P2002.
4. **Numeric amounts** — `DECIMAL(38,6)` + raw string; no float for money.
5. **Confirmation threshold** — 19 blocks default (production-minded custodial pattern).

## Related docs

- [ERD](./erd.md) — database schema
- [API contract](./api-contract.md) — REST endpoints
- [Race conditions](./race-conditions.md) — dedup and job overlap
- [API security checklist](./api-security-checklist.md)

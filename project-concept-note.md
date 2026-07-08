  # Project Concept Note
## Stablecoin Settlement Monitoring Service (USDT TRC20 / TRON)

---

## 1. Executive Summary (Non-Technical)

This project is a monitoring service that watches a specific TRON blockchain wallet address and automatically detects whenever someone sends USDT (a dollar-pegged cryptocurrency) to it. Every incoming payment is recorded, verified for authenticity, and displayed on a simple dashboard — similar to how an online banking app shows you incoming deposits, except the "bank" here is the TRON public blockchain instead of a traditional financial institution.

The service is designed the way real-world crypto payment processors are built: it doesn't just check "did money arrive" once — it continuously watches, double-checks itself, avoids counting the same payment twice, and tracks how "final" each payment is before treating it as fully settled.

---

## 2. Goals & Scope

**In scope:**
- Monitor one TRON wallet address for incoming USDT (TRC20) transfers
- Detect, verify, and persist transaction data reliably (no duplicates, no silent misses)
- Track confirmation progress until a transaction is considered final
- Expose the data via documented REST APIs
- Present the data via a clean, responsive dashboard
- Containerize the whole stack for easy setup and evaluation

**Out of scope (explicitly, to keep the assessment focused):**
- Sending/outgoing transactions (no private key handling, no signing)
- Multi-wallet monitoring (single address for this assessment; architecture will note how it'd generalize)
- Fiat conversion, invoicing, or accounting logic beyond raw transaction tracking

---

## 3. System Architecture

### 3.1 High-Level Architecture Diagram (described)

```
                        ┌─────────────────────────────┐
                        │        TRON Blockchain        │
                        │   (via TronGrid Full Node API)│
                        └───────────────┬───────────────┘
                                        │
                ┌───────────────────────┼───────────────────────────┐
                │                       │                            │
     (A) Webhook Path            (B) Polling Path             (used by both)
                │                       │                            │
     ┌──────────▼──────────┐  ┌─────────▼─────────────┐             │
     │  QuickNode Webhook    │  │  Reconciliation Job    │             │
     │  → HTTP POST          │  │  (every 5 min)         │             │
     │  /api/webhooks/tron   │  │  queries TronGrid      │             │
     └──────────┬───────────┘  └─────────┬──────────────┘             │
                │                        │                            │
                └───────────┬────────────┘                            │
                            ▼                                         │
              ┌───────────────────────────┐                           │
              │   Transaction Ingestion     │◄──────────────────────────┘
              │   Service (dedup + parse)   │     (C) Confirmation Updater
              │  - validates payload        │        (every 12 sec)
              │  - normalizes tx data       │        re-checks pending txs,
              │  - unique constraint on     │        updates confirmation
              │    tx_hash prevents dupes   │        count until "confirmed"
              └─────────────┬──────────────┘
                            ▼
              ┌───────────────────────────┐
              │        PostgreSQL           │
              │   (transactions table +     │
              │    supporting tables)       │
              └─────────────┬──────────────┘
                            ▼
              ┌───────────────────────────┐
              │     REST API (Express/      │
              │        NestJS + TS)         │
              │  - /transactions            │
              │  - /transactions/:hash      │
              │  - /stats                   │
              │  - Swagger/OpenAPI docs     │
              └─────────────┬──────────────┘
                            ▼
              ┌───────────────────────────┐
              │   React/Next.js Dashboard   │
              │  - totals, recent txs,      │
              │    confirmed/pending views  │
              └───────────────────────────┘
```

### 3.2 Why this hybrid design (Webhook + Polling Reconciliation)

| Concern | How it's addressed |
|---|---|
| Real-time detection | QuickNode webhook pushes new TRC20 transfers to our backend almost instantly |
| Missed events (downtime, network blips, provider outage) | Reconciliation poll runs every **5 minutes**, re-queries TronGrid directly and inserts anything the webhook missed |
| Duplicate processing | Both paths write through the same ingestion service; `transaction_hash` has a unique DB constraint, so whichever path arrives first "wins" and the second is a no-op |
| Confirmation finality | A separate lightweight job runs every **12 seconds**, re-checking only transactions still marked "pending" and updating their confirmation count |
| Local/demo testability | Since webhooks require a public URL, polling alone is enough to fully demonstrate the system locally; webhook is an enhancement layer, documented as production-oriented |

### 3.3 Job/Interval Summary

| Job | Interval | Purpose |
|---|---|---|
| Reconciliation poll | 5 minutes | Safety net — catch anything the webhook missed |
| Confirmation updater | 12 seconds | Refresh confirmation counts on pending transactions so the dashboard stays near-live |
| Webhook receiver | Event-driven (no interval) | Fast-path detection when a provider webhook is configured |

Both intervals are environment-configurable (not hardcoded), e.g. `RECONCILIATION_INTERVAL_MS`, `CONFIRMATION_CHECK_INTERVAL_MS`.

---

## 4. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Language | TypeScript | End-to-end type safety, backend + frontend |
| Backend framework | NestJS  | Structured modules for ingestion, jobs, API, webhooks |
| Blockchain data source | TronGrid API (+ optional `tronweb` library) | Fetching TRC20 transfer history/events |
| Webhook provider (optional/bonus) | QuickNode Streams/Webhooks | Real-time push notifications for TRC20 transfers |
| Database | PostgreSQL | Relational integrity, unique constraints for dedup |
| ORM | Prisma  | Migrations, type-safe queries |
| Background jobs | BullMQ (Redis-backed)  | Scheduling reconciliation & confirmation jobs |
| Frontend | Next.js | Dashboard UI |
| API docs | Swagger/OpenAPI (via `@nestjs/swagger` or `swagger-jsdoc`) | Auto-generated interactive docs |
| Containerization | Docker + Docker Compose | One-command setup: backend, frontend, Postgres, (Redis if used) |
| Logging/monitoring (bonus) | Pino + basic health endpoint | Structured logs for debugging |
| Testing | Jest (unit) + Supertest (integration) | Bonus requirement coverage |
| CI/CD (bonus) | GitHub Actions | Lint, test, build on push |

---

## 5. Data Model (informing the ERD)

### 5.1 Core entity: `transactions`

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | Internal identifier |
| transaction_hash | string, unique, indexed | TRON tx hash — dedup key |
| sender_address | string | TRON base58 address |
| recipient_address | string | Should match monitored wallet |
| amount | numeric(38,6) | Stored in human-readable USDT units (post-decimal conversion) |
| token_symbol | string | e.g. "USDT" |
| contract_address | string | TRC20 contract, for correctness/auditing |
| block_number | bigint | Block the tx was included in |
| block_timestamp | timestamptz | On-chain timestamp |
| confirmations | integer | Updated by confirmation job |
| confirmation_status | enum (`pending`, `confirmed`) | Derived from confirmations vs threshold |
| processing_status | enum (`new`, `processed`, `duplicate_ignored`, `failed`) | Internal pipeline state |
| source | enum (`webhook`, `poll`) | Which path first detected it — useful for debugging/metrics |
| created_at / updated_at | timestamptz | Standard audit columns |

### 5.2 Supporting entity: `monitoring_wallets` (future-proofing for multi-wallet)

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| address | string, unique | The wallet being watched |
| label | string | Human-friendly name |
| active | boolean | Enable/disable monitoring without deleting config |
| last_synced_block | bigint | Bookmark for the reconciliation poller |

### 5.3 Supporting entity: `webhook_events_log` (optional, for auditability)

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| raw_payload | jsonb | Full received payload, for debugging/replay |
| received_at | timestamptz | |
| processed | boolean | Whether it successfully led to a transaction record |

*A full ERD diagram (crow's-foot notation) will be generated separately showing these relationships.*

---

## 6. REST API Design

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/transactions` | GET | List all transactions (paginated, filterable by status) |
| `/api/transactions/:id` | GET | Retrieve single transaction detail |
| `/api/transactions/search?hash=` | GET | Search by transaction hash |
| `/api/stats` | GET | Dashboard stats: total tx count, total USDT received, confirmed count, pending count |
| `/api/webhooks/tron` | POST | Receiver endpoint for provider webhook payloads |
| `/api/health` | GET | Health check (bonus: monitoring) |
| `/docs` | GET | Swagger/OpenAPI UI |

---

## 7. Dashboard (Frontend)

**Key views:**
- Summary cards: Total Transactions, Total USDT Received, Confirmed Count, Pending Count
- Recent Transactions table: hash (truncated + copyable), amount, status badge, timestamp
- Simple status filter (All / Confirmed / Pending)
- Responsive layout (mobile-friendly, since dashboards are often checked on the go)

---

## 8. Security Considerations

- No private keys anywhere in the system (monitoring only, never sending funds)
- All secrets (DB credentials, TronGrid/QuickNode API keys) via environment variables, never committed — `.env.example` provided with placeholder values
- Webhook endpoint validated using the provider's signing/validation token to reject spoofed requests
- Input validation on all API endpoints (e.g., hash format validation on search)
- Rate limiting on public-facing API endpoints
- Least-privilege DB user for the application (not superuser)
- Dependency vulnerability scanning as part of CI (bonus)

---

## 9. Implementation Roadmap (Chronological)

| Phase | Deliverable |
|---|---|
| **1. Blockchain PoC** | Standalone script confirming real TronGrid response shapes, decimal handling, confirmation field behavior |
| **2. Database design** | Finalized schema + ERD, informed by real data from Phase 1 |
| **3. Backend core** | Ingestion service, reconciliation job (5 min), confirmation updater (12 sec), dedup logic — verified directly against Postgres, no API yet |
| **4. REST APIs** | All endpoints + Swagger docs, built against the proven data layer |
| **5. Webhook endpoint** | `/api/webhooks/tron` wired into the same ingestion service as Phase 3 |
| **6. Frontend dashboard** | Built last, against stable, finished APIs |
| **7. Docker, docs, diagrams, polish** | docker-compose.yml, README, architecture diagram, ERD export, `.env.example`, tests |

---

## 10. Deliverables Checklist

- [ ] Source code (Git repository)
- [ ] README with setup instructions
- [ ] Architecture diagram
- [ ] ERD
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Docker configuration (Dockerfile(s) + docker-compose.yml)
- [ ] `.env.example`
- [ ] Unit tests (bonus)
- [ ] Integration tests (bonus)
- [ ] CI/CD pipeline (bonus)
- [ ] Logging/monitoring setup (bonus)

---

## 11. Anticipated Technical Discussion Points

Points to be ready to defend live, per the assessment's "Technical Discussion" stage:
- Why hybrid webhook+polling instead of either alone
- Why 5-minute reconciliation and 12-second confirmation intervals specifically, and how they're configurable
- How dedup is guaranteed across two ingestion paths (unique constraint reasoning)
- What confirmation threshold is used for TRON finality and why
- How the design would generalize to multiple wallets
- Trade-offs of TronGrid direct polling vs. a paid webhook provider at scale

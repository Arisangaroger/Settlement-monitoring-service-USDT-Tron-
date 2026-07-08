# Stablecoin Settlement Monitor

[![CI](https://github.com/Arisangaroger/Settlement-monitoring-service-USDT-Tron-/actions/workflows/ci.yml/badge.svg)](https://github.com/Arisangaroger/Settlement-monitoring-service-USDT-Tron-/actions/workflows/ci.yml)

Monitors incoming **USDT (TRC20)** transfers on **TRON Shasta testnet** for a configured wallet. Detects payments via **TronGrid polling** (required) and **Tatum webhooks** (optional fast path), stores them in PostgreSQL with deduplication, and exposes a REST API plus a Next.js dashboard.

## Architecture

![Architecture diagram](docs/diagrams/architecture.png)

See **[docs/architecture.md](docs/architecture.md)** for the full set of Mermaid diagrams (system context, sequence flow, Docker topology). Diagram sources live in [docs/diagrams/](docs/diagrams/) as versioned `.mmd` files rendered to SVG/PNG.

## Quick start (Docker — recommended for evaluators)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose v2)
- TronGrid API key: https://www.trongrid.io/
- Shasta test wallet with incoming USDT activity

### Steps

```bash
git clone <your-repo-url>
cd assessment

cp .env.example .env
# Edit .env — set at minimum:
#   TRONGRID_API_KEY
#   MONITORED_WALLET_ADDRESS

docker compose up --build
```

### URLs

| Service | URL |
|---------|-----|
| **Dashboard** | http://localhost:3001 |
| **API** | http://localhost:3000/api |
| **Swagger** | http://localhost:3000/docs |
| **OpenAPI JSON** | http://localhost:3000/docs-json |
| **Health** | http://localhost:3000/api/health |
| **Postgres** (optional) | `localhost:5433` — user `settlement`, password `settlement`, db `settlement_monitor` |

Migrations run automatically on backend startup.

### Smoke test

1. Open the dashboard — stats and transaction table should load.
2. Send a small test USDT transfer to your monitored wallet on Shasta.
3. Within ~5 minutes (reconciliation interval), the tx appears in the dashboard.
4. Search the tx hash in the dashboard search box.
5. Watch `confirmationStatus` move from `pending` → `confirmed` (confirmation job every 12s).

Optional: configure Tatum webhook → `https://<your-public-url>/api/webhooks/tron` for near-instant delivery.

---

## Local development (without Docker)

### Prerequisites

- Node.js 22+
- Postgres (or `docker compose up postgres -d` for DB only)

```bash
npm ci
npm ci --prefix backend
npm ci --prefix frontend

cp .env.example .env
# DATABASE_URL uses port 5433 when using compose Postgres

npx prisma migrate deploy
npx prisma generate

npm run backend:dev    # terminal 1 — http://localhost:3000
npm run frontend:dev   # terminal 2 — http://localhost:3001
```

---

## Project structure

```
assessment/
├── backend/          NestJS API, jobs, webhook, ingestion
├── frontend/         Next.js dashboard (Afacad + Outfit)
├── prisma/           Schema + migrations
├── docs/             Architecture, ERD, API contract, security
├── poc/              Phase 1 blockchain exploration scripts
├── docker-compose.yml
└── .env.example
```

## Database schema

![Entity-relationship diagram](docs/diagrams/erd.png)

See **[docs/erd.md](docs/erd.md)** for the annotated entity-relationship diagram (verified against `prisma/schema.prisma`).

| Table | Purpose |
|-------|---------|
| `monitoring_wallets` | Watched addresses + poll watermark |
| `transactions` | USDT transfers (unique `transaction_hash`) |
| `webhook_events_log` | Raw webhook audit trail |

## API documentation

- Contract: [docs/api-contract.md](docs/api-contract.md)
- Interactive: http://localhost:3000/docs (when backend is running)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/transactions` | Paginated list + filters |
| GET | `/api/transactions/search?hash=` | Lookup by tx hash |
| GET | `/api/transactions/:id` | Lookup by UUID |
| GET | `/api/stats` | Dashboard aggregates |
| GET | `/api/health` | Health + DB check |
| POST | `/api/webhooks/tron` | Tatum webhook receiver |

## Design decisions

| Topic | Decision | Why |
|-------|----------|-----|
| Ingestion | Webhook + polling hybrid | Fast path + reliability |
| Dedup | Unique `transaction_hash` + P2002 | Safe under concurrency |
| Amounts | `DECIMAL(38,6)` + raw string | No float precision loss |
| Confirmations | 19 block threshold | Production-minded custodial pattern |
| Provider | Tatum (Shasta) + TronGrid | QuickNode TRON webhooks are mainnet-only |
| Webhook security | HMAC when secret set | Dev bypass if `TATUM_WEBHOOK_HMAC_SECRET` unset |

See [docs/technical-discussion-notes.md](docs/technical-discussion-notes.md) for live discussion prep.

## Testing

```bash
npm run backend:test
npm run backend:test:e2e
npm run frontend:test
```

CI runs these on push (see `.github/workflows/ci.yml`).

## Logging

Structured JSON logs via **Pino** (pretty-print in development):

```bash
docker compose logs -f backend
```

Jobs log reconciliation stats, ingestion results, and webhook events.

## Security

- Helmet, CORS, rate limiting, DTO validation
- Webhook HMAC (`x-payload-hash`) when `TATUM_WEBHOOK_HMAC_SECRET` is configured
- No secrets in repository — see [docs/security-verification.md](docs/security-verification.md)

## Known limitations

- Single monitored wallet (schema supports multi-wallet extension)
- Incoming USDT only — no outgoing txs / signing
- Shasta testnet for development
- Live webhooks require a public HTTPS URL (Render, ngrok, etc.)

## Bonus features implemented

- [x] Background reconciliation + confirmation jobs
- [x] Confirmation tracking (pending → confirmed)
- [x] Structured logging (Pino)
- [x] Webhook fast path (Tatum)
- [x] Backend unit + e2e tests
- [x] Frontend component tests
- [x] Docker Compose full stack
- [x] GitHub Actions CI
- [x] Swagger / OpenAPI docs

## Environment variables

See [.env.example](.env.example) for the complete list with comments.

**Required:** `DATABASE_URL`, `TRONGRID_API_KEY`, `MONITORED_WALLET_ADDRESS`  
**Recommended for webhooks:** `TATUM_WEBHOOK_HMAC_SECRET`

## License

Assessment project — internal use.

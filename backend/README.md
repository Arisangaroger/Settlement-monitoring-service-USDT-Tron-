# Backend — Settlement Monitor API

NestJS service: TronGrid polling, Tatum webhooks, ingestion, confirmation tracking, REST API.

## Prerequisites

- Postgres running: `npm run db:up` (from repo root)
- Migrations applied: `npm run db:migrate:deploy`
- `.env` at repo root with required variables

## Run

```bash
# From repo root (Postgres must be up: npm run db:up)
npm run backend:dev
```

- API base: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/docs`

Run `npm run db:generate` only after changing `prisma/schema.prisma`.

## API endpoints

| Method | Path |
|--------|------|
| GET | `/api/transactions` |
| GET | `/api/transactions/search?hash=` |
| GET | `/api/transactions/:id` |
| GET | `/api/stats` |
| GET | `/api/health` |
| POST | `/api/webhooks/tron` |

See [docs/api-contract.md](../docs/api-contract.md).

## Webhooks (Phase 5 — optional fast path)

The system works fully via **TronGrid polling alone**. The webhook endpoint is an enhancement for near-real-time delivery from [Tatum](https://docs.tatum.io/docs/authenticating-notification-webhooks) (Shasta/Nile testnet).

### Provider setup

1. Create a Tatum **ADDRESS_EVENT** subscription on `tron-testnet` for your monitored wallet.
2. Enable **HMAC** in Tatum and copy the secret into `.env` as `TATUM_WEBHOOK_HMAC_SECRET`.
3. Point the subscription URL at a **public HTTPS** endpoint:
   - **Production / demo:** `https://your-app.onrender.com/api/webhooks/tron`
   - **Local dev:** use [ngrok](https://ngrok.com/) — `ngrok http 3000` → `https://<id>.ngrok-free.app/api/webhooks/tron`

### Local testing with ngrok (development only)

```bash
# Terminal 1
npm run backend:dev

# Terminal 2
ngrok http 3000
```

Update Tatum webhook URL to `https://<ngrok-host>/api/webhooks/tron`, send a test USDT transfer on Shasta, and confirm logs show `TRON webhook ingested`.

Evaluators running Docker Compose locally **do not need** ngrok or Tatum — polling satisfies all core requirements.

### Webhook behaviour

| Condition | HTTP response |
|-----------|---------------|
| Invalid HMAC | `401 Unauthorized` |
| Malformed JSON payload | `400 Bad Request` |
| Valid payload (new tx) | `200` + `{ status: "inserted" }` |
| Valid payload (duplicate replay) | `200` + `{ status: "duplicate_ignored" }` |

Every authenticated delivery is recorded in `webhook_events_log` before ingestion runs.

## Environment variables

See root `.env.example`. Required:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Postgres connection (port 5433 if using project docker-compose) |
| `MONITORED_WALLET_ADDRESS` | Shasta/Nile test wallet |
| `TRONGRID_API_KEY` | TronGrid API key |
| `TRON_NETWORK` | `shasta`, `nile`, or `mainnet` |

Optional:

| Variable | Default |
|----------|---------|
| `RECONCILIATION_INTERVAL_MS` | 300000 (5 min) |
| `CONFIRMATION_CHECK_INTERVAL_MS` | 12000 (12 sec) |
| `CONFIRMATION_THRESHOLD` | 19 |
| `TATUM_WEBHOOK_HMAC_SECRET` | *(unset = HMAC disabled for local curl tests)* |

## Module layout

```
src/
  modules/
    blockchain/   TronGrid client + pure utils
    config/       Validated env loading
    ingestion/    Shared dedup-safe persist path
    jobs/         Reconciliation + confirmation updater
    prisma/       PrismaService
    transactions/ REST queries
    wallets/      monitoring_wallets access
    webhooks/     Tatum receiver + audit log
  app.module.ts
  main.ts
```

## Race conditions & dedup

Polling and webhooks both call `IngestionService.processTrc20Transfer`. Duplicate `transaction_hash` values are ignored via DB unique constraint (P2002). See [docs/race-conditions.md](../docs/race-conditions.md).

## Tests

```bash
npm run test --prefix backend
npm run test:e2e --prefix backend
```

E2e webhook tests cover HMAC validation, ingestion, duplicate replay, and `webhook_events_log` audit rows.

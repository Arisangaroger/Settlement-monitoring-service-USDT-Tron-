# Technical Discussion Prep Notes

Internal prep document — key decisions and talking points.

## Elevator pitch

Monitors one TRON wallet for incoming USDT (TRC20), ingests via **webhook + polling**, stores in PostgreSQL with dedup, exposes REST API and Next.js dashboard.

## Architecture

- **Why hybrid?** Webhooks are fast but can fail (downtime, missed events). Polling is the safety net.
- **Why Tatum not QuickNode?** QuickNode TRON webhooks are mainnet-only; we use Shasta testnet + Tatum ADDRESS_EVENT.
- **Single ingestion path** — both normalize to same shape before `IngestionService`.

## Database

- **Unique `transaction_hash`** — dedup across concurrent webhook + poll
- **`DECIMAL(38,6)`** for amounts — avoid float precision issues
- **`amount_raw`** preserved — audit trail to chain integer
- **`monitoring_wallets`** — forward-looking for multi-wallet (assessment is single wallet)
- **`webhook_events_log`** — audit every webhook delivery

## Jobs

| Job | Default | Why |
|-----|---------|-----|
| Reconciliation | 5 min | TronGrid rate limits; sufficient for assessment |
| Confirmation updater | 12 sec | Blocks ~3s on TRON; pending txs update quickly |
| Threshold | 19 confirmations | Production-minded custodial pattern |

## Race conditions

- **JobMutex** — prevents overlapping reconciliation runs
- **P2002 on insert** — duplicate hash from concurrent paths → ignore safely
- **Watermark** — `last_synced_timestamp` on wallet for incremental poll

## Security

- Helmet, CORS, throttling, DTO validation
- Webhook HMAC when secret configured
- Secrets in env only

## Scalability story

- Add wallets → rows in `monitoring_wallets`, filter poll per wallet
- Horizontal backend → stateless API; jobs need single-leader or distributed lock
- Webhook per deployment URL or router by subscription

## Known limitations

- Single monitored wallet (config)
- Incoming USDT only (no outgoing/signing)
- Shasta testnet for development
- Webhook requires public HTTPS URL for live Tatum delivery

## Demo flow

1. `docker compose up --build`
2. Open dashboard http://localhost:3001
3. Send test USDT on Shasta to monitored wallet
4. Watch tx appear (poll within 5 min, or webhook if configured)
5. Confirm status flips pending → confirmed
6. Search by hash in dashboard

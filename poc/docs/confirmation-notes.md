# Confirmation Counting Notes

## Formula

```
confirmations = latest_block_number - transaction_block_number + 1
```

Inclusive counting: a transaction in the current latest block has **1** confirmation.

Implemented in `src/utils/confirmations.ts`.

## Data sources

| Value | Endpoint |
|-------|----------|
| Latest block number | `GET /wallet/getnowblock` → `block_header.raw_data.number` |
| Transaction block number | `POST /wallet/gettransactioninfobyid` → `blockNumber` |

The TRC20 history endpoint provides `block_timestamp` but **not** `block_number`; the secondary lookup is required unless the webhook provider includes block number (QuickNode often does).

## Chosen threshold

**Default: 19 confirmations** (configurable via `CONFIRMATION_THRESHOLD`).

### Reasoning

| Factor | Detail |
|--------|--------|
| Block time | TRON targets ~3 seconds per block |
| 19 blocks | ≈ 57 seconds of chain depth |
| Consensus | TRON uses DPoS; blocks are produced by elected Super Representatives and achieve practical finality quickly |
| Industry practice | Many custodial integrations use 1–20 confirmations on TRON; 19 is a conservative middle ground between speed and safety |
| Assessment fit | Gives a visible `pending → confirmed` transition for the dashboard without waiting excessively on testnet |

For the assessment demo on Nile, even **1 confirmation** would be defensible given testnet conditions; we default to **19** to mirror a production-minded custodial integration and make confirmation tracking meaningful in the UI.

## Status derivation

```
confirmation_status = confirmations >= CONFIRMATION_THRESHOLD ? "confirmed" : "pending"
```

## Live observation script

```bash
npm run confirmations -- <transaction_hash>
```

Re-run on a very recent transaction to watch confirmations increment as new blocks are produced (~3s apart).

## Example (Nile, captured during PoC setup)

| Field | Value |
|-------|-------|
| Transaction hash | `4cfd9932a49304fb6b75bf4e137f7f24d62d9f82f9ef19f9f0b087bd73b69978` |
| Transaction block | `68982908` |
| Latest block (at check time) | `68984482` |
| Confirmations | `68984482 - 68982908 + 1 = 1575` |
| Status (threshold 19) | `confirmed` |

## Phase 3 job design

The **Confirmation Updater** (every 12 seconds, per project concept note) will:

1. Query DB for rows where `confirmation_status = 'pending'`
2. Fetch current latest block once per run
3. Recompute confirmations per pending tx (using stored `block_number`)
4. Flip status to `confirmed` when threshold is met

No per-transaction TronGrid call is needed on each confirmation tick if `block_number` was captured at ingest time.

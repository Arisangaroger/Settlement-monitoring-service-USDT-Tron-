# TronGrid TRC20 Field Glossary

Source endpoint: `GET /v1/accounts/{address}/transactions/trc20`

Observed on **Nile testnet** via TronGrid (July 2026). Mainnet responses use the same field shapes.

## Response envelope

| Raw field | Meaning | Unit / format | Maps to DB (Phase 2) |
|-----------|---------|---------------|----------------------|
| `success` | Whether the API call succeeded | boolean | (not stored) |
| `data[]` | Array of TRC20 activity records | array | one row per incoming transfer |
| `meta.at` | TronGrid response timestamp | milliseconds (UTC epoch) | (not stored) |
| `meta.page_size` | Items returned this page | integer | (not stored) |
| `meta.fingerprint` | Cursor for next page | opaque string | (not stored) |
| `meta.links.next` | Fully-formed next-page URL | URL | (not stored) |

## Transfer record (`data[i]`)

| Raw field | Meaning | Unit / format | Storage decision |
|-----------|---------|---------------|------------------|
| `transaction_id` | On-chain transaction hash (txID) | 64-char hex string | `transaction_hash` (unique) |
| `from` | Sender wallet | TRON **base58** (`T...`) | `sender_address` — **store base58** |
| `to` | Recipient wallet | TRON **base58** (`T...`) | `recipient_address` — **store base58** |
| `value` | Raw token amount | integer string in smallest unit | convert → `amount` numeric(38,6) |
| `type` | Contract function invoked | e.g. `Transfer`, `Approve` | filter: only ingest `Transfer` |
| `block_timestamp` | Time tx was included in a block | **milliseconds**, UTC epoch | `block_timestamp` timestamptz |
| `token_info.symbol` | Token ticker from contract metadata | string e.g. `USDT` | `token_symbol` — **do not trust alone** |
| `token_info.address` | TRC20 contract address | base58 | `contract_address` — **authoritative filter** |
| `token_info.decimals` | Token decimal places | integer (USDT = 6) | used at ingest for amount conversion |
| `token_info.name` | Human-readable token name | string | optional metadata |

## Fields NOT in TRC20 list response (secondary lookup required)

| Field | How to obtain | Notes |
|-------|---------------|-------|
| `block_number` | `POST /wallet/gettransactioninfobyid` with `{ "value": "<tx_hash>" }` | Returns `blockNumber` (integer) |
| `confirmations` | Computed: `latest_block - tx_block + 1` | Not returned directly by TronGrid |
| `confirmation_status` | Derived from confirmations vs threshold | Application logic |

## Address format standardization

TronGrid v1 TRC20 responses return **`from` / `to` in base58** (`T...`). Hex variants can appear in other endpoints; we standardize on **base58** for storage and comparison because that is what explorers and wallets display.

## Amount conversion

```
human_amount = raw_value / 10^decimals
```

Example from Nile sample:
- `value`: `"1000000000"`
- `decimals`: `6`
- Result: `1000` USDT

Implementation: `rawAmountToDecimal()` in `src/utils/amount.ts` (string-based, no float drift).

## Security: verifying "real USDT"

**Never trust `token_info.symbol` alone.** Anyone can deploy a TRC20 token named "USDT".

Always match `token_info.address` against the known official contract:

| Network | Official USDT contract |
|---------|------------------------|
| Nile | `TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf` |
| Mainnet | `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t` |
| Shasta | `TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs` |

Also require `type === "Transfer"` and `to === monitored_wallet`.

## Confirmation status in API response

TronGrid does **not** return a ready-made confirmation count on the TRC20 list endpoint. The `only_confirmed` query param filters to confirmed-on-network txs but does not expose a numeric confirmation depth. We compute confirmations ourselves (see `docs/confirmation-notes.md`).

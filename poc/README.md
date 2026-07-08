# Phase 1 — Blockchain PoC

Throwaway scripts to explore TRON / USDT (TRC20) data via TronGrid before building the real backend.

## Prerequisites

- Node.js 18+ (uses native `fetch`)
- A **Nile testnet** wallet address with some incoming test USDT activity

### One-time setup (manual)

1. Create a TronGrid account and API key (recommended; optional on Nile): https://www.trongrid.io/
2. Install [TronLink](https://www.tronlink.org/) and switch to **Nile testnet**
3. Fund your wallet at https://nileex.io/join/getJoinPage (TRX + USDT test tokens)
4. Send a small test USDT transfer **to your own monitored address** so there is activity to detect
5. (Optional, for 1.7) Create a QuickNode TRON Nile endpoint for later webhook capture

## Quick start

```bash
cd poc
cp .env.example .env
# Edit .env — set MONITORED_WALLET_ADDRESS to your Nile wallet

npm install
npm run health          # 1.1 — verify TronGrid connectivity
npm run fetch:raw       # 1.2 — save raw JSON sample
npm run list:usdt       # consolidated — parsed incoming USDT summary
npm run confirmations -- <tx_hash>   # 1.4 — live confirmation count
npm run test:pagination # 1.5 — pagination / min_timestamp experiments
npm run test:rate-limits # 1.6 — burst + invalid address samples
```

## Environment variables

See `.env.example` for all options. Minimum required:

```env
TRON_NETWORK=nile
MONITORED_WALLET_ADDRESS=TYourNileWalletAddress...
```

## Phase 1 deliverables in this folder

| Artifact | Location |
|----------|----------|
| Raw TronGrid TRC20 sample | `sample-responses/trc20-transfer-raw.json` |
| Webhook payload sample | `sample-responses/webhook-payload-raw.json` (replace after QuickNode capture) |
| Field glossary | `docs/field-glossary.md` |
| Confirmation notes | `docs/confirmation-notes.md` |
| Pagination strategy | `docs/pagination-strategy.md` |
| Rate limits & errors | `docs/rate-limits-and-errors.md` |
| Main summary script | `npm run list:usdt` |

## Network reference

| Network | TronGrid URL | USDT contract |
|---------|--------------|---------------|
| Nile | `https://nile.trongrid.io` | `TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf` |
| Mainnet | `https://api.trongrid.io` | `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t` |

## Sub-feature 1.7 — Webhook capture (manual)

QuickNode setup cannot be automated here. Follow the instructions in `sample-responses/webhook-payload-raw.json` and overwrite that file with the real payload once captured.

## Next phase

Phase 2 uses `docs/field-glossary.md` and these samples to finalize the PostgreSQL schema and ERD.

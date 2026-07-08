# Pagination & Incremental Fetch Strategy

For Phase 3 reconciliation polling (every 5 minutes).

## TronGrid pagination mechanism

The TRC20 endpoint supports cursor pagination via **`meta.fingerprint`**:

1. First request: normal query params (`limit`, `contract_address`, `only_to`, etc.)
2. Subsequent pages: pass `fingerprint=<meta.fingerprint from previous response>`
3. **Important:** when using `fingerprint`, all other filters must remain identical

Also available: `meta.links.next` contains a fully-formed URL for the next page.

## Supported time filters

| Parameter | Unit | Purpose |
|-----------|------|---------|
| `min_timestamp` | milliseconds | Return txs with `block_timestamp >= min` |
| `max_timestamp` | milliseconds | Return txs with `block_timestamp <= max` |
| `order_by` | `block_timestamp,asc` or `block_timestamp,desc` | Sort direction (desc is default) |

There is **no** `min_block_number` query parameter on this endpoint.

## Recommended Phase 3 strategy

**Primary: timestamp watermark per wallet**

Store `last_synced_timestamp` (milliseconds) on `monitoring_wallets` (or env for single-wallet MVP).

Each reconciliation poll:

```
GET /v1/accounts/{wallet}/transactions/trc20
  ?contract_address={official_usdt}
  &only_to=true
  &only_confirmed=true
  &min_timestamp={last_synced_timestamp + 1}
  &order_by=block_timestamp,asc
  &limit=200
```

Process each transfer → ingestion service (dedup on `transaction_hash`).

After successful batch, advance watermark to `max(block_timestamp)` seen.

**Safety net: fingerprint pagination within a poll**

If a single poll returns 200 results (page full), continue fetching with `fingerprint` until page is not full — ensures burst activity is not truncated.

**Why not block number for incremental fetch?**

Block number is not a filter param on the TRC20 list API. Timestamp watermark is officially supported and works well with `order_by=block_timestamp,asc`.

**Dedup still required**

Re-polling overlapping timestamps (e.g. after a crash before watermark commit) is safe because `transaction_hash` unique constraint prevents duplicates.

## Backfill vs steady-state

| Scenario | Approach |
|----------|----------|
| First run (empty DB) | Omit `min_timestamp` or set to 0; paginate through history |
| Steady-state poll | `min_timestamp = last_synced_timestamp + 1` |
| Webhook + poll overlap | Same ingestion path; unique hash constraint handles race |

## Rate budget justification

With 5-minute polling interval:

- 1 request minimum per poll (usually 1–2 with pagination)
- 288 polls/day → ~288–576 API calls/day for one wallet
- Well within TronGrid free tier when an API key is configured

See `docs/rate-limits-and-errors.md` for observed limits.

# API Contract

Base URL: `http://localhost:3000/api`  
Swagger UI: `http://localhost:3000/docs`  
Static OpenAPI spec: [openapi.json](./openapi.json) (regenerate with `npm run openapi:export`)

## Response envelope

**Success:**
```json
{
  "data": { ... },
  "meta": { ... }
}
```

`meta` is optional on single-resource responses; **required** on paginated lists.

**Error:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Human-readable description"
  }
}
```

## Wallet scoping

`GET /transactions`, `GET /stats`, and webhook ingestion are scoped to the **active monitored wallet** configured via `GET/PUT /wallets/monitored` (or seeded from `MONITORED_WALLET_ADDRESS` on startup).

If no wallet is configured, wallet-scoped endpoints return **404** with code `NOT_FOUND`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/transactions` | Paginated list (active wallet) |
| GET | `/api/transactions/search?hash=` | Lookup by tx hash (active wallet) |
| GET | `/api/transactions/:id` | Lookup by UUID (active wallet) |
| GET | `/api/stats` | Dashboard aggregates (active wallet) |
| GET | `/api/wallets/monitored` | Current monitored wallet |
| PUT | `/api/wallets/monitored` | Set monitored wallet (resets sync watermarks) |
| GET | `/api/health` | Health check |
| GET | `/api/webhooks/tron/status` | Webhook receiver status + delivery stats |
| POST | `/api/webhooks/tron` | Tatum webhook receiver |

## GET /api/transactions

**Query parameters:**

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | int | 1 | Min 1 |
| `limit` | int | 20 | Max 100 |
| `confirmationStatus` | `pending` \| `confirmed` | — | Optional filter |
| `processingStatus` | enum | — | Optional filter |
| `sortBy` | `block_timestamp` \| `amount` \| `created_at` | `block_timestamp` | |
| `order` | `asc` \| `desc` | `desc` | |

**Response:**
```json
{
  "data": [
    {
      "id": "6778b6b6-dc9c-444a-95a1-f37ea52d2095",
      "transactionHash": "f096b4ca…",
      "amount": "1.000000",
      "confirmationStatus": "confirmed",
      "source": "poll"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}
```

## GET /api/transactions/:id

- Valid UUID required → `400` if malformed
- Missing row or wrong wallet → `404`

## GET /api/transactions/search?hash=

- 64-char hex hash required → `400` if malformed
- Not found for active wallet → `404`

## GET /api/stats

**Business rule:** `totalUsdtReceived` sums **confirmed** transactions only (settled USDT).

```json
{
  "data": {
    "totalTransactions": 10,
    "totalUsdtReceived": "15.500000",
    "confirmedCount": 8,
    "pendingCount": 2
  }
}
```

Recent transactions: dashboard uses `GET /api/transactions?limit=5&sortBy=block_timestamp&order=desc`.

## GET /api/wallets/monitored

```json
{
  "data": {
    "id": "uuid",
    "address": "TFCJpYH7LzLSXTWFj7syybrMU4cHvuX39k",
    "label": "Set via TronLink",
    "active": true,
    "lastSyncedBlock": "68985021",
    "lastSyncedTimestamp": "2026-07-07T20:56:33.000Z"
  }
}
```

## PUT /api/wallets/monitored

**Body:**
```json
{ "address": "TFCJpYH7LzLSXTWFj7syybrMU4cHvuX39k" }
```

- Invalid TRON address → `400`
- Success → same shape as `GET /api/wallets/monitored`

## GET /api/health

```json
{
  "data": {
    "status": "ok",
    "database": "up",
    "network": "shasta",
    "transactionCount": 10,
    "timestamp": "2026-07-08T12:00:00.000Z"
  }
}
```

## GET /api/webhooks/tron/status

```json
{
  "data": {
    "active": true,
    "endpoint": "/api/webhooks/tron",
    "network": "shasta",
    "monitoredWallet": "TFCJpYH7LzLSXTWFj7syybrMU4cHvuX39k",
    "hmacValidation": "disabled",
    "totalReceived": 5,
    "processed": 4,
    "failed": 1,
    "lastReceivedAt": "2026-07-08T12:00:00.000Z"
  }
}
```

## POST /api/webhooks/tron

Tatum `ADDRESS_EVENT` payload. Optional `x-payload-hash` header when HMAC is configured.

**Success:**
```json
{
  "data": {
    "received": true,
    "txId": "f247cdd9f1ad0e383791efb12ee1bcc789da7608ec87c0cbbf7a444f9590856e",
    "status": "inserted"
  }
}
```

`status` is one of: `inserted`, `duplicate_ignored`, `rejected`, `failed`.

| Condition | HTTP | code |
|-----------|------|------|
| Invalid HMAC (when secret set) | 401 | `UNAUTHORIZED` |
| Malformed payload | 400 | `BAD_REQUEST` |
| Valid payload | 200 | — |

Webhook endpoint is **not rate-limited** (`@SkipThrottle`).

## Error codes

| HTTP | code | When |
|------|------|------|
| 400 | `BAD_REQUEST` | Validation failure or malformed webhook payload |
| 401 | `UNAUTHORIZED` | Invalid webhook HMAC signature |
| 404 | `NOT_FOUND` | Resource not found or no monitored wallet configured |
| 429 | `TOO_MANY_REQUESTS` | Global rate limit (public GET/PUT endpoints) |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

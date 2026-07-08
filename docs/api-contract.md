# API Contract (Phase 4)

Base URL: `http://localhost:3000/api`  
Swagger UI: `http://localhost:3000/docs`

## Response envelope

**Success:**
```json
{
  "data": { ... },
  "meta": { ... }
}
```

`meta` is optional on single-resource responses; required on paginated lists.

**Error:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Human-readable description"
  }
}
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/transactions` | Paginated list |
| GET | `/api/transactions/search?hash=` | Lookup by tx hash |
| GET | `/api/transactions/:id` | Lookup by UUID |
| GET | `/api/stats` | Dashboard aggregates |
| GET | `/api/health` | Health check |

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
  "data": [ { "id": "uuid", "transactionHash": "...", "amount": "1.000000", ... } ],
  "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}
```

## GET /api/transactions/:id

- Valid UUID required → `400` if malformed
- Missing row → `404`

## GET /api/transactions/search?hash=

- 64-char hex hash required → `400` if malformed
- Not found → `404` (consistent with detail endpoint)

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

Recent transactions: dashboard will use `GET /api/transactions?limit=5&sortBy=block_timestamp&order=desc`.

## Error codes

| HTTP | code | When |
|------|------|------|
| 400 | `BAD_REQUEST` | Validation failure |
| 404 | `NOT_FOUND` | Resource not found |
| 429 | `TOO_MANY_REQUESTS` | Rate limit |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

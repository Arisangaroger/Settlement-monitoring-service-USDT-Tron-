# Phase 7 — Security verification checklist

Re-tested against the final Docker-ready build.

| Item | Status | Notes |
|------|--------|-------|
| No secrets in git | ✅ | `.env` gitignored; `.env.example` uses placeholders only |
| Rate limiting | ✅ | `@nestjs/throttler` global guard (skipped only on webhook route) |
| CORS | ✅ | Explicit `CORS_ORIGIN` — not `*` |
| Security headers | ✅ | `helmet()` in `main.ts` |
| Input validation | ✅ | Global `ValidationPipe` on REST endpoints |
| Webhook HMAC | ⚠️ **Conditional** | Enforced when `TATUM_WEBHOOK_HMAC_SECRET` is set; **disabled if unset** (local dev convenience). **Set the secret in production/Demo.** |
| Postgres privileges | ✅ | Docker uses dedicated `settlement` user, not superuser |
| SQL injection | ✅ | Prisma parameterized queries only |
| Error leakage | ✅ | `GlobalExceptionFilter` — no stack traces to clients |

## Webhook HMAC — how to verify enforcement

1. Set `TATUM_WEBHOOK_HMAC_SECRET` in `.env`
2. Restart backend
3. POST to `/api/webhooks/tron` **without** `x-payload-hash` → expect **401**
4. POST with valid Tatum signature → expect **200**

Without the env var, webhooks accept any payload (development mode only).

## Manual re-test commands

```bash
# Should fail when secret is set
curl -X POST http://localhost:3000/api/webhooks/tron \
  -H "Content-Type: application/json" \
  -d '{"kind":"token_transfer"}'

# Health + DB
curl http://localhost:3000/api/health
```

See also [api-security-checklist.md](./api-security-checklist.md).

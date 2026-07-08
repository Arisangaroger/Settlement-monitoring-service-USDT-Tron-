# API Security Checklist (Phase 4)

| Protection | Implementation |
|------------|----------------|
| Input validation | `class-validator` on all query DTOs + global `ValidationPipe` |
| SQL injection | Prisma parameterized queries only — no raw string SQL in API layer |
| Error leakage | `GlobalExceptionFilter` — no stack traces in responses |
| Rate limiting | `@nestjs/throttler` global guard (`THROTTLE_TTL_MS`, `THROTTLE_LIMIT`) |
| CORS | Explicit `CORS_ORIGIN` (default `http://localhost:3001`) — not `*` |
| Security headers | `helmet()` middleware |
| Field exposure | `TransactionResponseDto` — no `amountRaw`, `walletId`, internal fields |
| Secrets | API keys in `.env` only, never in responses or Swagger examples |

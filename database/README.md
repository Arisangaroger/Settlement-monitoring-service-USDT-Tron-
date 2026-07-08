# Database (Phase 2)

PostgreSQL schema managed by Prisma. See [docs/database-design-notes.md](../docs/database-design-notes.md) and [docs/erd.md](../docs/erd.md).

## Prerequisites

- Docker Desktop **running**
- Node.js 18+

## Setup

```bash
# From repo root
cp .env.example .env          # already done if you followed Phase 2 setup
npm install
npm run db:up                 # starts Postgres on localhost:5433 (avoids local PG on 5432)
npm run db:migrate:deploy     # applies migrations
npm run db:generate           # generates Prisma client
npm run db:seed               # inserts Phase 1 sample transaction
npm run db:test:duplicate     # proves unique constraint works
```

## Connection

```
postgresql://settlement:settlement@localhost:5433/settlement_monitor
```

## Inspect schema

```bash
docker compose exec postgres psql -U settlement -d settlement_monitor -c "\dt"
docker compose exec postgres psql -U settlement -d settlement_monitor -c "\d transactions"
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run db:up` | Start Postgres container |
| `npm run db:down` | Stop containers |
| `npm run db:migrate:deploy` | Apply pending migrations |
| `npm run db:seed` | Seed real Phase 1 sample data |
| `npm run db:test:duplicate` | Duplicate hash rejection test |
| `npm run db:studio` | Prisma Studio GUI |

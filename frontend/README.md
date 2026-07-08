# Frontend — Settlement Dashboard (Phase 6)

Next.js dashboard for the Phase 4 REST API.

## Run

Backend must be running first (`npm run backend:dev` from repo root).

```bash
npm run dev --prefix frontend
# or from repo root:
npm run frontend:dev
```

Open **http://localhost:3001** (port 3001 matches backend `CORS_ORIGIN`).

## Environment

Copy `.env.example` → `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Features

- Summary stats (total txs, USDT received, confirmed/pending)
- Paginated transaction table with mobile card layout
- Filter: All / Confirmed / Pending
- Search by transaction hash
- Auto-refresh every 10 seconds
- Loading skeletons and error states

## Tests

```bash
npm run test --prefix frontend
```

## Typography

- **Afacad** — headings / display
- **Outfit** — body text

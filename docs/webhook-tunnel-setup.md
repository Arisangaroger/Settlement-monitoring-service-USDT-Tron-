# Permanent webhook URL with Docker Compose

Tatum needs a **public HTTPS URL** to POST webhooks. Your backend runs on `localhost` inside Docker, so you expose it with a **stable tunnel** (not the ephemeral `trycloudflare.com` quick tunnel).

## Important: one tunnel per developer

A permanent URL always points to **one machine**. There is no single shared URL that works for everyone who clones this repo — each developer (or deployment) creates their own tunnel credentials and Tatum subscription.

What **is** automatic after a one-time setup:

1. `docker compose --profile webhook-tunnel up --build` starts stack + ngrok
2. `npm run webhook:register` creates the Tatum subscription from `.env`

Polling (`RECONCILIATION_INTERVAL_MS`) still works without any tunnel.

---

## Recommended: ngrok static domain (easiest)

Free ngrok accounts include **one reserved domain** (e.g. `your-name.ngrok-free.app`) that stays the same every time.

### One-time setup (~5 minutes)

1. Sign up: https://dashboard.ngrok.com/signup  
2. Copy your **Authtoken**: https://dashboard.ngrok.com/get-started/your-authtoken  
3. Reserve a domain: https://dashboard.ngrok.com/domains → **Create Domain** (free static domain)  
4. Add to `.env`:

```env
NGROK_AUTHTOKEN=your-ngrok-authtoken
NGROK_DOMAIN=your-name.ngrok-free.app
TATUM_API_KEY=your-tatum-api-key
MONITORED_WALLET_ADDRESS=TYourShastaWallet...
```

5. Start stack **with tunnel profile**:

```bash
docker compose --profile webhook-tunnel up --build
```

6. Register Tatum (once per tunnel URL + wallet):

```bash
npm run webhook:register
```

Your webhook URL is:

```text
https://<NGROK_DOMAIN>/api/webhooks/tron
```

7. Send test USDT on Shasta → check:

```bash
curl http://localhost:3000/api/webhooks/tron/status
```

`lastReceivedAt` should update within seconds.

Optional: ngrok inspector at http://localhost:4040

---

## Alternative: Cloudflare Named Tunnel

Best if you already use Cloudflare DNS. Gives a **fixed hostname** on your domain (e.g. `webhooks.yourdomain.com`).

### One-time setup

1. Cloudflare Zero Trust → **Networks** → **Tunnels** → **Create tunnel**  
2. Choose **Cloudflared** → **Docker** → copy the **tunnel token**  
3. In tunnel **Public Hostname** settings, add:

   | Field | Value |
   |-------|--------|
   | Subdomain | e.g. `settlement-api` |
   | Domain | your domain on Cloudflare |
   | Service type | HTTP |
   | URL | `http://backend:3000` |

   (Use service name `backend` — same Docker network as in `docker-compose.yml`.)

4. Add to `.env`:

```env
CLOUDFLARE_TUNNEL_TOKEN=your-tunnel-token
WEBHOOK_PUBLIC_URL=https://settlement-api.yourdomain.com
TATUM_API_KEY=...
MONITORED_WALLET_ADDRESS=...
```

5. Start with Cloudflare profile:

```bash
docker compose --profile webhook-tunnel-cf up --build
```

6. Register Tatum:

```bash
npm run webhook:register
```

---

## Do not use (ephemeral)

| Method | Problem |
|--------|---------|
| `cloudflared tunnel --url http://localhost:3000` | Random `*.trycloudflare.com` URL dies when tunnel stops |
| Old tunnel URLs in Tatum | Webhooks silently fail |

---

## Environment variables

| Variable | Required for | Description |
|----------|----------------|-------------|
| `NGROK_AUTHTOKEN` | ngrok profile | From ngrok dashboard |
| `NGROK_DOMAIN` | ngrok profile | Reserved static domain |
| `CLOUDFLARE_TUNNEL_TOKEN` | CF profile | From Zero Trust tunnel setup |
| `WEBHOOK_PUBLIC_URL` | Tatum register | Public base URL (`https://…`, no trailing path) |
| `TATUM_API_KEY` | Tatum register | Tatum API key |
| `MONITORED_WALLET_ADDRESS` | Tatum register | Shasta wallet to watch |
| `TATUM_WEBHOOK_HMAC_SECRET` | Optional | Enable HMAC in Tatum + backend |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| No webhooks, polling works | Tunnel down or wrong URL in Tatum — re-run `npm run webhook:register` |
| `401` on webhook | Set matching `TATUM_WEBHOOK_HMAC_SECRET` in Tatum and `.env` |
| ngrok container exits | Check `NGROK_AUTHTOKEN` and `NGROK_DOMAIN` match dashboard |
| CF tunnel inactive | Verify token and public hostname targets `http://backend:3000` |

---

## npm scripts

```bash
# Stack + ngrok tunnel
npm run docker:up:webhooks

# Stack + Cloudflare tunnel
npm run docker:up:webhooks:cf

# Register Tatum subscription from .env
npm run webhook:register
```

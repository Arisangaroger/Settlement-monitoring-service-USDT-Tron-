#!/bin/sh
set -eu

URL_FILE=/shared/tunnel-url

echo "Waiting for temporary tunnel URL (up to 120s)…"
i=0
while [ "$i" -lt 60 ]; do
  if [ -f "$URL_FILE" ]; then
    break
  fi
  i=$((i + 1))
  sleep 2
done

if [ ! -f "$URL_FILE" ]; then
  echo "Could not detect tunnel URL. Check logs: docker compose logs cloudflared-quick"
  exit 1
fi

PUBLIC_URL=$(cat "$URL_FILE")
WEBHOOK_URL="${PUBLIC_URL}/api/webhooks/tron"

echo ""
echo "Webhook demo ready:"
echo "  $WEBHOOK_URL"
echo ""

if [ -z "${TATUM_API_KEY:-}" ] || [ -z "${MONITORED_WALLET_ADDRESS:-}" ]; then
  echo "Add TATUM_API_KEY and MONITORED_WALLET_ADDRESS to .env to auto-register with Tatum."
  echo "Or paste the webhook URL above into the Tatum dashboard manually."
  exit 0
fi

echo "Registering Tatum subscription for ${MONITORED_WALLET_ADDRESS}…"

HTTP_CODE=$(curl -sS -o /tmp/tatum-response.json -w "%{http_code}" \
  -X POST "https://api.tatum.io/v4/subscription" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${TATUM_API_KEY}" \
  -d "{\"type\":\"ADDRESS_EVENT\",\"attr\":{\"chain\":\"TRON\",\"address\":\"${MONITORED_WALLET_ADDRESS}\",\"url\":\"${WEBHOOK_URL}\"}}")

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo "Tatum subscription created:"
  cat /tmp/tatum-response.json
  echo ""
  echo "Send a test USDT transfer, then check backend logs for webhook ingestion."
  exit 0
fi

echo "Tatum registration failed (HTTP ${HTTP_CODE}):"
cat /tmp/tatum-response.json
echo ""
echo "If a subscription already exists, delete it in the Tatum dashboard and restart:"
echo "  npm run docker:demo"
exit 1

#!/bin/sh
set -eu

URL_FILE=/shared/tunnel-url
mkdir -p /shared
rm -f "$URL_FILE"

echo "Starting temporary Cloudflare quick tunnel → http://backend:3000"
echo "(URL changes each run — Tatum is auto-registered when TATUM_API_KEY is in .env)"

cloudflared tunnel --no-autoupdate --url http://backend:3000 2>&1 | while IFS= read -r line; do
  printf '%s\n' "$line"

  url=$(printf '%s' "$line" | grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' | head -n 1 || true)
  if [ -n "$url" ] && [ ! -f "$URL_FILE" ]; then
    printf '%s' "$url" > "$URL_FILE"
    echo ""
    echo "=========================================="
    echo "TEMP WEBHOOK BASE URL: $url"
    echo "Webhook endpoint:      $url/api/webhooks/tron"
    echo "=========================================="
    echo ""
  fi
done

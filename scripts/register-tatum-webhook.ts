/**
 * Register (or re-register) a Tatum ADDRESS_EVENT subscription for the monitored wallet.
 *
 * Requires in `.env`:
 *   TATUM_API_KEY
 *   MONITORED_WALLET_ADDRESS
 *   WEBHOOK_PUBLIC_URL  (e.g. https://your-name.ngrok-free.app)
 *     OR NGROK_DOMAIN   (script builds https://{NGROK_DOMAIN})
 *
 * Usage:
 *   npm run webhook:register
 */
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

const TATUM_API = 'https://api.tatum.io/v4/subscription';

function resolvePublicBaseUrl(): string | null {
  const explicit = process.env.WEBHOOK_PUBLIC_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const ngrokDomain = process.env.NGROK_DOMAIN?.trim();
  if (ngrokDomain) return `https://${ngrokDomain.replace(/^https?:\/\//, '')}`;

  return null;
}

async function main(): Promise<void> {
  const apiKey = process.env.TATUM_API_KEY?.trim();
  const address = process.env.MONITORED_WALLET_ADDRESS?.trim();
  const publicBase = resolvePublicBaseUrl();

  if (!apiKey) {
    console.error('Missing TATUM_API_KEY in .env');
    process.exit(1);
  }
  if (!address) {
    console.error('Missing MONITORED_WALLET_ADDRESS in .env');
    process.exit(1);
  }
  if (!publicBase) {
    console.error(
      'Set WEBHOOK_PUBLIC_URL or NGROK_DOMAIN in .env (your stable tunnel hostname).',
    );
    process.exit(1);
  }

  const webhookUrl = `${publicBase}/api/webhooks/tron`;

  const body = {
    type: 'ADDRESS_EVENT',
    attr: {
      chain: 'TRON',
      address,
      url: webhookUrl,
    },
  };

  console.log('Registering Tatum subscription…');
  console.log(`  wallet: ${address}`);
  console.log(`  url:    ${webhookUrl}`);

  const res = await fetch(TATUM_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: unknown = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    // keep raw text
  }

  if (!res.ok) {
    console.error('Tatum API error:', res.status, parsed);
    console.error(
      '\nIf a subscription already exists for this address+URL, delete it in the Tatum dashboard and retry.',
    );
    process.exit(1);
  }

  console.log('\nSubscription created:');
  console.log(JSON.stringify(parsed, null, 2));
  console.log('\nVerify delivery: GET http://localhost:3000/api/webhooks/tron/status');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

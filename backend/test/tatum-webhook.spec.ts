import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  computeTatumPayloadHash,
  verifyTatumPayloadHash,
} from '../src/modules/webhooks/tatum-webhook-auth';
import {
  mapTatumWebhookToTrc20Transfer,
  parseTatumWebhookPayload,
} from '../src/modules/webhooks/tatum-webhook.mapper';
import type { TatumWebhookPayload } from '../src/modules/webhooks/tatum-webhook.types';

const SAMPLE_PATH = resolve(
  __dirname,
  '../../poc/sample-responses/tatum-webhook-shasta.json',
);

const SHASTA_USDT = 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs';

function loadSamplePayload(): Record<string, unknown> {
  return JSON.parse(readFileSync(SAMPLE_PATH, 'utf8')) as Record<string, unknown>;
}

describe('tatum-webhook-auth', () => {
  it('computes and verifies HMAC SHA512 base64 digest', () => {
    const payload = loadSamplePayload();
    const secret = 'test-hmac-secret';

    const hash = computeTatumPayloadHash(payload, secret);
    expect(verifyTatumPayloadHash(payload, hash, secret)).toBe(true);
    expect(verifyTatumPayloadHash(payload, 'invalid', secret)).toBe(false);
    expect(verifyTatumPayloadHash(payload, undefined, secret)).toBe(false);
  });
});

describe('tatum-webhook.mapper', () => {
  it('maps real Tatum Shasta payload to TronGrid TRC20 transfer shape', () => {
    const raw = loadSamplePayload();
    const parsed = parseTatumWebhookPayload(raw);

    const mapped = mapTatumWebhookToTrc20Transfer({
      payload: parsed,
      expectedUsdtContract: SHASTA_USDT,
      tronNetwork: 'shasta',
    });

    expect(mapped).toEqual({
      transaction_id:
        'f247cdd9f1ad0e383791efb12ee1bcc789da7608ec87c0cbbf7a444f9590856e',
      token_info: {
        symbol: 'USDT',
        address: SHASTA_USDT,
        decimals: 6,
        name: 'TetherToken',
      },
      block_timestamp: 1783470642000,
      from: 'TY7qDg91GYtwFpyieenJb2F8rUvo7VPxbt',
      to: 'TFCJpYH7LzLSXTWFj7syybrMU4cHvuX39k',
      type: 'Transfer',
      value: '1000000',
    });
  });

  it('rejects non-USDT contract addresses', () => {
    const parsed = parseTatumWebhookPayload(loadSamplePayload());

    expect(() =>
      mapTatumWebhookToTrc20Transfer({
        payload: parsed,
        expectedUsdtContract: 'TWrongContractAddress123456789012345',
        tronNetwork: 'shasta',
      }),
    ).toThrow('Contract address is not official USDT');
  });

  it('rejects mainnet chain when configured for testnet', () => {
    const parsed: TatumWebhookPayload = {
      ...parseTatumWebhookPayload(loadSamplePayload()),
      chain: 'tron-mainnet',
    };

    expect(() =>
      mapTatumWebhookToTrc20Transfer({
        payload: parsed,
        expectedUsdtContract: SHASTA_USDT,
        tronNetwork: 'shasta',
      }),
    ).toThrow('does not match testnet config');
  });
});

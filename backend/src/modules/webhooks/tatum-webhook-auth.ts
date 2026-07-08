import { createHmac, timingSafeEqual } from 'crypto';

export const TATUM_PAYLOAD_HASH_HEADER = 'x-payload-hash';

/** Verify Tatum webhook HMAC per https://docs.tatum.io/docs/authenticating-notification-webhooks */
export function computeTatumPayloadHash(
  payload: Record<string, unknown>,
  hmacSecret: string,
): string {
  return createHmac('sha512', hmacSecret)
    .update(JSON.stringify(payload))
    .digest('base64');
}

export function verifyTatumPayloadHash(
  payload: Record<string, unknown>,
  payloadHashHeader: string | undefined,
  hmacSecret: string,
): boolean {
  if (!payloadHashHeader?.trim()) {
    return false;
  }

  const expected = computeTatumPayloadHash(payload, hmacSecret);
  const received = payloadHashHeader.trim();

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

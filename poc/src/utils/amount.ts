/**
 * Convert raw TRC20 integer amount (smallest unit) to human-readable decimal string.
 * Uses string math to avoid floating-point precision loss.
 */
export function rawAmountToDecimal(raw: string, decimals: number): string {
  const value = raw.trim();
  if (!/^\d+$/.test(value)) {
    throw new Error(`Invalid raw amount: "${raw}"`);
  }

  if (decimals === 0) return value;

  const padded = value.padStart(decimals + 1, '0');
  const whole = padded.slice(0, -decimals) || '0';
  const fraction = padded.slice(-decimals);
  const trimmedFraction = fraction.replace(/0+$/, '');

  return trimmedFraction.length > 0 ? `${whole}.${trimmedFraction}` : whole;
}

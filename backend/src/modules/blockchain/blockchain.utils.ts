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

/** Convert a human-readable token amount (e.g. Tatum "1" USDT) to raw integer string. */
export function humanAmountToRaw(human: string, decimals: number): string {
  const trimmed = human.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Invalid human amount: "${human}"`);
  }
  if (decimals === 0) {
    return trimmed.split('.')[0];
  }

  const [wholePart, fractionPart = ''] = trimmed.split('.');
  const fraction = fractionPart.padEnd(decimals, '0').slice(0, decimals);
  const raw = `${wholePart}${fraction}`.replace(/^0+(?=\d)/, '') || '0';
  return raw;
}

export function computeConfirmations(
  latestBlockNumber: number,
  transactionBlockNumber: number,
): number {
  if (transactionBlockNumber <= 0) return 0;
  return Math.max(0, latestBlockNumber - transactionBlockNumber + 1);
}

export function deriveConfirmationStatus(
  confirmations: number,
  threshold: number,
): 'pending' | 'confirmed' {
  return confirmations >= threshold ? 'confirmed' : 'pending';
}

const TRON_ADDRESS_REGEX = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
const TX_HASH_REGEX = /^[a-fA-F0-9]{64}$/;

export function isValidTronAddress(address: string): boolean {
  return TRON_ADDRESS_REGEX.test(address);
}

export function isValidTxHash(hash: string): boolean {
  return TX_HASH_REGEX.test(hash);
}

export function isOfficialUsdtContract(
  contractAddress: string,
  expectedContract: string,
): boolean {
  return contractAddress.toLowerCase() === expectedContract.toLowerCase();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

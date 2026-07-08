export function computeConfirmations(
  latestBlockNumber: number,
  transactionBlockNumber: number,
): number {
  if (transactionBlockNumber <= 0) return 0;
  return Math.max(0, latestBlockNumber - transactionBlockNumber + 1);
}

export function confirmationStatus(
  confirmations: number,
  threshold: number,
): 'pending' | 'confirmed' {
  return confirmations >= threshold ? 'confirmed' : 'pending';
}

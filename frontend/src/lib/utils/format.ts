const TX_HASH_REGEX = /^[a-fA-F0-9]{64}$/;

export function isValidTxHash(value: string): boolean {
  return TX_HASH_REGEX.test(value.trim());
}

export function truncateHash(hash: string, head = 8, tail = 6): string {
  if (hash.length <= head + tail + 3) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

export function formatUsdtAmount(value: string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(num);
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = date.getTime() - Date.now();
  const absSec = Math.round(Math.abs(diffMs) / 1000);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (absSec < 60) return rtf.format(Math.round(diffMs / 1000), 'second');
  if (absSec < 3600) return rtf.format(Math.round(diffMs / 60_000), 'minute');
  if (absSec < 86_400) return rtf.format(Math.round(diffMs / 3_600_000), 'hour');
  return rtf.format(Math.round(diffMs / 86_400_000), 'day');
}

export function formatAbsoluteTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

const TRON_SCAN_BASES: Record<string, string> = {
  shasta: 'https://shasta.tronscan.org/#/transaction/',
  nile: 'https://nile.tronscan.org/#/transaction/',
  mainnet: 'https://tronscan.org/#/transaction/',
};

export function getTronScanTxUrl(hash: string): string {
  const network = process.env.NEXT_PUBLIC_TRON_NETWORK ?? 'shasta';
  const base = TRON_SCAN_BASES[network] ?? TRON_SCAN_BASES.shasta;
  return `${base}${hash}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

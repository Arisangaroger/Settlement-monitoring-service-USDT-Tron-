export type TronNetwork = 'nile' | 'mainnet' | 'shasta';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  tronNetwork: TronNetwork;
  trongridBaseUrl: string;
  trongridApiKey?: string;
  monitoredWalletAddress?: string;
  usdtContractAddress: string;
  confirmationThreshold: number;
  reconciliationIntervalMs: number;
  confirmationCheckIntervalMs: number;
  corsOrigin: string;
  throttleTtlMs: number;
  throttleLimit: number;
  tatumWebhookHmacSecret?: string;
}

export const TRONGRID_BASE_URLS: Record<TronNetwork, string> = {
  nile: 'https://nile.trongrid.io',
  mainnet: 'https://api.trongrid.io',
  shasta: 'https://api.shasta.trongrid.io',
};

export const USDT_CONTRACT_ADDRESSES: Record<TronNetwork, string> = {
  nile: 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf',
  mainnet: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
  shasta: 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs',
};

export const DEFAULT_CONFIRMATION_THRESHOLD = 19;
export const DEFAULT_RECONCILIATION_INTERVAL_MS = 300_000;
export const DEFAULT_CONFIRMATION_CHECK_INTERVAL_MS = 12_000;
export const DEFAULT_CORS_ORIGIN = 'http://localhost:3001';
export const DEFAULT_THROTTLE_TTL_MS = 60_000;
export const DEFAULT_THROTTLE_LIMIT = 100;

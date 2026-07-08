export type TronNetwork = 'nile' | 'mainnet' | 'shasta';

export const TRONGRID_BASE_URLS: Record<TronNetwork, string> = {
  nile: 'https://nile.trongrid.io',
  mainnet: 'https://api.trongrid.io',
  shasta: 'https://api.shasta.trongrid.io',
};

/** Official USDT TRC20 contract addresses per network */
export const USDT_CONTRACT_ADDRESSES: Record<TronNetwork, string> = {
  nile: 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf',
  mainnet: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
  shasta: 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs',
};

/** Default confirmation threshold — override via CONFIRMATION_THRESHOLD env */
export const DEFAULT_CONFIRMATION_THRESHOLD = 19;

/** TRON produces a block roughly every 3 seconds */
export const TRON_BLOCK_TIME_SECONDS = 3;

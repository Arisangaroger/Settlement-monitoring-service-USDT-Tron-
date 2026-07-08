import 'dotenv/config';
import {
  DEFAULT_CONFIRMATION_THRESHOLD,
  TRONGRID_BASE_URLS,
  USDT_CONTRACT_ADDRESSES,
  type TronNetwork,
} from './constants.js';

function parseNetwork(value: string | undefined): TronNetwork {
  const network = (value ?? 'nile').toLowerCase();
  if (network === 'nile' || network === 'mainnet' || network === 'shasta') {
    return network;
  }
  throw new Error(
    `Invalid TRON_NETWORK "${value}". Expected nile, mainnet, or shasta.`,
  );
}

export interface AppConfig {
  network: TronNetwork;
  trongridBaseUrl: string;
  trongridApiKey?: string;
  monitoredWalletAddress?: string;
  usdtContractAddress: string;
  confirmationThreshold: number;
}

export function loadConfig(): AppConfig {
  const network = parseNetwork(process.env.TRON_NETWORK);
  const trongridBaseUrl =
    process.env.TRONGRID_BASE_URL ?? TRONGRID_BASE_URLS[network];
  const usdtContractAddress =
    process.env.USDT_CONTRACT_ADDRESS ?? USDT_CONTRACT_ADDRESSES[network];
  const confirmationThreshold = Number(
    process.env.CONFIRMATION_THRESHOLD ?? DEFAULT_CONFIRMATION_THRESHOLD,
  );

  if (!Number.isFinite(confirmationThreshold) || confirmationThreshold < 1) {
    throw new Error('CONFIRMATION_THRESHOLD must be a positive integer.');
  }

  return {
    network,
    trongridBaseUrl,
    trongridApiKey: process.env.TRONGRID_API_KEY,
    monitoredWalletAddress: process.env.MONITORED_WALLET_ADDRESS,
    usdtContractAddress,
    confirmationThreshold,
  };
}

export function requireMonitoredWallet(config: AppConfig): string {
  if (!config.monitoredWalletAddress) {
    throw new Error(
      'MONITORED_WALLET_ADDRESS is required. Copy poc/.env.example to poc/.env and set your Nile test wallet.',
    );
  }
  return config.monitoredWalletAddress;
}

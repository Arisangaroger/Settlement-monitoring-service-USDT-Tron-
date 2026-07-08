import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AppConfig,
  DEFAULT_CONFIRMATION_CHECK_INTERVAL_MS,
  DEFAULT_CONFIRMATION_THRESHOLD,
  DEFAULT_CORS_ORIGIN,
  DEFAULT_RECONCILIATION_INTERVAL_MS,
  DEFAULT_THROTTLE_LIMIT,
  DEFAULT_THROTTLE_TTL_MS,
  TRONGRID_BASE_URLS,
  TronNetwork,
  USDT_CONTRACT_ADDRESSES,
} from './configuration';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  get(): AppConfig {
    const tronNetwork = this.parseNetwork(this.config.get<string>('TRON_NETWORK'));
    const confirmationThreshold = Number(
      this.config.get<string>('CONFIRMATION_THRESHOLD') ??
        DEFAULT_CONFIRMATION_THRESHOLD,
    );
    const reconciliationIntervalMs = Number(
      this.config.get<string>('RECONCILIATION_INTERVAL_MS') ??
        DEFAULT_RECONCILIATION_INTERVAL_MS,
    );
    const confirmationCheckIntervalMs = Number(
      this.config.get<string>('CONFIRMATION_CHECK_INTERVAL_MS') ??
        DEFAULT_CONFIRMATION_CHECK_INTERVAL_MS,
    );
    const throttleTtlMs = Number(
      this.config.get<string>('THROTTLE_TTL_MS') ?? DEFAULT_THROTTLE_TTL_MS,
    );
    const throttleLimit = Number(
      this.config.get<string>('THROTTLE_LIMIT') ?? DEFAULT_THROTTLE_LIMIT,
    );

    const databaseUrl = this.config.get<string>('DATABASE_URL');
    const monitoredWalletAddress = this.config.get<string>(
      'MONITORED_WALLET_ADDRESS',
    )?.trim();

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required');
    }
    if (
      !Number.isFinite(confirmationThreshold) ||
      confirmationThreshold < 1
    ) {
      throw new Error('CONFIRMATION_THRESHOLD must be a positive integer');
    }
    if (
      !Number.isFinite(reconciliationIntervalMs) ||
      reconciliationIntervalMs < 1000
    ) {
      throw new Error('RECONCILIATION_INTERVAL_MS must be >= 1000');
    }
    if (
      !Number.isFinite(confirmationCheckIntervalMs) ||
      confirmationCheckIntervalMs < 1000
    ) {
      throw new Error('CONFIRMATION_CHECK_INTERVAL_MS must be >= 1000');
    }

    return {
      nodeEnv: this.config.get<string>('NODE_ENV') ?? 'development',
      port: Number(this.config.get<string>('PORT') ?? 3000),
      databaseUrl,
      tronNetwork,
      trongridBaseUrl:
        this.config.get<string>('TRONGRID_BASE_URL') ??
        TRONGRID_BASE_URLS[tronNetwork],
      trongridApiKey: this.config.get<string>('TRONGRID_API_KEY'),
      monitoredWalletAddress,
      usdtContractAddress:
        this.config.get<string>('USDT_CONTRACT_ADDRESS') ??
        USDT_CONTRACT_ADDRESSES[tronNetwork],
      confirmationThreshold,
      reconciliationIntervalMs,
      confirmationCheckIntervalMs,
      corsOrigin:
        this.config.get<string>('CORS_ORIGIN') ?? DEFAULT_CORS_ORIGIN,
      throttleTtlMs,
      throttleLimit,
      tatumWebhookHmacSecret: this.config.get<string>(
        'TATUM_WEBHOOK_HMAC_SECRET',
      ),
    };
  }

  private parseNetwork(value: string | undefined): TronNetwork {
    const network = (value ?? 'nile').toLowerCase();
    if (network === 'nile' || network === 'mainnet' || network === 'shasta') {
      return network;
    }
    throw new Error(
      `Invalid TRON_NETWORK "${value}". Expected nile, mainnet, or shasta.`,
    );
  }
}

import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { TransactionSource } from '@prisma/client';
import type { TronGridTrc20Transfer } from '../blockchain/blockchain.types';
import { TronGridClient } from '../blockchain/trongrid.client';
import { AppConfigService } from '../config/app-config.service';
import { IngestionService } from '../ingestion/ingestion.service';
import {
  TATUM_PAYLOAD_HASH_HEADER,
  verifyTatumPayloadHash,
} from './tatum-webhook-auth';
import {
  mapTatumWebhookToTrc20Transfer,
  parseTatumWebhookPayload,
  TatumWebhookMapError,
} from './tatum-webhook.mapper';
import type { TatumWebhookPayload } from './tatum-webhook.types';
import type { WebhookHandleResult } from './webhook-handle.types';
import { WebhookEventsLogService } from './webhook-events-log.service';
import { WalletsService } from '../wallets/wallets.service';

@Injectable()
export class TatumWebhookService {
  private readonly logger = new Logger(TatumWebhookService.name);
  private warnedAboutMissingSecret = false;

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly ingestion: IngestionService,
    private readonly wallets: WalletsService,
    private readonly tronGrid: TronGridClient,
    private readonly webhookEventsLog: WebhookEventsLogService,
  ) {}

  async handleIncoming(
    payload: Record<string, unknown>,
    payloadHash?: string,
  ): Promise<WebhookHandleResult> {
    this.authenticate(payload, payloadHash);

    const auditLogId = await this.webhookEventsLog.recordReceived(payload);

    try {
      const { transfer, blockNumber } = this.normalizePayload(payload);
      const wallet = await this.wallets.getActiveWallet();
      const latestBlock = await this.tronGrid.getLatestBlockNumber();

      const result = await this.ingestion.processTrc20Transfer({
        walletId: wallet.id,
        monitoredAddress: wallet.address,
        transfer,
        latestBlockNumber: latestBlock,
        source: TransactionSource.webhook,
        blockNumber,
      });

      const processed =
        result.status === 'inserted' || result.status === 'duplicate_ignored';

      await this.webhookEventsLog.markProcessed(auditLogId, {
        processed,
        errorMessage:
          result.status === 'rejected' || result.status === 'failed'
            ? result.reason
            : undefined,
      });

      this.logger.log(
        {
          txId: result.transactionHash,
          ingestionStatus: result.status,
          source: 'webhook',
        },
        'TRON webhook ingested',
      );

      return {
        txId: result.transactionHash,
        status: result.status,
        auditLogId,
      };
    } catch (error) {
      const message = this.extractErrorMessage(error);
      await this.webhookEventsLog.markProcessed(auditLogId, {
        processed: false,
        errorMessage: message,
      });
      throw error;
    }
  }

  async getStatus(): Promise<{
    active: boolean;
    endpoint: string;
    network: string;
    monitoredWallet: string;
    hmacValidation: 'enabled' | 'disabled';
    totalReceived: number;
    processed: number;
    failed: number;
    lastReceivedAt: string | null;
  }> {
    const cfg = this.appConfig.get();
    const stats = await this.webhookEventsLog.getStats();
    const wallet = await this.wallets.getActiveWallet();

    return {
      active: true,
      endpoint: '/api/webhooks/tron',
      network: cfg.tronNetwork,
      monitoredWallet: wallet.address,
      hmacValidation: cfg.tatumWebhookHmacSecret ? 'enabled' : 'disabled',
      totalReceived: stats.totalReceived,
      processed: stats.processed,
      failed: stats.failed,
      lastReceivedAt: stats.lastReceivedAt
        ? stats.lastReceivedAt.toISOString()
        : null,
    };
  }

  authenticate(payload: Record<string, unknown>, payloadHash?: string): void {
    const secret = this.appConfig.get().tatumWebhookHmacSecret;

    if (!secret) {
      if (!this.warnedAboutMissingSecret) {
        this.logger.warn(
          'TATUM_WEBHOOK_HMAC_SECRET is not set — webhook HMAC validation is disabled',
        );
        this.warnedAboutMissingSecret = true;
      }
      return;
    }

    if (!verifyTatumPayloadHash(payload, payloadHash, secret)) {
      this.logger.warn('Rejected webhook: invalid or missing x-payload-hash');
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }

  normalizePayload(payload: Record<string, unknown>): {
    transfer: TronGridTrc20Transfer;
    blockNumber: number;
    parsed: TatumWebhookPayload;
  } {
    try {
      const parsed = parseTatumWebhookPayload(payload);
      const cfg = this.appConfig.get();

      const transfer = mapTatumWebhookToTrc20Transfer({
        payload: parsed,
        expectedUsdtContract: cfg.usdtContractAddress,
        tronNetwork: cfg.tronNetwork,
      });

      return { transfer, blockNumber: parsed.blockNumber, parsed };
    } catch (error) {
      const message =
        error instanceof TatumWebhookMapError
          ? error.message
          : 'Malformed webhook payload';
      throw new BadRequestException(message);
    }
  }

  static payloadHashHeaderName(): string {
    return TATUM_PAYLOAD_HASH_HEADER;
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof BadRequestException) {
      const response = error.getResponse();
      if (typeof response === 'string') return response;
      if (typeof response === 'object' && response !== null) {
        const obj = response as Record<string, unknown>;
        if (typeof obj.message === 'string') return obj.message;
      }
    }
    if (error instanceof Error) return error.message;
    return 'Webhook processing failed';
  }
}

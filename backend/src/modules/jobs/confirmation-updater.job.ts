import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfirmationStatus } from '@prisma/client';
import { AppConfigService } from '../config/app-config.service';
import {
  computeConfirmations,
  deriveConfirmationStatus,
} from '../blockchain/blockchain.utils';
import { TronGridClient } from '../blockchain/trongrid.client';
import { TransactionsService } from '../transactions/transactions.service';
import { JobMutex } from './job-mutex';

@Injectable()
export class ConfirmationUpdaterJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConfirmationUpdaterJob.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly tronGrid: TronGridClient,
    private readonly transactions: TransactionsService,
    private readonly mutex: JobMutex,
  ) {}

  onModuleInit(): void {
    const intervalMs = this.appConfig.get().confirmationCheckIntervalMs;
    this.logger.log(`Confirmation updater scheduled every ${intervalMs}ms`);
    void this.runOnce();
    this.timer = setInterval(() => void this.runOnce(), intervalMs);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async runOnce(): Promise<void> {
    await this.mutex.run('confirmation-updater', async () => {
      const started = Date.now();
      const cfg = this.appConfig.get();

      try {
        const pending = await this.transactions.findPendingConfirmations();
        if (pending.length === 0) {
          return;
        }

        const latestBlock = await this.tronGrid.getLatestBlockNumber();
        let confirmedCount = 0;

        for (const tx of pending) {
          const blockNum = Number(tx.blockNumber);
          const confirmations = computeConfirmations(latestBlock, blockNum);
          const status = deriveConfirmationStatus(
            confirmations,
            cfg.confirmationThreshold,
          );

          const prismaStatus =
            status === 'confirmed'
              ? ConfirmationStatus.confirmed
              : ConfirmationStatus.pending;

          if (
            confirmations !== tx.confirmations ||
            prismaStatus !== tx.confirmationStatus
          ) {
            await this.transactions.updateConfirmationState(
              tx.id,
              confirmations,
              prismaStatus,
            );
            if (prismaStatus === ConfirmationStatus.confirmed) {
              confirmedCount++;
              this.logger.log(
                { hash: tx.transactionHash, confirmations },
                'Transaction confirmed',
              );
            }
          }
        }

        this.logger.log(
          {
            checked: pending.length,
            newlyConfirmed: confirmedCount,
            latestBlock,
            durationMs: Date.now() - started,
          },
          'Confirmation updater run complete',
        );
      } catch (error) {
        this.logger.error(
          {
            err: error instanceof Error ? error.message : String(error),
            durationMs: Date.now() - started,
          },
          'Confirmation updater failed — will retry on next interval',
        );
      }
    });
  }
}

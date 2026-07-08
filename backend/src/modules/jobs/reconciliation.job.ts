import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { TransactionSource } from '@prisma/client';
import { AppConfigService } from '../config/app-config.service';
import { TronGridClient } from '../blockchain/trongrid.client';
import { IngestionService } from '../ingestion/ingestion.service';
import { WalletsService } from '../wallets/wallets.service';
import { JobMutex } from './job-mutex';

@Injectable()
export class ReconciliationJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReconciliationJob.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly tronGrid: TronGridClient,
    private readonly ingestion: IngestionService,
    private readonly wallets: WalletsService,
    private readonly mutex: JobMutex,
  ) {}

  onModuleInit(): void {
    const intervalMs = this.appConfig.get().reconciliationIntervalMs;
    this.logger.log(`Reconciliation scheduled every ${intervalMs}ms`);
    void this.runOnce();
    this.timer = setInterval(() => void this.runOnce(), intervalMs);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async runOnce(): Promise<void> {
    await this.mutex.run('reconciliation', async () => {
      const started = Date.now();
      const cfg = this.appConfig.get();

      try {
        const wallet = await this.wallets.getActiveWallet();
        const minTimestamp = wallet.lastSyncedTimestamp
          ? wallet.lastSyncedTimestamp.getTime() + 1
          : 0;

        const latestBlock = await this.tronGrid.getLatestBlockNumber();
        const transfers = await this.tronGrid.fetchIncomingTransfersSince({
          walletAddress: wallet.address,
          contractAddress: cfg.usdtContractAddress,
          minTimestamp,
        });

        let inserted = 0;
        let duplicates = 0;
        let rejected = 0;
        let failed = 0;
        let maxBlock = wallet.lastSyncedBlock ?? 0n;
        let maxTimestamp = wallet.lastSyncedTimestamp ?? new Date(0);

        const blockCache = new Map<string, number>();

        for (const transfer of transfers) {
          try {
            let blockNumber = blockCache.get(transfer.transaction_id);
            if (blockNumber === undefined) {
              blockNumber = (
                await this.tronGrid.getTransactionInfoById(
                  transfer.transaction_id,
                )
              ).blockNumber;
              blockCache.set(transfer.transaction_id, blockNumber);
            }

            const result = await this.ingestion.processTrc20Transfer({
              walletId: wallet.id,
              monitoredAddress: wallet.address,
              transfer,
              latestBlockNumber: latestBlock,
              source: TransactionSource.poll,
              blockNumber,
            });

            switch (result.status) {
              case 'inserted':
                inserted++;
                break;
              case 'duplicate_ignored':
                duplicates++;
                break;
              case 'rejected':
                rejected++;
                break;
              case 'failed':
                failed++;
                break;
            }

            const ts = new Date(transfer.block_timestamp);
            if (BigInt(blockNumber) > maxBlock) maxBlock = BigInt(blockNumber);
            if (ts > maxTimestamp) maxTimestamp = ts;
          } catch (itemError) {
            failed++;
            this.logger.error(
              {
                hash: transfer.transaction_id,
                err:
                  itemError instanceof Error
                    ? itemError.message
                    : String(itemError),
              },
              'Failed to process transfer in batch',
            );
          }
        }

        if (transfers.length > 0) {
          await this.wallets.updateSyncWatermark(
            wallet.id,
            maxBlock,
            maxTimestamp,
          );
        }

        this.logger.log(
          {
            fetched: transfers.length,
            inserted,
            duplicates,
            rejected,
            failed,
            durationMs: Date.now() - started,
            minTimestamp,
          },
          'Reconciliation run complete',
        );
      } catch (error) {
        this.logger.error(
          {
            err: error instanceof Error ? error.message : String(error),
            durationMs: Date.now() - started,
          },
          'Reconciliation run failed — will retry on next interval',
        );
      }
    });
  }
}

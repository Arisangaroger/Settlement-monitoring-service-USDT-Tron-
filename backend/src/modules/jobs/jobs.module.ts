import { Module } from '@nestjs/common';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { IngestionModule } from '../ingestion/ingestion.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { WalletsModule } from '../wallets/wallets.module';
import { ConfirmationUpdaterJob } from './confirmation-updater.job';
import { JobMutex } from './job-mutex';
import { ReconciliationJob } from './reconciliation.job';

@Module({
  imports: [
    BlockchainModule,
    IngestionModule,
    WalletsModule,
    TransactionsModule,
  ],
  providers: [JobMutex, ReconciliationJob, ConfirmationUpdaterJob],
})
export class JobsModule {}

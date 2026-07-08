import { Module } from '@nestjs/common';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { IngestionService } from './ingestion.service';

@Module({
  imports: [BlockchainModule],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}

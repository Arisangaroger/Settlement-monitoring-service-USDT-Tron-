import { Module } from '@nestjs/common';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { AppConfigModule } from '../config/config.module';
import { IngestionModule } from '../ingestion/ingestion.module';
import { WalletsModule } from '../wallets/wallets.module';
import { TatumWebhookService } from './tatum-webhook.service';
import { TronWebhookController } from './tron-webhook.controller';
import { WebhookEventsLogService } from './webhook-events-log.service';

@Module({
  imports: [AppConfigModule, IngestionModule, WalletsModule, BlockchainModule],
  controllers: [TronWebhookController],
  providers: [TatumWebhookService, WebhookEventsLogService],
})
export class WebhooksModule {}

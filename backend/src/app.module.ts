import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppBootstrapService } from './app-bootstrap.service';
import { AppConfigModule } from './modules/config/config.module';
import { AppConfigService } from './modules/config/app-config.service';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { HealthModule } from './modules/health/health.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { StatsModule } from './modules/stats/stats.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        level: process.env.LOG_LEVEL ?? 'info',
        autoLogging: true,
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => {
        const cfg = appConfig.get();
        return [
          {
            ttl: cfg.throttleTtlMs,
            limit: cfg.throttleLimit,
          },
        ];
      },
    }),
    AppConfigModule,
    PrismaModule,
    BlockchainModule,
    WalletsModule,
    TransactionsModule,
    StatsModule,
    HealthModule,
    WebhooksModule,
    IngestionModule,
    JobsModule,
  ],
  providers: [
    AppBootstrapService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

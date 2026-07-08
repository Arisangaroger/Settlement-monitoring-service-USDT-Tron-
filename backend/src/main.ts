import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { AppConfigService } from './modules/config/app-config.service';
import { WalletsService } from './modules/wallets/wallets.service';
import { setupSwagger } from './swagger';

loadEnv({ path: resolve(__dirname, '../../.env'), override: true });
loadEnv({ path: resolve(__dirname, '../.env'), override: true });

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const config = app.get(AppConfigService).get();
  const logger = app.get(Logger);

  app.use(helmet());
  app.enableCors({
    origin: config.corsOrigin,
    methods: ['GET', 'HEAD', 'PUT'],
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  setupSwagger(app);

  await app.listen(config.port);

  const monitored = await app.get(WalletsService).getActiveWallet().catch(() => null);

  logger.log(
    `Settlement monitor API (network=${config.tronNetwork}, wallet=${monitored?.address ?? 'none — connect TronLink'})`,
  );
  logger.log(`HTTP listening on http://localhost:${config.port}/api`);
  logger.log(`Swagger docs at http://localhost:${config.port}/docs`);
  logger.log(
    `Jobs active — reconciliation every ${config.reconciliationIntervalMs}ms`,
  );
}

bootstrap().catch((error: unknown) => {
  console.error('Fatal bootstrap error:', error);
  process.exit(1);
});

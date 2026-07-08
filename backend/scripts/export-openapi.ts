import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { buildOpenApiDocument, writeOpenApiFile } from '../src/swagger';

loadEnv({ path: resolve(__dirname, '../../.env'), override: true });
loadEnv({ path: resolve(__dirname, '../.env'), override: true });

async function exportOpenApi(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });
  app.setGlobalPrefix('api');

  const document = buildOpenApiDocument(app);
  writeOpenApiFile(document);

  await app.close();
  Logger.log('Wrote docs/openapi.json', 'OpenApiExport');
}

exportOpenApi().catch((error: unknown) => {
  console.error('OpenAPI export failed:', error);
  process.exit(1);
});

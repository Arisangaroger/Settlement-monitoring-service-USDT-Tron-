import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

const API_DESCRIPTION = [
  'REST API for USDT TRC20 transaction monitoring on TRON.',
  '',
  '**Response envelope:** successful responses use `{ "data": …, "meta"?: … }`.',
  'Paginated lists always include `meta` with `page`, `limit`, `total`, `totalPages`.',
  'Errors use `{ "error": { "code", "message" } }`.',
  '',
  '**Wallet scoping:** `GET /transactions`, `GET /stats`, and webhook ingestion',
  'are scoped to the active monitored wallet (`GET/PUT /wallets/monitored`).',
  '',
  'See also: [docs/api-contract.md](../docs/api-contract.md) in the repository.',
].join('\n');

export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const port = process.env.PORT ?? '3000';

  const config = new DocumentBuilder()
    .setTitle('Stablecoin Settlement Monitor API')
    .setDescription(API_DESCRIPTION)
    .setVersion('1.0')
    .addServer(`http://localhost:${port}`, 'Local development')
    .addTag('transactions', 'USDT transfer history (scoped to active wallet)')
    .addTag('stats', 'Dashboard aggregates (scoped to active wallet)')
    .addTag('wallets', 'Active monitored wallet configuration')
    .addTag('health', 'Service liveness and database connectivity')
    .addTag('webhooks', 'Tatum ADDRESS_EVENT receiver (optional fast path)')
    .build();

  return SwaggerModule.createDocument(app, config);
}

export function setupSwagger(app: INestApplication): void {
  const document = buildOpenApiDocument(app);
  SwaggerModule.setup('docs', app, document);

  if (process.env.EXPORT_OPENAPI === 'true') {
    writeOpenApiFile(document);
  }
}

export function writeOpenApiFile(document: OpenAPIObject): void {
  const target = resolve(process.cwd(), '..', 'docs', 'openapi.json');
  writeFileSync(target, JSON.stringify(document, null, 2));
}

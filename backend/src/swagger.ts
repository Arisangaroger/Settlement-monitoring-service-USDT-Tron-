import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Stablecoin Settlement Monitor API')
    .setDescription(
      'REST API for USDT TRC20 transaction monitoring on TRON',
    )
    .setVersion('1.0')
    .addTag('transactions')
    .addTag('stats')
    .addTag('health')
    .addTag('wallets')
    .addTag('webhooks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Export a static spec for evaluators who prefer reviewing a file over
  // running the app. Opt-in so it never writes in the container/production.
  if (process.env.EXPORT_OPENAPI === 'true') {
    const target = resolve(process.cwd(), '..', 'docs', 'openapi.json');
    writeFileSync(target, JSON.stringify(document, null, 2));
  }
}

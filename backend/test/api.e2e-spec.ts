import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { TronGridClient } from '../src/modules/blockchain/trongrid.client';
import { AppConfigService } from '../src/modules/config/app-config.service';
import { computeTatumPayloadHash } from '../src/modules/webhooks/tatum-webhook-auth';
import { ConfirmationUpdaterJob } from '../src/modules/jobs/confirmation-updater.job';
import { ReconciliationJob } from '../src/modules/jobs/reconciliation.job';
import { PrismaService } from '../src/modules/prisma/prisma.service';

const TATUM_SAMPLE_PAYLOAD = {
  kind: 'token_transfer',
  blockNumber: 66423624,
  blockTimestamp: 1783470642000,
  txId: 'f247cdd9f1ad0e383791efb12ee1bcc789da7608ec87c0cbbf7a444f9590856e',
  from: 'TY7qDg91GYtwFpyieenJb2F8rUvo7VPxbt',
  to: 'TFCJpYH7LzLSXTWFj7syybrMU4cHvuX39k',
  value: '1',
  contractAddress: 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs',
  tokenMetadata: {
    symbol: 'USDT',
    name: 'TetherToken',
    decimals: 6,
  },
  chain: 'tron-testnet',
};

function buildTatumPayload(txId: string) {
  return {
    ...TATUM_SAMPLE_PAYLOAD,
    txId,
    blockNumber: TATUM_SAMPLE_PAYLOAD.blockNumber + 1,
    blockTimestamp: TATUM_SAMPLE_PAYLOAD.blockTimestamp + 1000,
  };
}

function uniqueTxId(prefix: string): string {
  const hex = `${prefix}${Date.now().toString(16)}`.replace(/[^a-f0-9]/gi, 'a');
  return hex.padEnd(64, '0').slice(0, 64);
}

describe('REST API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.TRON_NETWORK = 'shasta';
    process.env.MONITORED_WALLET_ADDRESS =
      'TFCJpYH7LzLSXTWFj7syybrMU4cHvuX39k';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ReconciliationJob)
      .useValue({ onModuleInit: () => undefined, onModuleDestroy: () => undefined })
      .overrideProvider(ConfirmationUpdaterJob)
      .useValue({ onModuleInit: () => undefined, onModuleDestroy: () => undefined })
      .overrideProvider(TronGridClient)
      .useValue({
        getLatestBlockNumber: jest.fn().mockResolvedValue(66424000),
        fetchIncomingTransfersSince: jest.fn().mockResolvedValue([]),
        getTransactionInfoById: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe('ok');
      });
  });

  it('GET /api/wallets/monitored returns active wallet', () => {
    return request(app.getHttpServer())
      .get('/api/wallets/monitored')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.address).toBe('TFCJpYH7LzLSXTWFj7syybrMU4cHvuX39k');
        expect(res.body.data.active).toBe(true);
      });
  });

  it('PUT /api/wallets/monitored updates watched wallet without redeploy', async () => {
    const newAddress = 'TY7qDg91GYtwFpyieenJb2F8rUvo7VPxbt';

    await request(app.getHttpServer())
      .put('/api/wallets/monitored')
      .send({ address: newAddress })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.address).toBe(newAddress);
        expect(res.body.data.active).toBe(true);
      });

    await request(app.getHttpServer())
      .get('/api/wallets/monitored')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.address).toBe(newAddress);
      });

    // Restore default wallet for other tests
    await request(app.getHttpServer())
      .put('/api/wallets/monitored')
      .send({ address: 'TFCJpYH7LzLSXTWFj7syybrMU4cHvuX39k' })
      .expect(200);
  });

  it('GET /api/stats returns aggregates', () => {
    return request(app.getHttpServer())
      .get('/api/stats')
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toHaveProperty('totalTransactions');
        expect(res.body.data).toHaveProperty('totalUsdtReceived');
        expect(res.body.data).toHaveProperty('confirmedCount');
        expect(res.body.data).toHaveProperty('pendingCount');
      });
  });

  it('GET /api/transactions paginated list', () => {
    return request(app.getHttpServer())
      .get('/api/transactions?page=1&limit=10')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.meta).toMatchObject({
          page: 1,
          limit: 10,
        });
      });
  });

  it('GET /api/transactions rejects invalid status filter', () => {
    return request(app.getHttpServer())
      .get('/api/transactions?confirmationStatus=banana')
      .expect(400)
      .expect((res) => {
        expect(res.body.error.code).toBe('BAD_REQUEST');
      });
  });

  it('GET /api/transactions/:id returns 404 for unknown UUID', () => {
    return request(app.getHttpServer())
      .get('/api/transactions/00000000-0000-4000-8000-000000000000')
      .expect(404)
      .expect((res) => {
        expect(res.body.error.code).toBe('NOT_FOUND');
      });
  });

  it('GET /api/transactions/:id returns 400 for malformed UUID', () => {
    return request(app.getHttpServer())
      .get('/api/transactions/not-a-uuid')
      .expect(400);
  });

  it('GET /api/transactions/search returns 400 for bad hash', () => {
    return request(app.getHttpServer())
      .get('/api/transactions/search?hash=bad')
      .expect(400);
  });

  it('POST /api/webhooks/tron accepts valid Tatum payload', () => {
    return request(app.getHttpServer())
      .post('/api/webhooks/tron')
      .send(TATUM_SAMPLE_PAYLOAD)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.received).toBe(true);
        expect(res.body.data.txId).toBe(TATUM_SAMPLE_PAYLOAD.txId);
        expect(['inserted', 'duplicate_ignored']).toContain(res.body.data.status);
      });
  });

  it('POST /api/webhooks/tron inserts a new transaction via shared ingestion', async () => {
    const txId = uniqueTxId('aa');
    const payload = buildTatumPayload(txId);

    const res = await request(app.getHttpServer())
      .post('/api/webhooks/tron')
      .send(payload)
      .expect(200);

    expect(res.body.data.status).toBe('inserted');

    const row = await prisma.transaction.findUnique({
      where: { transactionHash: txId },
    });
    expect(row).not.toBeNull();
    expect(row?.source).toBe('webhook');
  });

  it('POST /api/webhooks/tron replay returns 200 and does not duplicate rows', async () => {
    const txId = uniqueTxId('bb');
    const payload = buildTatumPayload(txId);

    const first = await request(app.getHttpServer())
      .post('/api/webhooks/tron')
      .send(payload)
      .expect(200);

    expect(first.body.data.status).toBe('inserted');

    const second = await request(app.getHttpServer())
      .post('/api/webhooks/tron')
      .send(payload)
      .expect(200);

    expect(second.body.data.status).toBe('duplicate_ignored');

    const count = await prisma.transaction.count({
      where: { transactionHash: txId },
    });
    expect(count).toBe(1);
  });

  it('POST /api/webhooks/tron rejects malformed payload', async () => {
    const before = await prisma.webhookEventsLog.count();

    await request(app.getHttpServer())
      .post('/api/webhooks/tron')
      .send({ kind: 'token_transfer' })
      .expect(400)
      .expect((res) => {
        expect(res.body.error.code).toBe('BAD_REQUEST');
      });

    const after = await prisma.webhookEventsLog.count();
    expect(after).toBe(before + 1);

    const latest = await prisma.webhookEventsLog.findFirst({
      orderBy: { receivedAt: 'desc' },
    });
    expect(latest?.processed).toBe(false);
    expect(latest?.errorMessage).toBeTruthy();
  });

  it('POST /api/webhooks/tron rejects invalid HMAC when secret configured', async () => {
    const appConfig = app.get(AppConfigService);
    jest.spyOn(appConfig, 'get').mockReturnValue({
      ...appConfig.get(),
      tatumWebhookHmacSecret: 'e2e-test-secret',
    });

    await request(app.getHttpServer())
      .post('/api/webhooks/tron')
      .send(TATUM_SAMPLE_PAYLOAD)
      .expect(401)
      .expect((res) => {
        expect(res.body.error.code).toBe('UNAUTHORIZED');
      });

    jest.restoreAllMocks();
  });

  it('POST /api/webhooks/tron accepts valid HMAC when secret configured', async () => {
    const secret = 'e2e-test-secret';
    const appConfig = app.get(AppConfigService);
    jest.spyOn(appConfig, 'get').mockReturnValue({
      ...appConfig.get(),
      tatumWebhookHmacSecret: secret,
    });

    const hash = computeTatumPayloadHash(TATUM_SAMPLE_PAYLOAD, secret);

    await request(app.getHttpServer())
      .post('/api/webhooks/tron')
      .set('x-payload-hash', hash)
      .send(TATUM_SAMPLE_PAYLOAD)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.received).toBe(true);
        expect(['inserted', 'duplicate_ignored']).toContain(res.body.data.status);
      });

    jest.restoreAllMocks();
  });

  it('GET /api/transactions/search finds seeded hash when present', async () => {
    const hash =
      'f096b4ca3f10109130ee5f5ad1f45b315f97f41c4a3a7ad5e9d02989111894e1';
    const res = await request(app.getHttpServer()).get(
      `/api/transactions/search?hash=${hash}`,
    );
    if (res.status === 200) {
      expect(res.body.data.transactionHash).toBe(hash);
    } else {
      expect(res.status).toBe(404);
    }
  });
});

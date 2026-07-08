import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig } from '../config.js';
import { TronGridClient } from '../tronGridClient.js';

const OUTPUT_FILE = join(
  process.cwd(),
  'sample-responses',
  'rate-limit-and-error-samples.json',
);

async function main(): Promise<void> {
  const config = loadConfig();
  const client = new TronGridClient(
    config.trongridBaseUrl,
    config.trongridApiKey,
  );

  console.log('Rate limit & error handling discovery');
  console.log('=====================================');

  const burstResults: Array<{ request: number; status: number; ok: boolean }> =
    [];
  const burstCount = Number(process.env.BURST_REQUEST_COUNT ?? 25);

  for (let i = 1; i <= burstCount; i++) {
    const { status } = await client.getTrc20Transfers({
      address: config.usdtContractAddress,
      contractAddress: config.usdtContractAddress,
      limit: 1,
    });
    burstResults.push({ request: i, status, ok: status === 200 });
  }

  const non200 = burstResults.filter((r) => r.status !== 200);
  console.log(`Burst test (${burstCount} requests):`);
  console.log(`  All 200 OK: ${non200.length === 0}`);
  if (non200.length > 0) {
    console.log('  Non-200 responses:', non200);
  }

  const invalidAddress = 'NOT_A_VALID_ADDRESS';
  const invalid = await client.getTrc20Transfers({
    address: invalidAddress,
    contractAddress: config.usdtContractAddress,
    limit: 1,
  });

  console.log('\nInvalid address test:');
  console.log(`  HTTP status: ${invalid.status}`);
  console.log(`  Body:`, JSON.stringify(invalid.body, null, 2));

  const samples = {
    testedAt: new Date().toISOString(),
    network: config.network,
    apiKeyConfigured: Boolean(config.trongridApiKey),
    burstRequestCount: burstCount,
    burstResults,
    invalidAddressSample: {
      address: invalidAddress,
      httpStatus: invalid.status,
      body: invalid.body,
    },
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(samples, null, 2), 'utf8');
  console.log(`\nSaved samples to ${OUTPUT_FILE}`);
  console.log('See docs/rate-limits-and-errors.md for interpretation.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

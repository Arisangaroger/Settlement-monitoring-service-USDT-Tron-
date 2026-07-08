import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, requireMonitoredWallet } from '../config.js';
import { TronGridClient } from '../tronGridClient.js';

const OUTPUT_DIR = join(process.cwd(), 'sample-responses');
const OUTPUT_FILE = join(OUTPUT_DIR, 'trc20-transfer-raw.json');

async function main(): Promise<void> {
  const config = loadConfig();
  const wallet = requireMonitoredWallet(config);
  const client = new TronGridClient(
    config.trongridBaseUrl,
    config.trongridApiKey,
  );

  console.log(`Fetching raw TRC20 response for wallet: ${wallet}`);

  const { status, body } = await client.getTrc20Transfers({
    address: wallet,
    contractAddress: config.usdtContractAddress,
    limit: 20,
    onlyTo: true,
    onlyConfirmed: true,
    orderBy: 'block_timestamp,desc',
  });

  console.log(`HTTP status: ${status}`);
  console.log(JSON.stringify(body, null, 2));

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_FILE, JSON.stringify(body, null, 2), 'utf8');
  console.log(`\nSaved raw response to ${OUTPUT_FILE}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

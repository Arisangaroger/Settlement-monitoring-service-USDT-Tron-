import { loadConfig } from '../config.js';
import { TronGridClient } from '../tronGridClient.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const client = new TronGridClient(
    config.trongridBaseUrl,
    config.trongridApiKey,
  );

  console.log('TronGrid health check');
  console.log('---------------------');
  console.log(`Network:     ${config.network}`);
  console.log(`Base URL:    ${config.trongridBaseUrl}`);
  console.log(`API key:     ${config.trongridApiKey ? '(set)' : '(not set)'}`);
  console.log(`USDT contract: ${config.usdtContractAddress}`);

  const latestBlock = await client.getLatestBlockNumber();
  console.log(`Latest block: ${latestBlock}`);
  console.log('\nHealth check passed.');
}

main().catch((error: unknown) => {
  console.error('Health check failed:', error);
  process.exit(1);
});

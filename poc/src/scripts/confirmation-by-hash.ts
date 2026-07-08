import { loadConfig } from '../config.js';
import { TronGridClient } from '../tronGridClient.js';
import { computeConfirmations, confirmationStatus } from '../utils/confirmations.js';

async function main(): Promise<void> {
  const txHash = process.argv[2];
  if (!txHash) {
    console.error('Usage: npm run confirmations -- <transaction_hash>');
    process.exit(1);
  }

  const config = loadConfig();
  const client = new TronGridClient(
    config.trongridBaseUrl,
    config.trongridApiKey,
  );

  const [latestBlock, txInfo] = await Promise.all([
    client.getLatestBlockNumber(),
    client.getTransactionInfoById(txHash),
  ]);

  const confirmations = computeConfirmations(
    latestBlock,
    txInfo.blockNumber,
  );
  const status = confirmationStatus(
    confirmations,
    config.confirmationThreshold,
  );

  console.log('Confirmation check');
  console.log('------------------');
  console.log(`Transaction hash:     ${txHash}`);
  console.log(`Transaction block:    ${txInfo.blockNumber}`);
  console.log(`Latest block:         ${latestBlock}`);
  console.log(`Confirmations:        ${confirmations}`);
  console.log(`Threshold:            ${config.confirmationThreshold}`);
  console.log(`Status:               ${status}`);
  console.log(
    `Block timestamp (UTC): ${new Date(txInfo.blockTimeStamp).toISOString()}`,
  );
  console.log(
    '\nRe-run this script over a few minutes to watch confirmations increase on very recent transactions.',
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

import { loadConfig, requireMonitoredWallet } from '../config.js';
import { TronGridClient } from '../tronGridClient.js';
import { isIncomingUsdtTransfer, parseTransfer } from '../utils/parseTransfer.js';
import type { TronGridTrc20Transfer } from '../types/trongrid.js';

async function resolveBlockNumber(
  client: TronGridClient,
  transfer: TronGridTrc20Transfer,
  cache: Map<string, number>,
): Promise<number> {
  const cached = cache.get(transfer.transaction_id);
  if (cached !== undefined) return cached;

  const info = await client.getTransactionInfoById(transfer.transaction_id);
  cache.set(transfer.transaction_id, info.blockNumber);
  return info.blockNumber;
}

async function main(): Promise<void> {
  const config = loadConfig();
  const wallet = requireMonitoredWallet(config);
  const client = new TronGridClient(
    config.trongridBaseUrl,
    config.trongridApiKey,
  );

  const latestBlock = await client.getLatestBlockNumber();
  const { body } = await client.getTrc20Transfers({
    address: wallet,
    contractAddress: config.usdtContractAddress,
    limit: 50,
    onlyTo: true,
    onlyConfirmed: true,
    orderBy: 'block_timestamp,desc',
  });

  if (!body.success) {
    throw new Error(body.error ?? 'TronGrid request failed');
  }

  const incoming = body.data.filter((transfer) =>
    isIncomingUsdtTransfer(
      transfer,
      wallet,
      config.usdtContractAddress,
    ),
  );

  console.log('Incoming USDT (TRC20) transfers');
  console.log('=================================');
  console.log(`Network:              ${config.network}`);
  console.log(`Monitored wallet:       ${wallet}`);
  console.log(`USDT contract:        ${config.usdtContractAddress}`);
  console.log(`Latest block:         ${latestBlock}`);
  console.log(`Confirmation threshold: ${config.confirmationThreshold}`);
  console.log(`Matching transfers:   ${incoming.length}`);

  if (incoming.length === 0) {
    console.log('\nNo incoming USDT transfers found.');
    console.log(
      'Tip: fund your Nile wallet via https://nileex.io/join/getJoinPage and send test USDT to yourself.',
    );
    return;
  }

  const blockCache = new Map<string, number>();
  const parsed = [];

  for (const transfer of incoming) {
    const blockNumber = await resolveBlockNumber(client, transfer, blockCache);
    parsed.push(
      parseTransfer(
        transfer,
        blockNumber,
        latestBlock,
        config.confirmationThreshold,
      ),
    );
  }

  console.log('\nStructured summary:\n');
  console.log(JSON.stringify(parsed, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

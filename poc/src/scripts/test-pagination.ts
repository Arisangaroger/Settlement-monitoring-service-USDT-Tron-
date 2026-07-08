import { loadConfig, requireMonitoredWallet } from '../config.js';
import { TronGridClient } from '../tronGridClient.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const wallet = requireMonitoredWallet(config);
  const client = new TronGridClient(
    config.trongridBaseUrl,
    config.trongridApiKey,
  );

  console.log('Pagination & incremental fetch experiments');
  console.log('==========================================');

  const page1 = await client.getTrc20Transfers({
    address: wallet,
    contractAddress: config.usdtContractAddress,
    limit: 5,
    onlyTo: true,
    orderBy: 'block_timestamp,desc',
  });

  console.log('\n[Page 1] count:', page1.body.data.length);
  console.log('fingerprint:', page1.body.meta?.fingerprint ?? '(none)');
  console.log('next link:', page1.body.meta?.links?.next ?? '(none)');

  const fingerprint = page1.body.meta?.fingerprint;
  if (fingerprint) {
    const page2 = await client.getTrc20Transfers({
      address: wallet,
      contractAddress: config.usdtContractAddress,
      limit: 5,
      onlyTo: true,
      orderBy: 'block_timestamp,desc',
      fingerprint,
    });

    console.log('\n[Page 2 via fingerprint] count:', page2.body.data.length);
    const page1Ids = new Set(page1.body.data.map((t) => t.transaction_id));
    const overlap = page2.body.data.filter((t) =>
      page1Ids.has(t.transaction_id),
    ).length;
    console.log('Overlap with page 1:', overlap, '(expected 0)');
  }

  const newest = page1.body.data[0];
  if (newest) {
    const minTs = newest.block_timestamp + 1;
    const incremental = await client.getTrc20Transfers({
      address: wallet,
      contractAddress: config.usdtContractAddress,
      limit: 20,
      onlyTo: true,
      minTimestamp: minTs,
      orderBy: 'block_timestamp,asc',
    });

    console.log('\n[Incremental via min_timestamp]');
    console.log(`min_timestamp: ${minTs} (${new Date(minTs).toISOString()})`);
    console.log('Newer-than-latest-known count:', incremental.body.data.length);
  }

  console.log('\nSee docs/pagination-strategy.md for Phase 3 recommendation.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

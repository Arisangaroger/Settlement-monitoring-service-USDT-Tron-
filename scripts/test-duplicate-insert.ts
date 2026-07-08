import 'dotenv/config';
import { PrismaClient, TransactionSource } from '@prisma/client';

const prisma = new PrismaClient();

const DUPLICATE_HASH =
  'f096b4ca3f10109130ee5f5ad1f45b315f97f41c4a3a7ad5e9d02989111894e1';

async function main(): Promise<void> {
  console.log('Duplicate insert rejection test');
  console.log('=============================\n');

  const wallet = await prisma.monitoringWallet.findFirst();
  if (!wallet) {
    throw new Error('No monitoring wallet found. Run npm run db:seed first.');
  }

  const beforeCount = await prisma.transaction.count();
  console.log(`Rows before duplicate attempt: ${beforeCount}`);

  let caught = false;
  try {
    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        transactionHash: DUPLICATE_HASH,
        senderAddress: 'TY7qDg91GYtwFpyieenJb2F8rUvo7VPxbt',
        recipientAddress: wallet.address,
        amount: '1.000000',
        amountRaw: '1000000',
        tokenSymbol: 'USDT',
        contractAddress: 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf',
        blockNumber: 68985021n,
        blockTimestamp: new Date('2026-07-07T20:56:33.000Z'),
        confirmations: 22,
        confirmationStatus: 'confirmed',
        processingStatus: 'duplicate_ignored',
        source: TransactionSource.poll,
      },
    });
  } catch (error: unknown) {
    caught = true;
    const message = error instanceof Error ? error.message : String(error);
    console.log('Expected error on duplicate insert:');
    console.log(message.slice(0, 200));
  }

  const afterCount = await prisma.transaction.count();
  console.log(`\nRows after duplicate attempt: ${afterCount}`);
  console.log(`Unique constraint blocked insert: ${caught ? 'YES' : 'NO'}`);
  console.log(`Row count unchanged: ${beforeCount === afterCount ? 'YES' : 'NO'}`);

  if (!caught || beforeCount !== afterCount) {
    process.exit(1);
  }

  // Also demonstrate skipDuplicates pattern (ingestion-safe path)
  const skipResult = await prisma.transaction.createMany({
    data: [
      {
        walletId: wallet.id,
        transactionHash: DUPLICATE_HASH,
        senderAddress: 'TY7qDg91GYtwFpyieenJb2F8rUvo7VPxbt',
        recipientAddress: wallet.address,
        amount: '1.000000',
        amountRaw: '1000000',
        tokenSymbol: 'USDT',
        contractAddress: 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf',
        blockNumber: 68985021n,
        blockTimestamp: new Date('2026-07-07T20:56:33.000Z'),
        confirmations: 22,
        confirmationStatus: 'confirmed',
        processingStatus: 'new',
        source: TransactionSource.webhook,
      },
    ],
    skipDuplicates: true,
  });

  console.log(`\ncreateMany skipDuplicates count: ${skipResult.count} (expected 0)`);
  console.log('\nDuplicate rejection test passed.');
}

main()
  .catch((error: unknown) => {
    console.error('Test failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

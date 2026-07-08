import 'dotenv/config';
import { PrismaClient, TransactionSource } from '@prisma/client';

const prisma = new PrismaClient();

/** Real Phase 1 sample from poc/sample-responses/trc20-transfer-raw.json */
const SAMPLE = {
  walletAddress: 'TFCJpYH7LzLSXTWFj7syybrMU4cHvuX39k',
  walletLabel: 'Nile test wallet',
  transactionHash:
    'f096b4ca3f10109130ee5f5ad1f45b315f97f41c4a3a7ad5e9d02989111894e1',
  senderAddress: 'TY7qDg91GYtwFpyieenJb2F8rUvo7VPxbt',
  recipientAddress: 'TFCJpYH7LzLSXTWFj7syybrMU4cHvuX39k',
  amountRaw: '1000000',
  amount: '1.000000',
  tokenSymbol: 'USDT',
  contractAddress: 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf',
  blockNumber: 68985021n,
  blockTimestamp: new Date('2026-07-07T20:56:33.000Z'),
  confirmations: 22,
  confirmationStatus: 'confirmed' as const,
  source: TransactionSource.poll,
};

async function main(): Promise<void> {
  console.log('Seeding Phase 1 sample transaction...\n');

  const wallet = await prisma.monitoringWallet.upsert({
    where: { address: SAMPLE.walletAddress },
    create: {
      address: SAMPLE.walletAddress,
      label: SAMPLE.walletLabel,
      active: true,
      lastSyncedBlock: SAMPLE.blockNumber,
      lastSyncedTimestamp: SAMPLE.blockTimestamp,
    },
    update: {
      label: SAMPLE.walletLabel,
      lastSyncedBlock: SAMPLE.blockNumber,
      lastSyncedTimestamp: SAMPLE.blockTimestamp,
    },
  });

  const existing = await prisma.transaction.findUnique({
    where: { transactionHash: SAMPLE.transactionHash },
  });

  if (existing) {
    console.log('Transaction already seeded:', existing.transactionHash);
  } else {
    const tx = await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        transactionHash: SAMPLE.transactionHash,
        senderAddress: SAMPLE.senderAddress,
        recipientAddress: SAMPLE.recipientAddress,
        amount: SAMPLE.amount,
        amountRaw: SAMPLE.amountRaw,
        tokenSymbol: SAMPLE.tokenSymbol,
        contractAddress: SAMPLE.contractAddress,
        blockNumber: SAMPLE.blockNumber,
        blockTimestamp: SAMPLE.blockTimestamp,
        confirmations: SAMPLE.confirmations,
        confirmationStatus: SAMPLE.confirmationStatus,
        processingStatus: 'new',
        source: SAMPLE.source,
      },
    });

    console.log('Inserted transaction:');
    console.log(JSON.stringify(tx, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2));
  }

  const count = await prisma.transaction.count();
  console.log(`\nTotal transactions in DB: ${count}`);
  console.log('Seed complete.');
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

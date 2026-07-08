import { TransactionSource } from '@prisma/client';

export type IngestionResultStatus =
  | 'inserted'
  | 'duplicate_ignored'
  | 'rejected'
  | 'failed';

export interface IngestionResult {
  status: IngestionResultStatus;
  transactionHash: string;
  reason?: string;
}

export interface IngestTransactionInput {
  walletId: string;
  transactionHash: string;
  senderAddress: string;
  recipientAddress: string;
  amount: string;
  amountRaw: string;
  tokenSymbol: string;
  contractAddress: string;
  blockNumber: number;
  blockTimestamp: Date;
  confirmations: number;
  confirmationStatus: 'pending' | 'confirmed';
  source: TransactionSource;
}

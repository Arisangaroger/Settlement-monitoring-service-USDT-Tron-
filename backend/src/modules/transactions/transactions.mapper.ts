import { Transaction } from '@prisma/client';
import { TransactionResponseDto } from './dto/transaction-response.dto';

/** Maps DB entity → public API DTO (never expose amountRaw or walletId). */
export function toTransactionResponseDto(
  tx: Transaction,
): TransactionResponseDto {
  return {
    id: tx.id,
    transactionHash: tx.transactionHash,
    senderAddress: tx.senderAddress,
    recipientAddress: tx.recipientAddress,
    amount: tx.amount.toString(),
    tokenSymbol: tx.tokenSymbol,
    contractAddress: tx.contractAddress,
    blockNumber: tx.blockNumber.toString(),
    blockTimestamp: tx.blockTimestamp.toISOString(),
    confirmations: tx.confirmations,
    confirmationStatus: tx.confirmationStatus,
    processingStatus: tx.processingStatus,
    source: tx.source,
    createdAt: tx.createdAt.toISOString(),
    updatedAt: tx.updatedAt.toISOString(),
  };
}

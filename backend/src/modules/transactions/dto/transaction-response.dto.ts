import { ApiProperty } from '@nestjs/swagger';
import {
  ConfirmationStatus,
  ProcessingStatus,
  TransactionSource,
} from '@prisma/client';

export class TransactionResponseDto {
  @ApiProperty({ example: '6778b6b6-dc9c-444a-95a1-f37ea52d2095' })
  id!: string;

  @ApiProperty({
    example: 'f096b4ca3f10109130ee5f5ad1f45b315f97f41c4a3a7ad5e9d02989111894e1',
  })
  transactionHash!: string;

  @ApiProperty({ example: 'TY7qDg91GYtwFpyieenJb2F8rUvo7VPxbt' })
  senderAddress!: string;

  @ApiProperty({ example: 'TFCJpYH7LzLSXTWFj7syybrMU4cHvuX39k' })
  recipientAddress!: string;

  @ApiProperty({ example: '1.000000', description: 'Human-readable USDT amount' })
  amount!: string;

  @ApiProperty({ example: 'USDT' })
  tokenSymbol!: string;

  @ApiProperty({ example: 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf' })
  contractAddress!: string;

  @ApiProperty({ example: '68985021' })
  blockNumber!: string;

  @ApiProperty({ example: '2026-07-07T20:56:33.000Z' })
  blockTimestamp!: string;

  @ApiProperty({ example: 22 })
  confirmations!: number;

  @ApiProperty({ enum: ConfirmationStatus, example: 'confirmed' })
  confirmationStatus!: ConfirmationStatus;

  @ApiProperty({ enum: ProcessingStatus, example: 'new' })
  processingStatus!: ProcessingStatus;

  @ApiProperty({ enum: TransactionSource, example: 'poll' })
  source!: TransactionSource;

  @ApiProperty({ example: '2026-07-07T21:38:52.826Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-07-07T21:38:52.826Z' })
  updatedAt!: string;
}

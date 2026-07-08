import { ApiProperty } from '@nestjs/swagger';
import { MonitoredWalletResponseDto } from '../../modules/wallets/dto/monitored-wallet-response.dto';
import { StatsResponseDto } from '../../modules/stats/dto/stats-response.dto';
import { TransactionResponseDto } from '../../modules/transactions/dto/transaction-response.dto';

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}

export class ApiErrorBodyDto {
  @ApiProperty({
    example: 'NOT_FOUND',
    description:
      'Machine-readable code: BAD_REQUEST, UNAUTHORIZED, NOT_FOUND, TOO_MANY_REQUESTS, INTERNAL_ERROR',
  })
  code!: string;

  @ApiProperty({ example: 'Transaction with id … not found' })
  message!: string;
}

export class ApiErrorResponseDto {
  @ApiProperty({ type: ApiErrorBodyDto })
  error!: ApiErrorBodyDto;
}

export class HealthDataDto {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: 'up' })
  database!: string;

  @ApiProperty({ example: 'shasta' })
  network!: string;

  @ApiProperty({ example: 10 })
  transactionCount!: number;

  @ApiProperty({ example: '2026-07-08T12:00:00.000Z' })
  timestamp!: string;
}

export class HealthSuccessResponseDto {
  @ApiProperty({ type: HealthDataDto })
  data!: HealthDataDto;
}

export class StatsSuccessResponseDto {
  @ApiProperty({ type: StatsResponseDto })
  data!: StatsResponseDto;
}

export class MonitoredWalletSuccessResponseDto {
  @ApiProperty({ type: MonitoredWalletResponseDto })
  data!: MonitoredWalletResponseDto;
}

export class TransactionSuccessResponseDto {
  @ApiProperty({ type: TransactionResponseDto })
  data!: TransactionResponseDto;
}

export class PaginatedTransactionsResponseDto {
  @ApiProperty({ type: [TransactionResponseDto] })
  data!: TransactionResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

export class WebhookStatusDataDto {
  @ApiProperty({ example: true })
  active!: boolean;

  @ApiProperty({ example: '/api/webhooks/tron' })
  endpoint!: string;

  @ApiProperty({ example: 'shasta' })
  network!: string;

  @ApiProperty({ example: 'TFCJpYH7LzLSXTWFj7syybrMU4cHvuX39k' })
  monitoredWallet!: string;

  @ApiProperty({ enum: ['enabled', 'disabled'], example: 'disabled' })
  hmacValidation!: 'enabled' | 'disabled';

  @ApiProperty({ example: 5 })
  totalReceived!: number;

  @ApiProperty({ example: 4 })
  processed!: number;

  @ApiProperty({ example: 1 })
  failed!: number;

  @ApiProperty({
    example: '2026-07-08T12:00:00.000Z',
    nullable: true,
  })
  lastReceivedAt!: string | null;
}

export class WebhookStatusSuccessResponseDto {
  @ApiProperty({ type: WebhookStatusDataDto })
  data!: WebhookStatusDataDto;
}

export class WebhookReceiveDataDto {
  @ApiProperty({ example: true })
  received!: boolean;

  @ApiProperty({
    example: 'f247cdd9f1ad0e383791efb12ee1bcc789da7608ec87c0cbbf7a444f9590856e',
  })
  txId!: string;

  @ApiProperty({
    enum: ['inserted', 'duplicate_ignored', 'rejected', 'failed'],
    example: 'inserted',
  })
  status!: string;
}

export class WebhookReceiveSuccessResponseDto {
  @ApiProperty({ type: WebhookReceiveDataDto })
  data!: WebhookReceiveDataDto;
}

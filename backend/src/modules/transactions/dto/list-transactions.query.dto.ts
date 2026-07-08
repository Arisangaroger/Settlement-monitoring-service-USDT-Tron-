import { ApiPropertyOptional } from '@nestjs/swagger';
import { ConfirmationStatus, ProcessingStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class ListTransactionsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ enum: ConfirmationStatus })
  @IsOptional()
  @IsEnum(ConfirmationStatus, {
    message: 'confirmationStatus must be pending or confirmed',
  })
  confirmationStatus?: ConfirmationStatus;

  @ApiPropertyOptional({ enum: ProcessingStatus })
  @IsOptional()
  @IsEnum(ProcessingStatus, {
    message: 'processingStatus must be a valid processing status',
  })
  processingStatus?: ProcessingStatus;

  @ApiPropertyOptional({
    enum: ['block_timestamp', 'amount', 'created_at'],
    default: 'block_timestamp',
  })
  @IsOptional()
  @IsIn(['block_timestamp', 'amount', 'created_at'])
  sortBy: 'block_timestamp' | 'amount' | 'created_at' = 'block_timestamp';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';
}

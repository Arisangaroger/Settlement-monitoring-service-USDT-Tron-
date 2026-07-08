import { ApiProperty } from '@nestjs/swagger';

export class StatsResponseDto {
  @ApiProperty({ example: 10 })
  totalTransactions!: number;

  @ApiProperty({
    example: '15.500000',
    description: 'Sum of amount for confirmed transactions only',
  })
  totalUsdtReceived!: string;

  @ApiProperty({ example: 8 })
  confirmedCount!: number;

  @ApiProperty({ example: 2 })
  pendingCount!: number;
}

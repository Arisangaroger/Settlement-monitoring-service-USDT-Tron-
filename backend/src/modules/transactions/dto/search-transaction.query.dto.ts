import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches } from 'class-validator';

export class SearchTransactionQueryDto {
  @ApiProperty({
    example: 'f096b4ca3f10109130ee5f5ad1f45b315f97f41c4a3a7ad5e9d02989111894e1',
    description: '64-character TRON transaction hash (hex)',
  })
  @IsNotEmpty()
  @Matches(/^[a-fA-F0-9]{64}$/, {
    message: 'hash must be a 64-character hexadecimal string',
  })
  hash!: string;
}

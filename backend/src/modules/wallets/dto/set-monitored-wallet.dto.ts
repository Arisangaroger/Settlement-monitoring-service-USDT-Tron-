import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SetMonitoredWalletDto {
  @ApiProperty({
    example: 'TFCJpYH7LzLSXTWFj7syybrMU4cHvuX39k',
    description: 'TRON base58 address to monitor for incoming USDT',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(34)
  address!: string;
}

import { ApiProperty } from '@nestjs/swagger';

export class MonitoredWalletResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'TFCJpYH7LzLSXTWFj7syybrMU4cHvuX39k' })
  address!: string;

  @ApiProperty({ nullable: true })
  label!: string | null;

  @ApiProperty()
  active!: boolean;

  @ApiProperty({ nullable: true })
  lastSyncedBlock!: string | null;

  @ApiProperty({ nullable: true })
  lastSyncedTimestamp!: string | null;
}

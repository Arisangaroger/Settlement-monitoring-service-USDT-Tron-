import { Module } from '@nestjs/common';
import { TronGridClient } from './trongrid.client';

@Module({
  providers: [TronGridClient],
  exports: [TronGridClient],
})
export class BlockchainModule {}

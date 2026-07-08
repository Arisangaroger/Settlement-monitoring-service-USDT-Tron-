import { Module } from '@nestjs/common';
import { WalletsModule } from '../wallets/wallets.module';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [WalletsModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}

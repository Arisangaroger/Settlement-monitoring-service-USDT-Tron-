import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { successResponse } from '../../common/dto/api-envelope';
import { StatsResponseDto } from './dto/stats-response.dto';
import { StatsService } from './stats.service';
import { WalletsService } from '../wallets/wallets.service';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(
    private readonly statsService: StatsService,
    private readonly wallets: WalletsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Dashboard statistics',
    description:
      'totalUsdtReceived sums confirmed transactions only (settled USDT). Scoped to the active monitored wallet.',
  })
  @ApiOkResponse({ type: StatsResponseDto })
  async getStats() {
    const wallet = await this.wallets.getActiveWallet();
    const data = await this.statsService.getDashboardStats(wallet.id);
    return successResponse(data);
  }
}

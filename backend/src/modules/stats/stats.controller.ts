import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatsSuccessResponseDto } from '../../common/dto/api-envelope.dto';
import { ApiWalletScopedReadErrors } from '../../common/swagger/api-responses';
import { successResponse } from '../../common/dto/api-envelope';
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
      'Aggregates for the active monitored wallet. totalUsdtReceived sums confirmed transactions only (settled USDT).',
  })
  @ApiOkResponse({ type: StatsSuccessResponseDto })
  @ApiWalletScopedReadErrors()
  async getStats() {
    const wallet = await this.wallets.getActiveWallet();
    const data = await this.statsService.getDashboardStats(wallet.id);
    return successResponse(data);
  }
}

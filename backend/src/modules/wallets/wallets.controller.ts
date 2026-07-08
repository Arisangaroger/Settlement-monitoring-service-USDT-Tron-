import { Body, Controller, Get, Put } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { successResponse } from '../../common/dto/api-envelope';
import { MonitoredWalletResponseDto } from './dto/monitored-wallet-response.dto';
import { SetMonitoredWalletDto } from './dto/set-monitored-wallet.dto';
import { toMonitoredWalletResponseDto } from './wallets.mapper';
import { WalletsService } from './wallets.service';

@ApiTags('wallets')
@Controller('wallets')
export class WalletsController {
  constructor(private readonly wallets: WalletsService) {}

  @Get('monitored')
  @ApiOperation({
    summary: 'Get the currently monitored wallet',
    description:
      'Returns the active wallet from the database. No redeploy needed when this changes via PUT.',
  })
  @ApiOkResponse({ type: MonitoredWalletResponseDto })
  async getMonitored() {
    const wallet = await this.wallets.getActiveWallet();
    return successResponse(toMonitoredWalletResponseDto(wallet));
  }

  @Put('monitored')
  @ApiOperation({
    summary: 'Set the wallet to monitor (public — connect via TronLink in dashboard)',
    description:
      'Updates the active monitored wallet at runtime. Resets sync watermarks for the new address.',
  })
  @ApiOkResponse({ type: MonitoredWalletResponseDto })
  async setMonitored(@Body() body: SetMonitoredWalletDto) {
    const wallet = await this.wallets.setMonitoredWallet(body.address);
    return successResponse(toMonitoredWalletResponseDto(wallet));
  }
}

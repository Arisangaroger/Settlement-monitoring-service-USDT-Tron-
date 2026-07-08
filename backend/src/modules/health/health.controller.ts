import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { successResponse } from '../../common/dto/api-envelope';
import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appConfig: AppConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Service health check' })
  @ApiOkResponse({ description: 'Service is healthy' })
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    const transactionCount = await this.prisma.transaction.count();
    const cfg = this.appConfig.get();

    return successResponse({
      status: 'ok',
      database: 'up',
      network: cfg.tronNetwork,
      transactionCount,
      timestamp: new Date().toISOString(),
    });
  }
}

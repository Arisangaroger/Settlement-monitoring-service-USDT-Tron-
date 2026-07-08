import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { MonitoringWallet } from '@prisma/client';
import { isValidTronAddress } from '../blockchain/blockchain.utils';
import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletsService implements OnModuleInit {
  private readonly logger = new Logger(WalletsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly appConfig: AppConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const active = await this.prisma.monitoringWallet.findFirst({
      where: { active: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (active) {
      this.logger.log(`Monitoring wallet ready: ${active.address}`);
      return;
    }

    const seedAddress = this.appConfig.get().monitoredWalletAddress;
    if (seedAddress) {
      await this.ensureMonitoredWallet(seedAddress);
      return;
    }

    this.logger.warn(
      'No monitored wallet configured — connect TronLink in the dashboard',
    );
  }

  async ensureMonitoredWallet(address: string): Promise<MonitoringWallet> {
    await this.prisma.monitoringWallet.updateMany({
      where: { active: true },
      data: { active: false },
    });

    const wallet = await this.prisma.monitoringWallet.upsert({
      where: { address },
      create: {
        address,
        label: 'Primary monitored wallet',
        active: true,
      },
      update: { active: true },
    });

    this.logger.log(`Monitoring wallet ready: ${wallet.address}`);
    return wallet;
  }

  async getActiveWallet(): Promise<MonitoringWallet> {
    const active = await this.prisma.monitoringWallet.findFirst({
      where: { active: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (active) {
      return active;
    }

    const seedAddress = this.appConfig.get().monitoredWalletAddress;
    if (seedAddress) {
      return this.ensureMonitoredWallet(seedAddress);
    }

    throw new NotFoundException(
      'No monitored wallet configured. Connect TronLink in the dashboard.',
    );
  }

  async setMonitoredWallet(address: string): Promise<MonitoringWallet> {
    const normalized = address.trim();
    if (!isValidTronAddress(normalized)) {
      throw new BadRequestException('Invalid TRON wallet address');
    }

    await this.prisma.monitoringWallet.updateMany({
      data: { active: false },
    });

    const wallet = await this.prisma.monitoringWallet.upsert({
      where: { address: normalized },
      create: {
        address: normalized,
        label: 'Set via TronLink',
        active: true,
      },
      update: {
        active: true,
        label: 'Set via TronLink',
        lastSyncedBlock: null,
        lastSyncedTimestamp: null,
      },
    });

    this.logger.log(`Monitored wallet updated: ${wallet.address}`);
    return wallet;
  }

  async updateSyncWatermark(
    walletId: string,
    blockNumber: bigint,
    blockTimestamp: Date,
  ): Promise<void> {
    await this.prisma.monitoringWallet.update({
      where: { id: walletId },
      data: {
        lastSyncedBlock: blockNumber,
        lastSyncedTimestamp: blockTimestamp,
      },
    });
  }
}

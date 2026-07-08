import { Injectable } from '@nestjs/common';
import { ConfirmationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StatsResponseDto } from './dto/stats-response.dto';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(walletId: string): Promise<StatsResponseDto> {
    const walletFilter = { walletId };

    const [totalTransactions, confirmedCount, pendingCount, sumConfirmed] =
      await Promise.all([
        this.prisma.transaction.count({ where: walletFilter }),
        this.prisma.transaction.count({
          where: {
            ...walletFilter,
            confirmationStatus: ConfirmationStatus.confirmed,
          },
        }),
        this.prisma.transaction.count({
          where: {
            ...walletFilter,
            confirmationStatus: ConfirmationStatus.pending,
          },
        }),
        this.prisma.transaction.aggregate({
          where: {
            ...walletFilter,
            confirmationStatus: ConfirmationStatus.confirmed,
          },
          _sum: { amount: true },
        }),
      ]);

    const totalUsdtReceived =
      sumConfirmed._sum.amount?.toString() ?? '0';

    return {
      totalTransactions,
      totalUsdtReceived,
      confirmedCount,
      pendingCount,
    };
  }
}

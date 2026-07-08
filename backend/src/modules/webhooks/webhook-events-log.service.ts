import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhookEventsLogService {
  constructor(private readonly prisma: PrismaService) {}

  async recordReceived(rawPayload: Record<string, unknown>): Promise<string> {
    const row = await this.prisma.webhookEventsLog.create({
      data: {
        rawPayload: rawPayload as Prisma.InputJsonValue,
        processed: false,
      },
      select: { id: true },
    });
    return row.id;
  }

  async markProcessed(
    id: string,
    params: { processed: boolean; errorMessage?: string },
  ): Promise<void> {
    await this.prisma.webhookEventsLog.update({
      where: { id },
      data: {
        processed: params.processed,
        errorMessage: params.errorMessage ?? null,
      },
    });
  }

  async getStats(): Promise<{
    totalReceived: number;
    processed: number;
    failed: number;
    lastReceivedAt: Date | null;
  }> {
    const [totalReceived, processed, lastEvent] = await Promise.all([
      this.prisma.webhookEventsLog.count(),
      this.prisma.webhookEventsLog.count({ where: { processed: true } }),
      this.prisma.webhookEventsLog.findFirst({
        orderBy: { receivedAt: 'desc' },
        select: { receivedAt: true },
      }),
    ]);

    return {
      totalReceived,
      processed,
      failed: totalReceived - processed,
      lastReceivedAt: lastEvent?.receivedAt ?? null,
    };
  }
}

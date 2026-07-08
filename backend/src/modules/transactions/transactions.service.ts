import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ConfirmationStatus,
  Prisma,
  Transaction,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListTransactionsQueryDto } from './dto/list-transactions.query.dto';

export interface PaginatedTransactions {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const SORT_FIELD_MAP: Record<
  ListTransactionsQueryDto['sortBy'],
  keyof Prisma.TransactionOrderByWithRelationInput
> = {
  block_timestamp: 'blockTimestamp',
  created_at: 'createdAt',
  amount: 'amount',
};

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async countAll(): Promise<number> {
    return this.prisma.transaction.count();
  }

  async findPendingConfirmations(): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: { confirmationStatus: ConfirmationStatus.pending },
      orderBy: { blockNumber: 'asc' },
    });
  }

  async updateConfirmationState(
    id: string,
    confirmations: number,
    confirmationStatus: ConfirmationStatus,
  ): Promise<void> {
    await this.prisma.transaction.update({
      where: { id },
      data: { confirmations, confirmationStatus },
    });
  }

  async findManyPaginated(
    query: ListTransactionsQueryDto,
    walletId?: string,
  ): Promise<PaginatedTransactions> {
    const where: Prisma.TransactionWhereInput = {};
    if (walletId) {
      where.walletId = walletId;
    }
    if (query.confirmationStatus) {
      where.confirmationStatus = query.confirmationStatus;
    }
    if (query.processingStatus) {
      where.processingStatus = query.processingStatus;
    }

    const orderBy: Prisma.TransactionOrderByWithRelationInput = {
      [SORT_FIELD_MAP[query.sortBy]]: query.order,
    };

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy,
        skip,
        take: query.limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  async findById(id: string): Promise<Transaction> {
    const tx = await this.prisma.transaction.findUnique({ where: { id } });
    if (!tx) {
      throw new NotFoundException(`Transaction with id ${id} not found`);
    }
    return tx;
  }

  async findByHash(hash: string): Promise<Transaction> {
    const tx = await this.prisma.transaction.findUnique({
      where: { transactionHash: hash.toLowerCase() },
    });
    if (!tx) {
      throw new NotFoundException(`Transaction with hash ${hash} not found`);
    }
    return tx;
  }
}

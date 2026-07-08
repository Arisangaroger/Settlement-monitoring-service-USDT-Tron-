import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TransactionsService } from './modules/transactions/transactions.service';

@Injectable()
export class AppBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(AppBootstrapService.name);

  constructor(private readonly transactions: TransactionsService) {}

  async onModuleInit(): Promise<void> {
    const count = await this.transactions.countAll();
    this.logger.log(`Bootstrap OK — ${count} transaction(s) in database`);
  }
}

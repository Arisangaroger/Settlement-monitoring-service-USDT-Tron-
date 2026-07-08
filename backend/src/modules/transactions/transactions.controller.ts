import { Controller, Get, NotFoundException, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { paginatedResponse, successResponse } from '../../common/dto/api-envelope';
import { ListTransactionsQueryDto } from './dto/list-transactions.query.dto';
import { SearchTransactionQueryDto } from './dto/search-transaction.query.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { toTransactionResponseDto } from './transactions.mapper';
import { TransactionsService } from './transactions.service';
import { WalletsService } from '../wallets/wallets.service';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly wallets: WalletsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List transactions (paginated, filterable)' })
  @ApiOkResponse({ description: 'Paginated transaction list' })
  async list(@Query() query: ListTransactionsQueryDto) {
    const wallet = await this.wallets.getActiveWallet();
    const result = await this.transactionsService.findManyPaginated(
      query,
      wallet.id,
    );
    return paginatedResponse(
      result.items.map(toTransactionResponseDto),
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Search transaction by hash' })
  @ApiOkResponse({ type: TransactionResponseDto })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  async searchByHash(@Query() query: SearchTransactionQueryDto) {
    const wallet = await this.wallets.getActiveWallet();
    const tx = await this.transactionsService.findByHash(query.hash);
    if (tx.walletId !== wallet.id) {
      throw new NotFoundException(`Transaction with hash ${query.hash} not found`);
    }
    return successResponse(toTransactionResponseDto(tx));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by internal UUID' })
  @ApiOkResponse({ type: TransactionResponseDto })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    const wallet = await this.wallets.getActiveWallet();
    const tx = await this.transactionsService.findById(id);
    if (tx.walletId !== wallet.id) {
      throw new NotFoundException(`Transaction with id ${id} not found`);
    }
    return successResponse(toTransactionResponseDto(tx));
  }
}

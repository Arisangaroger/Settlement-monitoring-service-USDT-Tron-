import { Controller, Get, NotFoundException, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  PaginatedTransactionsResponseDto,
  TransactionSuccessResponseDto,
} from '../../common/dto/api-envelope.dto';
import {
  ApiResourceReadErrors,
  ApiWalletScopedReadErrors,
} from '../../common/swagger/api-responses';
import { paginatedResponse, successResponse } from '../../common/dto/api-envelope';
import { ListTransactionsQueryDto } from './dto/list-transactions.query.dto';
import { SearchTransactionQueryDto } from './dto/search-transaction.query.dto';
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
  @ApiOperation({
    summary: 'List transactions (paginated, filterable)',
    description:
      'Returns transactions for the active monitored wallet only. Use filters and sorting for dashboard views.',
  })
  @ApiOkResponse({ type: PaginatedTransactionsResponseDto })
  @ApiWalletScopedReadErrors()
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
  @ApiOperation({
    summary: 'Search transaction by hash',
    description:
      'Looks up a transaction by on-chain hash within the active monitored wallet.',
  })
  @ApiOkResponse({ type: TransactionSuccessResponseDto })
  @ApiResourceReadErrors()
  async searchByHash(@Query() query: SearchTransactionQueryDto) {
    const wallet = await this.wallets.getActiveWallet();
    const tx = await this.transactionsService.findByHash(query.hash);
    if (tx.walletId !== wallet.id) {
      throw new NotFoundException(`Transaction with hash ${query.hash} not found`);
    }
    return successResponse(toTransactionResponseDto(tx));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get transaction by internal UUID',
    description:
      'Returns a single transaction by database id for the active monitored wallet.',
  })
  @ApiOkResponse({ type: TransactionSuccessResponseDto })
  @ApiResourceReadErrors()
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    const wallet = await this.wallets.getActiveWallet();
    const tx = await this.transactionsService.findById(id);
    if (tx.walletId !== wallet.id) {
      throw new NotFoundException(`Transaction with id ${id} not found`);
    }
    return successResponse(toTransactionResponseDto(tx));
  }
}

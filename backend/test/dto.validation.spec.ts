import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ListTransactionsQueryDto } from '../src/modules/transactions/dto/list-transactions.query.dto';
import { SearchTransactionQueryDto } from '../src/modules/transactions/dto/search-transaction.query.dto';

describe('API DTO validation', () => {
  it('rejects invalid confirmationStatus', async () => {
    const dto = plainToInstance(ListTransactionsQueryDto, {
      confirmationStatus: 'banana',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts valid list query defaults', async () => {
    const dto = plainToInstance(ListTransactionsQueryDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
  });

  it('rejects malformed transaction hash', async () => {
    const dto = plainToInstance(SearchTransactionQueryDto, { hash: 'abc' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts valid 64-char hash', async () => {
    const dto = plainToInstance(SearchTransactionQueryDto, {
      hash: 'f096b4ca3f10109130ee5f5ad1f45b315f97f41c4a3a7ad5e9d02989111894e1',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

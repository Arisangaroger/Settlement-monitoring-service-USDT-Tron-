import {
  computeConfirmations,
  deriveConfirmationStatus,
  humanAmountToRaw,
  isValidTxHash,
  rawAmountToDecimal,
} from '../src/modules/blockchain/blockchain.utils';

describe('blockchain.utils', () => {
  it('converts raw USDT amount with 6 decimals', () => {
    expect(rawAmountToDecimal('1000000', 6)).toBe('1');
    expect(rawAmountToDecimal('30691274', 6)).toBe('30.691274');
  });

  it('converts human USDT amount to raw integer string', () => {
    expect(humanAmountToRaw('1', 6)).toBe('1000000');
    expect(humanAmountToRaw('1.5', 6)).toBe('1500000');
  });

  it('computes confirmations inclusively', () => {
    expect(computeConfirmations(100, 100)).toBe(1);
    expect(computeConfirmations(119, 100)).toBe(20);
  });

  it('derives confirmation status from threshold', () => {
    expect(deriveConfirmationStatus(18, 19)).toBe('pending');
    expect(deriveConfirmationStatus(19, 19)).toBe('confirmed');
  });

  it('validates tx hash length', () => {
    expect(isValidTxHash('f096b4ca3f10109130ee5f5ad1f45b315f97f41c4a3a7ad5e9d02989111894e1')).toBe(true);
    expect(isValidTxHash('abc')).toBe(false);
  });
});

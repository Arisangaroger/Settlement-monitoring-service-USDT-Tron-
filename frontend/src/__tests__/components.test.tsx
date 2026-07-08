import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatsGrid } from '@/components/stats/StatsGrid';
import { FilterTabs } from '@/components/transactions/FilterTabs';
import { formatUsdtAmount, isValidTxHash, truncateHash } from '@/lib/utils/format';

describe('format utils', () => {
  it('formats USDT with separators', () => {
    expect(formatUsdtAmount('1234.5')).toBe('1,234.50');
  });

  it('validates tx hash', () => {
    expect(isValidTxHash('f'.repeat(64))).toBe(true);
    expect(isValidTxHash('abc')).toBe(false);
  });

  it('truncates long hashes', () => {
    const hash = 'a'.repeat(64);
    expect(truncateHash(hash)).toBe(`${'a'.repeat(8)}…${'a'.repeat(6)}`);
  });
});

describe('StatsGrid', () => {
  it('renders four stat cards', () => {
    render(
      <StatsGrid
        totalTransactions={10}
        totalUsdtReceived="15.500000"
        confirmedCount={8}
        pendingCount={2}
      />,
    );

    expect(screen.getByText('Total Transactions')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText(/15\.50 USDT/)).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});

describe('FilterTabs', () => {
  it('calls onChange when tab clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<FilterTabs value="all" onChange={onChange} />);

    await user.click(screen.getByRole('tab', { name: 'Pending' }));
    expect(onChange).toHaveBeenCalledWith('pending');
  });
});

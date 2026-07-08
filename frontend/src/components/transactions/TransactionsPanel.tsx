import type { PaginationMeta, StatusFilter, Transaction } from '@/lib/api/types';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { FilterTabs } from '@/components/transactions/FilterTabs';
import { HashSearchInput } from '@/components/transactions/HashSearchInput';
import { Pagination } from '@/components/transactions/Pagination';
import { TransactionCardRow, TransactionRow } from '@/components/transactions/TransactionRow';

interface TransactionsPanelProps {
  transactions: Transaction[];
  loading?: boolean;
  filter: StatusFilter;
  onFilterChange: (value: StatusFilter) => void;
  onSelect?: (transaction: Transaction) => void;
  pagination?: PaginationMeta | null;
  onPageChange?: (page: number) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function TransactionsPanelSkeleton() {
  return (
    <Card className="overflow-hidden p-4">
      <Skeleton className="h-8 w-full max-w-md" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </Card>
  );
}

export function TransactionsPanel({
  transactions,
  loading = false,
  filter,
  onFilterChange,
  onSelect,
  pagination = null,
  onPageChange,
  emptyTitle = 'No transactions yet',
  emptyDescription = 'Incoming USDT transfers to the monitored wallet will appear here.',
}: TransactionsPanelProps) {
  if (loading) {
    return <TransactionsPanelSkeleton />;
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <FilterTabs value={filter} onChange={onFilterChange} />
        <HashSearchInput />
      </div>

      {transactions.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-base font-medium text-gray-700">{emptyTitle}</p>
          <p className="mt-1 text-sm text-gray-500">{emptyDescription}</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto sm:block">
            <table className="min-w-full text-left">
              <thead className="border-b border-gray-100 bg-white text-[11px] font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Hash</th>
                  <th className="px-4 py-2.5 font-medium">From</th>
                  <th className="px-4 py-2.5 font-medium">Amount</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <TransactionRow key={tx.id} transaction={tx} onSelect={onSelect} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="sm:hidden">
            {transactions.map((tx) => (
              <TransactionCardRow key={tx.id} transaction={tx} onSelect={onSelect} />
            ))}
          </div>
        </>
      )}

      {pagination && onPageChange && transactions.length > 0 ? (
        <Pagination
          page={pagination.page}
          limit={pagination.limit}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
        />
      ) : null}
    </Card>
  );
}

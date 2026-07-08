'use client';

import type { StatusFilter } from '@/lib/api/types';
import { Card } from '@/components/ui/Card';
import { InboxEmptyIcon } from '@/components/icons/Icons';
import { FilterTabs } from '@/components/transactions/FilterTabs';
import { HashSearchInput } from '@/components/transactions/HashSearchInput';

interface DisconnectedTransactionsPanelProps {
  filter: StatusFilter;
  onFilterChange: (value: StatusFilter) => void;
}

const TABLE_HEADERS = [
  'Tx Hash',
  'From',
  'To',
  'USDT Amount',
  'Status',
  'Block',
  'Time',
] as const;

export function DisconnectedTransactionsPanel({
  filter,
  onFilterChange,
}: DisconnectedTransactionsPanelProps) {
  return (
    <Card className="overflow-hidden rounded-xl border-gray-200/80 shadow-none">
      <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-gray-900">Transactions</h2>
        <HashSearchInput />
      </div>

      <div className="border-b border-gray-100 px-5 py-3">
        <FilterTabs value={filter} onChange={onFilterChange} variant="pill" basic />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
              {TABLE_HEADERS.map((header) => (
                <th key={header} className="px-5 py-3 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <InboxEmptyIcon size="h-6 w-6" />
        </div>
        <p className="mt-4 text-base font-semibold text-gray-900">No transactions found</p>
        <p className="mt-1 max-w-md text-sm text-gray-500">
          No transactions to display. Once transactions are detected, they will appear here.
        </p>
      </div>
    </Card>
  );
}

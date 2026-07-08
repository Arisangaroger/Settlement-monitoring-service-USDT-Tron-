import type { Transaction } from '@/lib/api/types';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { TransactionRow } from '@/components/transactions/TransactionRow';

interface TransactionsTableProps {
  transactions: Transaction[];
  loading?: boolean;
  onSelect?: (transaction: Transaction) => void;
}

export function TransactionsTableSkeleton() {
  return (
    <Card className="overflow-hidden p-4">
      <Skeleton className="h-6 w-40" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </Card>
  );
}

export function TransactionsTable({
  transactions,
  loading = false,
  onSelect,
}: TransactionsTableProps) {
  if (loading) {
    return <TransactionsTableSkeleton />;
  }

  if (transactions.length === 0) {
    return (
      <Card className="px-6 py-16 text-center">
        <p className="font-display text-lg font-medium text-stone-700">
          No transactions yet
        </p>
        <p className="mt-2 text-sm text-stone-500">
          Incoming USDT transfers to the monitored wallet will appear here.
        </p>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <Card className="hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Hash</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Block</th>
                <th className="px-4 py-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} onSelect={onSelect} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {transactions.map((tx) => (
          <Card key={tx.id} className="overflow-hidden">
            <TransactionRow transaction={tx} variant="card" onSelect={onSelect} />
            <div className="border-t border-stone-100 px-4 py-2 text-xs text-stone-500">
              {new Date(tx.blockTimestamp).toLocaleString()}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

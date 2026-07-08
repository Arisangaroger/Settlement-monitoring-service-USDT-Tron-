import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatUsdtAmount } from '@/lib/utils/format';

interface StatsCardProps {
  label: string;
  value: string;
  hint?: string;
  accent?: 'default' | 'success' | 'warning';
}

const accentBar = {
  default: 'bg-accent',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
};

export function StatsCard({ label, value, hint, accent = 'default' }: StatsCardProps) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div
        className={`absolute inset-x-0 top-0 h-0.5 ${accentBar[accent]}`}
        aria-hidden="true"
      />
      <p className="text-sm font-medium text-stone-500">{label}</p>
      <p className="font-display mt-2 text-3xl font-semibold tracking-tight text-stone-900">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-stone-400">{hint}</p> : null}
    </Card>
  );
}

export function StatsGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-9 w-20" />
        </Card>
      ))}
    </div>
  );
}

interface StatsGridProps {
  totalTransactions: number;
  totalUsdtReceived: string;
  confirmedCount: number;
  pendingCount: number;
}

export function StatsGrid({
  totalTransactions,
  totalUsdtReceived,
  confirmedCount,
  pendingCount,
}: StatsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard label="Total Transactions" value={String(totalTransactions)} />
      <StatsCard
        label="Total USDT Received"
        value={`${formatUsdtAmount(totalUsdtReceived)} USDT`}
        hint="Confirmed settlements only"
        accent="success"
      />
      <StatsCard
        label="Confirmed"
        value={String(confirmedCount)}
        accent="success"
      />
      <StatsCard
        label="Pending"
        value={String(pendingCount)}
        accent="warning"
      />
    </div>
  );
}

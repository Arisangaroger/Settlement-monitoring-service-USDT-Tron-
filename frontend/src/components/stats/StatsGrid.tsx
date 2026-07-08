import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  CheckStatIcon,
  HourglassStatIcon,
  SwapStatIcon,
  UsdtStatIcon,
} from '@/components/icons/Icons';
import { cn } from '@/lib/utils/cn';
import { formatUsdtAmount } from '@/lib/utils/format';

interface StatsCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  iconWrapClass?: string;
  cardClass?: string;
}

function StatsCard({
  label,
  value,
  icon,
  iconWrapClass = 'bg-gray-100 text-gray-500',
  cardClass = 'bg-white',
}: StatsCardProps) {
  return (
    <Card className={cn('flex items-center gap-3 p-4', cardClass)}>
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          iconWrapClass,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="mt-0.5 truncate text-xl font-semibold tracking-tight text-gray-900">
          {value}
        </p>
      </div>
    </Card>
  );
}

export function StatsGridSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="flex items-center gap-3 p-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-6 w-16" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function StatsGridEmpty() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard label="Total Transactions" value="—" icon={<SwapStatIcon />} />
      <StatsCard
        label="Total USDT Received"
        value="—"
        icon={<UsdtStatIcon />}
        iconWrapClass="bg-emerald-50"
      />
      <StatsCard
        label="Confirmed"
        value="—"
        icon={<CheckStatIcon className="text-emerald-600" />}
        iconWrapClass="bg-emerald-100 text-emerald-600"
        cardClass="border-emerald-100 bg-emerald-50/60"
      />
      <StatsCard
        label="Pending"
        value="—"
        icon={<HourglassStatIcon className="text-orange-600" />}
        iconWrapClass="bg-orange-100 text-orange-600"
        cardClass="border-orange-100 bg-orange-50/60"
      />
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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard
        label="Total Transactions"
        value={String(totalTransactions)}
        icon={<SwapStatIcon />}
      />
      <StatsCard
        label="Total USDT Received"
        value={`${formatUsdtAmount(totalUsdtReceived)} USDT`}
        icon={<UsdtStatIcon />}
        iconWrapClass="bg-emerald-50"
      />
      <StatsCard
        label="Confirmed"
        value={String(confirmedCount)}
        icon={<CheckStatIcon className="text-emerald-600" />}
        iconWrapClass="bg-emerald-100 text-emerald-600"
        cardClass="border-emerald-100 bg-emerald-50/60"
      />
      <StatsCard
        label="Pending"
        value={String(pendingCount)}
        icon={<HourglassStatIcon className="text-orange-600" />}
        iconWrapClass="bg-orange-100 text-orange-600"
        cardClass="border-orange-100 bg-orange-50/60"
      />
    </div>
  );
}

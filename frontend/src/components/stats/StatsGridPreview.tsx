import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import {
  CheckCircleStatIcon,
  ClockStatIcon,
  SwapStatIcon,
  UsdtStatIcon,
} from '@/components/icons/Icons';

interface PreviewStatsCardProps {
  label: string;
  icon: ReactNode;
}

function PreviewStatsCard({ label, icon }: PreviewStatsCardProps) {
  return (
    <Card className="flex items-center gap-3 rounded-xl border-gray-200/80 p-4 shadow-none">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-0.5 text-2xl font-semibold text-gray-900">—</p>
      </div>
    </Card>
  );
}

export function StatsGridPreview() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <PreviewStatsCard label="Total Transactions" icon={<SwapStatIcon size="h-5 w-5" />} />
      <PreviewStatsCard label="Total USDT Received" icon={<UsdtStatIcon size="h-5 w-5" />} />
      <PreviewStatsCard label="Confirmed" icon={<CheckCircleStatIcon size="h-5 w-5" />} />
      <PreviewStatsCard label="Pending" icon={<ClockStatIcon size="h-5 w-5" />} />
    </div>
  );
}

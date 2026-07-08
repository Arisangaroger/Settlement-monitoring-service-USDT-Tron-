'use client';

import type { MonitoredWallet, StatusFilter } from '@/lib/api/types';
import { DisconnectedHeader } from '@/components/layout/DisconnectedHeader';
import { StatsGridPreview } from '@/components/stats/StatsGridPreview';
import { DisconnectedTransactionsPanel } from '@/components/transactions/DisconnectedTransactionsPanel';
import { NoWalletBanner } from '@/components/wallet/NoWalletBanner';

interface DisconnectedDashboardProps {
  monitored: MonitoredWallet | null;
  walletError?: string | null;
  filter: StatusFilter;
  onFilterChange: (value: StatusFilter) => void;
  onWalletChanged: (wallet: MonitoredWallet) => void;
  onDisconnect: () => void;
}

export function DisconnectedDashboard({
  monitored,
  walletError,
  filter,
  onFilterChange,
  onWalletChanged,
  onDisconnect,
}: DisconnectedDashboardProps) {
  return (
    <div className="min-h-screen bg-[#f3f5f4]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <DisconnectedHeader
          monitored={monitored}
          walletError={walletError}
          onWalletChanged={onWalletChanged}
          onDisconnect={onDisconnect}
        />

        <div className="mt-8 space-y-6">
          <NoWalletBanner />
          <StatsGridPreview />
          <DisconnectedTransactionsPanel filter={filter} onFilterChange={onFilterChange} />
        </div>
      </div>
    </div>
  );
}

'use client';

import { UsdtLogo } from '@/components/brand/UsdtLogo';
import { WalletBar } from '@/components/wallet/WalletBar';
import type { MonitoredWallet } from '@/lib/api/types';

interface DashboardHeaderProps {
  monitored: MonitoredWallet | null;
  walletError?: string | null;
  onWalletChanged?: (wallet: MonitoredWallet) => void;
  onDisconnect?: () => void;
}

export function DashboardHeader({
  monitored,
  walletError,
  onWalletChanged,
  onDisconnect,
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white px-4 py-3 sm:px-5 md:px-6">
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex items-center gap-2.5">
          <UsdtLogo size={28} />
          <h1 className="text-base font-semibold text-gray-900">
            Settlement Monitor - USDT Dashboard
          </h1>
        </div>
        <WalletBar
          monitored={monitored}
          walletError={walletError}
          onWalletChanged={onWalletChanged}
          onDisconnect={onDisconnect}
        />
      </div>

      <div className="hidden items-center justify-between gap-4 md:flex">
        <h1 className="text-lg font-semibold text-gray-900">
          Settlement Monitor - USDT Dashboard
        </h1>
        <WalletBar
          monitored={monitored}
          walletError={walletError}
          onWalletChanged={onWalletChanged}
          onDisconnect={onDisconnect}
        />
      </div>
    </header>
  );
}

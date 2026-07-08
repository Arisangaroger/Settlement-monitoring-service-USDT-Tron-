'use client';

import { TronLinkConnect } from '@/components/wallet/TronLinkConnect';
import type { MonitoredWallet } from '@/lib/api/types';

interface HeaderProps {
  monitored: MonitoredWallet | null;
  walletError?: string | null;
  onWalletChanged?: (wallet: MonitoredWallet) => void;
  onDisconnect?: () => void;
}

export function Header({
  monitored,
  walletError,
  onWalletChanged,
  onDisconnect,
}: HeaderProps) {
  return (
    <header className="border-b border-stone-200/70 bg-white/60 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-accent">
            Settlement Monitor
          </p>
          <h1 className="font-display mt-1 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
            USDT Dashboard
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            TRON Shasta · connect your TronLink wallet to monitor incoming USDT
          </p>
        </div>
        <TronLinkConnect
          monitored={monitored}
          walletError={walletError}
          onWalletChanged={onWalletChanged}
          onDisconnect={onDisconnect}
        />
      </div>
    </header>
  );
}

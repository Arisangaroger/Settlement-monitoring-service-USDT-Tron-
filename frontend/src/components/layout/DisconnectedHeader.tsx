'use client';

import type { MonitoredWallet } from '@/lib/api/types';
import { WalletBar } from '@/components/wallet/WalletBar';

const NETWORK_LABEL =
  process.env.NEXT_PUBLIC_TRON_NETWORK_LABEL ?? 'TRON Shasta';

interface DisconnectedHeaderProps {
  monitored: MonitoredWallet | null;
  walletError?: string | null;
  onWalletChanged?: (wallet: MonitoredWallet) => void;
  onDisconnect?: () => void;
}

export function DisconnectedHeader({
  monitored,
  walletError,
  onWalletChanged,
  onDisconnect,
}: DisconnectedHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
          Settlement Monitor
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          USDT Dashboard
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {NETWORK_LABEL} · connect your TronLink wallet
        </p>
      </div>
      <WalletBar
        monitored={monitored}
        walletError={walletError}
        onWalletChanged={onWalletChanged}
        onDisconnect={onDisconnect}
        connectVariant="prominent"
      />
    </header>
  );
}

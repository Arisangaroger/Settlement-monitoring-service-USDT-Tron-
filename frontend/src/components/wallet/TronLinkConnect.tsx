'use client';

import { useEffect, useState } from 'react';
import { ApiClientError, setMonitoredWallet } from '@/lib/api/client';
import type { MonitoredWallet } from '@/lib/api/types';
import {
  connectTronLink,
  disconnectTronLink,
  getStoredTronLinkAddress,
  hasTronLinkSession,
  isTronLinkInstalled,
  TronLinkError,
} from '@/lib/tron/tronlink';
import { truncateHash } from '@/lib/utils/format';
import { Button } from '@/components/ui/Button';

interface TronLinkConnectProps {
  monitored: MonitoredWallet | null;
  walletError?: string | null;
  onWalletChanged?: (wallet: MonitoredWallet) => void;
  onDisconnect?: () => void;
}

export function TronLinkConnect({
  monitored,
  walletError = null,
  onWalletChanged,
  onDisconnect,
}: TronLinkConnectProps) {
  const [connected, setConnected] = useState(false);
  const [tronAddress, setTronAddress] = useState<string | null>(null);
  const [clientReady, setClientReady] = useState(false);
  const [tronLinkInstalled, setTronLinkInstalled] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setClientReady(true);
    setTronLinkInstalled(isTronLinkInstalled());

    if (!hasTronLinkSession()) return;

    const storedAddress = getStoredTronLinkAddress();
    if (storedAddress) {
      setConnected(true);
      setTronAddress(storedAddress);
    }
  }, []);

  async function handleConnect() {
    setConnecting(true);
    setError(null);

    try {
      const address = await connectTronLink();
      setConnected(true);
      setTronAddress(address);

      const wallet = await setMonitoredWallet(address);
      onWalletChanged?.(wallet);
    } catch (err) {
      disconnectTronLink();
      setConnected(false);
      setTronAddress(null);
      setError(
        err instanceof TronLinkError || err instanceof ApiClientError
          ? err.message
          : 'Failed to connect TronLink',
      );
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    disconnectTronLink();
    setConnected(false);
    setTronAddress(null);
    setError(null);
    onDisconnect?.();
  }

  const tronLinkMissing = clientReady && !tronLinkInstalled;
  const displayError = error ?? walletError;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {connected && tronAddress ? (
          <>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800 ring-1 ring-inset ring-emerald-200/80">
              Connected {truncateHash(tronAddress, 6, 4)}
            </span>
            <Button
              variant="secondary"
              className="!px-4 !py-2 text-sm"
              onClick={handleDisconnect}
              disabled={connecting}
              aria-label="Disconnect TronLink wallet"
            >
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            className="!px-4 !py-2 text-sm"
            onClick={handleConnect}
            disabled={connecting || tronLinkMissing}
            aria-label="Connect TronLink wallet"
          >
            {connecting ? 'Connecting…' : 'Connect wallet'}
          </Button>
        )}
      </div>

      {!connected ? (
        <p className="max-w-xs text-right text-xs text-stone-500">
          Connects to the account currently selected in TronLink.
        </p>
      ) : monitored && tronAddress === monitored.address ? (
        <p className="max-w-xs text-right text-xs text-stone-500">
          Dashboard is monitoring this wallet.
        </p>
      ) : null}

      {tronLinkMissing ? (
        <p className="max-w-xs text-right text-xs text-amber-700">
          Install the TronLink browser extension, then refresh this page.
        </p>
      ) : null}

      {displayError ? (
        <p className="max-w-xs text-right text-xs text-rose-600" role="alert">
          {displayError}
        </p>
      ) : null}
    </div>
  );
}

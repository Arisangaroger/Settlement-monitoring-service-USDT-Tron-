'use client';

import { useEffect, useState } from 'react';
import { ApiClientError, setMonitoredWallet } from '@/lib/api/client';
import type { MonitoredWallet } from '@/lib/api/types';
import {
  connectTronLink,
  disconnectTronLink,
  getStoredTronLinkAddress,
  hasTronLinkSession,
  TronLinkError,
} from '@/lib/tron/tronlink';
import { copyToClipboard, truncateHash } from '@/lib/utils/format';
import { CopyIcon, WalletIcon, WalletOutlineIcon } from '@/components/icons/Icons';

interface WalletBarProps {
  monitored: MonitoredWallet | null;
  walletError?: string | null;
  onWalletChanged?: (wallet: MonitoredWallet) => void;
  onDisconnect?: () => void;
  connectVariant?: 'default' | 'prominent';
}

export function WalletBar({
  monitored,
  walletError = null,
  onWalletChanged,
  onDisconnect,
  connectVariant = 'default',
}: WalletBarProps) {
  const [connected, setConnected] = useState(false);
  const [tronAddress, setTronAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
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

  async function handleCopy() {
    if (!tronAddress) return;
    const ok = await copyToClipboard(tronAddress);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const displayError = error ?? walletError;

  if (!connected || !tronAddress) {
    const prominent = connectVariant === 'prominent';
    return (
      <div className="flex flex-col items-end gap-1.5 sm:shrink-0">
        <button
          type="button"
          onClick={handleConnect}
          disabled={connecting}
          className={
            prominent
              ? 'inline-flex h-11 items-center gap-2 rounded-lg bg-[#4d6b5c] px-5 text-sm font-medium text-white transition-colors hover:bg-[#435d50] disabled:opacity-50'
              : 'h-9 rounded-md border border-emerald-600 bg-emerald-600 px-3.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50'
          }
        >
          {prominent ? <WalletOutlineIcon size="h-4 w-4" className="text-white" /> : null}
          {connecting ? 'Connecting…' : 'Connect wallet'}
        </button>
        {displayError ? (
          <p className="max-w-xs text-right text-xs text-rose-600" role="alert">
            {displayError}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5">
          <WalletIcon size="h-4 w-4" className="text-gray-500" />
          <span className="font-mono text-xs text-gray-800 sm:text-sm">
            {truncateHash(tronAddress, 8, 4)}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
            aria-label="Copy wallet address"
          >
            <CopyIcon size="h-3.5 w-3.5" />
          </button>
          {copied ? <span className="text-[11px] text-emerald-600">Copied</span> : null}
        </div>
        <button
          type="button"
          onClick={handleDisconnect}
          disabled={connecting}
          className="h-9 rounded-md border border-emerald-600 bg-white px-3.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50"
        >
          Disconnect
        </button>
      </div>
      {monitored && tronAddress === monitored.address ? (
        <p className="text-[11px] text-gray-500">Monitoring this wallet</p>
      ) : null}
      {displayError ? (
        <p className="max-w-xs text-right text-xs text-rose-600" role="alert">
          {displayError}
        </p>
      ) : null}
    </div>
  );
}

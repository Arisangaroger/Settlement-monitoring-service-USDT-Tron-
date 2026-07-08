'use client';

import { useEffect, useState } from 'react';
import type { MonitoredWallet, StatusFilter, Transaction } from '@/lib/api/types';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { useMonitoredWallet } from '@/lib/hooks/useMonitoredWallet';
import { getStoredTronLinkAddress, hasTronLinkSession } from '@/lib/tron/tronlink';
import { DisconnectedDashboard } from '@/components/dashboard/DisconnectedDashboard';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatsGrid, StatsGridSkeleton } from '@/components/stats/StatsGrid';
import { TransactionDetailModal } from '@/components/transactions/TransactionDetailModal';
import { TransactionsPanel } from '@/components/transactions/TransactionsPanel';

export function Dashboard() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const limit = 10;

  useEffect(() => {
    if (hasTronLinkSession() && getStoredTronLinkAddress()) {
      setWalletConnected(true);
    }
  }, []);

  const {
    wallet: monitoredWallet,
    loading: walletLoading,
    error: walletError,
    setWallet,
  } = useMonitoredWallet();

  const dashboardEnabled = walletConnected;

  const { stats, transactions, loading, refreshing, error, lastUpdated, refresh } =
    useDashboardData(page, filter, limit, dashboardEnabled);

  function handleFilterChange(next: StatusFilter) {
    setFilter(next);
    setPage(1);
  }

  function handleWalletChanged(wallet: MonitoredWallet) {
    setWalletConnected(true);
    setWallet(wallet);
    setPage(1);
    setFilter('all');
    refresh();
  }

  function handleDisconnect() {
    setWalletConnected(false);
    setPage(1);
    setFilter('all');
    setSelectedTx(null);
  }

  if (!walletConnected) {
    return (
      <>
        <DisconnectedDashboard
          monitored={monitoredWallet}
          walletError={walletError}
          filter={filter}
          onFilterChange={handleFilterChange}
          onWalletChanged={handleWalletChanged}
          onDisconnect={handleDisconnect}
        />
        <TransactionDetailModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          monitored={monitoredWallet}
          walletError={walletError}
          onWalletChanged={handleWalletChanged}
          onDisconnect={handleDisconnect}
        />

        <main className="flex-1 overflow-x-hidden px-4 py-4 sm:px-5 md:px-6">
          {lastUpdated ? (
            <p className="mb-4 text-sm text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
              {refreshing ? ' · refreshing…' : ''}
            </p>
          ) : null}

          {error && !stats ? (
            <div
              className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              role="alert"
            >
              {error} — is the backend running on port 3000?
            </div>
          ) : null}

          <section aria-label="Summary statistics" className="mb-6">
            {stats ? (
              <StatsGrid
                totalTransactions={stats.totalTransactions}
                totalUsdtReceived={stats.totalUsdtReceived}
                confirmedCount={stats.confirmedCount}
                pendingCount={stats.pendingCount}
              />
            ) : (
              <StatsGridSkeleton />
            )}
          </section>

          {error && stats ? (
            <p className="mb-4 text-sm text-amber-700" role="status">
              Could not refresh latest data. Showing last successful load.
            </p>
          ) : null}

          <section aria-label="Transactions">
            <TransactionsPanel
              transactions={transactions?.data ?? []}
              loading={(loading || walletLoading) && !transactions}
              filter={filter}
              onFilterChange={handleFilterChange}
              onSelect={setSelectedTx}
              pagination={transactions?.meta ?? null}
              onPageChange={setPage}
            />
          </section>
        </main>
      </div>

      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
}

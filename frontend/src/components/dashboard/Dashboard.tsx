'use client';

import { useEffect, useState } from 'react';
import type { MonitoredWallet, StatusFilter, Transaction } from '@/lib/api/types';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { useMonitoredWallet } from '@/lib/hooks/useMonitoredWallet';
import { getStoredTronLinkAddress, hasTronLinkSession } from '@/lib/tron/tronlink';
import { Header } from '@/components/layout/Header';
import { StatsGrid, StatsGridSkeleton } from '@/components/stats/StatsGrid';
import { FilterTabs } from '@/components/transactions/FilterTabs';
import { HashSearch } from '@/components/transactions/HashSearch';
import { Pagination } from '@/components/transactions/Pagination';
import { TransactionDetailModal } from '@/components/transactions/TransactionDetailModal';
import { TransactionsTable } from '@/components/transactions/TransactionsTable';
import { Button } from '@/components/ui/Button';

export function Dashboard() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [tronLinkConnected, setTronLinkConnected] = useState(false);

  useEffect(() => {
    if (hasTronLinkSession() && getStoredTronLinkAddress()) {
      setTronLinkConnected(true);
    }
  }, []);

  const {
    wallet: monitoredWallet,
    loading: walletLoading,
    error: walletError,
    setWallet,
  } = useMonitoredWallet();

  const dashboardEnabled = tronLinkConnected && Boolean(monitoredWallet);

  const { stats, transactions, loading, refreshing, error, lastUpdated, refresh } =
    useDashboardData(page, filter, 10, dashboardEnabled);

  function handleFilterChange(next: StatusFilter) {
    setFilter(next);
    setPage(1);
  }

  function handleWalletChanged(wallet: MonitoredWallet) {
    setTronLinkConnected(true);
    setWallet(wallet);
    setPage(1);
    setFilter('all');
    refresh();
  }

  function handleDisconnect() {
    setTronLinkConnected(false);
  }

  return (
    <div className="min-h-screen">
      <Header
        monitored={monitoredWallet}
        walletError={walletError}
        onWalletChanged={handleWalletChanged}
        onDisconnect={handleDisconnect}
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {!tronLinkConnected ? (
          <section
            className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 px-6 py-16 text-center"
            aria-label="Connect wallet"
          >
            <h2 className="font-display text-xl font-semibold text-stone-900">
              Connect your wallet to get started
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-stone-600">
              Click <strong>Connect wallet</strong> in the header. TronLink will
              open so you can choose an account and approve this site. Stats and
              transactions appear after you connect.
            </p>
          </section>
        ) : !walletLoading && !monitoredWallet ? (
          <section
            className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 px-6 py-16 text-center"
            aria-label="No wallet configured"
          >
            <h2 className="font-display text-xl font-semibold text-stone-900">
              No wallet selected yet
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-stone-600">
              Connect TronLink in the header to choose which TRON address this
              dashboard should monitor. Stats and transactions appear after a
              wallet is set.
            </p>
          </section>
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {lastUpdated ? (
                  <p className="text-sm text-stone-500">
                    Updated {lastUpdated.toLocaleTimeString()}
                    {refreshing ? ' · refreshing…' : ''}
                  </p>
                ) : null}
              </div>
              <Button
                variant="secondary"
                onClick={refresh}
                disabled={refreshing || walletLoading}
                aria-label="Refresh dashboard data"
              >
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </Button>
            </div>

            {error && !stats ? (
              <div
                className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                role="alert"
              >
                {error} — is the backend running on port 3000?
              </div>
            ) : null}

            <section aria-label="Summary statistics">
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

            <section className="mt-8" aria-label="Transaction search">
              <HashSearch />
            </section>

            <section className="mt-8 space-y-4" aria-label="Transactions">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-display text-xl font-semibold text-stone-900">
                  Transactions
                </h2>
                <FilterTabs value={filter} onChange={handleFilterChange} />
              </div>

              {error && stats ? (
                <p className="text-sm text-amber-700" role="status">
                  Could not refresh latest data. Showing last successful load.
                </p>
              ) : null}

              <TransactionsTable
                transactions={transactions?.data ?? []}
                loading={(loading || walletLoading) && !transactions}
                onSelect={setSelectedTx}
              />

              {transactions ? (
                <Pagination
                  page={transactions.meta.page}
                  totalPages={transactions.meta.totalPages}
                  onPageChange={setPage}
                />
              ) : null}
            </section>
          </>
        )}
      </main>

      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
}

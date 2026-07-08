'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiClientError, getStats, getTransactions } from '@/lib/api/client';
import type { PaginatedTransactions, Stats, StatusFilter } from '@/lib/api/types';

const REFRESH_MS = 20_000;

interface DashboardState {
  stats: Stats | null;
  transactions: PaginatedTransactions | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const initialState: DashboardState = {
  stats: null,
  transactions: null,
  loading: true,
  refreshing: false,
  error: null,
  lastUpdated: null,
};

export function useDashboardData(
  page: number,
  filter: StatusFilter,
  limit = 10,
  enabled = true,
) {
  const [state, setState] = useState<DashboardState>(initialState);
  const mounted = useRef(true);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!enabled) {
        setState(initialState);
        return;
      }

      const silent = opts?.silent ?? false;

      setState((prev) => ({
        ...prev,
        loading: !silent && prev.stats === null,
        refreshing: silent,
        error: null,
      }));

      try {
        const confirmationStatus =
          filter === 'all' ? undefined : filter;

        const [stats, transactions] = await Promise.all([
          getStats(),
          getTransactions({ page, limit, confirmationStatus }),
        ]);

        if (!mounted.current) return;

        setState({
          stats,
          transactions,
          loading: false,
          refreshing: false,
          error: null,
          lastUpdated: new Date(),
        });
      } catch (err) {
        if (!mounted.current) return;

        const message =
          err instanceof ApiClientError
            ? err.message
            : 'Unable to load dashboard data';

        setState((prev) => ({
          ...prev,
          loading: false,
          refreshing: false,
          error: message,
        }));
      }
    },
    [enabled, filter, limit, page],
  );

  useEffect(() => {
    if (!enabled) {
      setState(initialState);
      return;
    }

    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [enabled, load]);

  useEffect(() => {
    if (!enabled) return;

    const id = setInterval(() => void load({ silent: true }), REFRESH_MS);
    return () => clearInterval(id);
  }, [enabled, load]);

  const refresh = useCallback(() => load({ silent: true }), [load]);

  return { ...state, refresh };
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiClientError, getMonitoredWallet } from '@/lib/api/client';
import type { MonitoredWallet } from '@/lib/api/types';

export function useMonitoredWallet() {
  const [wallet, setWallet] = useState<MonitoredWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const next = await getMonitoredWallet();
      setWallet(next);
      setError(null);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 404) {
        setWallet(null);
        setError(null);
      } else {
        setError(
          err instanceof ApiClientError
            ? err.message
            : 'Could not load monitored wallet',
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { wallet, loading, error, reload, setWallet };
}

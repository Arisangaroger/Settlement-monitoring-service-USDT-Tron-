'use client';

import { FormEvent, useState } from 'react';
import { ApiClientError, searchByHash } from '@/lib/api/client';
import type { Transaction } from '@/lib/api/types';
import { isValidTxHash } from '@/lib/utils/format';
import { SearchIcon } from '@/components/icons/Icons';
import { TransactionDetails } from '@/components/transactions/TransactionDetails';

interface HashSearchInputProps {
  onResult?: (tx: Transaction | null) => void;
}

export function HashSearchInput({ onResult }: HashSearchInputProps) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Transaction | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const hash = query.trim();
    setError(null);
    setResult(null);

    if (!hash) {
      setError('Enter a transaction hash');
      return;
    }

    if (!isValidTxHash(hash)) {
      setError('Hash must be 64 hexadecimal characters');
      return;
    }

    setLoading(true);
    try {
      const tx = await searchByHash(hash);
      setResult(tx);
      onResult?.(tx);
    } catch (err) {
      onResult?.(null);
      if (err instanceof ApiClientError && err.status === 404) {
        setError('Transaction not found');
      } else {
        setError(
          err instanceof ApiClientError
            ? err.message
            : 'Search failed — please try again',
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full shrink-0 sm:w-[280px]">
      <form onSubmit={handleSubmit} className="relative">
        <label className="sr-only" htmlFor="hash-search">
          Search by transaction hash
        </label>
        <SearchIcon
          size="h-4 w-4"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          id="hash-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by transaction hash"
          spellCheck={false}
          className="h-9 w-full rounded-md border border-gray-200 bg-white py-0 pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </form>

      {(loading || error || result) && (
        <div className="mt-2 space-y-2">
          {loading ? <p className="text-xs text-gray-500">Searching…</p> : null}
          {error ? (
            <p className="text-xs text-rose-600" role="alert">
              {error}
            </p>
          ) : null}
          {result ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <TransactionDetails transaction={result} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

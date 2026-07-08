'use client';

import { FormEvent, useState } from 'react';
import { ApiClientError, searchByHash } from '@/lib/api/client';
import type { Transaction } from '@/lib/api/types';
import { isValidTxHash } from '@/lib/utils/format';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TransactionDetails } from '@/components/transactions/TransactionDetails';

interface HashSearchProps {
  onResult?: (tx: Transaction | null) => void;
}

export function HashSearch({ onResult }: HashSearchProps) {
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
      setError('Hash must be exactly 64 hexadecimal characters');
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
    <Card className="p-4 sm:p-5">
      <h2 className="font-display text-lg font-semibold text-stone-900">
        Search by hash
      </h2>
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="hash-search">
          Transaction hash
        </label>
        <input
          id="hash-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="64-character transaction hash"
          spellCheck={false}
          className="min-h-11 flex-1 rounded-xl border border-stone-200 bg-white px-4 py-2.5 font-mono text-sm text-stone-800 placeholder:text-stone-400 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <Button type="submit" variant="primary" disabled={loading} className="min-h-11">
          {loading ? 'Searching…' : 'Search'}
        </Button>
      </form>

      {error ? (
        <p className="mt-3 text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-4 rounded-xl bg-stone-50/60 p-4 ring-1 ring-stone-200/80">
          <TransactionDetails transaction={result} />
        </div>
      ) : null}
    </Card>
  );
}

'use client';

import { useState } from 'react';
import type { Transaction } from '@/lib/api/types';
import {
  copyToClipboard,
  formatAbsoluteTime,
  formatRelativeTime,
  formatUsdtAmount,
  truncateHash,
} from '@/lib/utils/format';
import { Badge, statusToBadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface TransactionRowProps {
  transaction: Transaction;
  variant?: 'table' | 'card';
  onSelect?: (transaction: Transaction) => void;
}

export function TransactionRow({
  transaction,
  variant = 'table',
  onSelect,
}: TransactionRowProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    const ok = await copyToClipboard(transaction.transactionHash);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const hashCell = (
    <div className="flex items-center gap-2">
      <code className="font-mono text-xs text-stone-700 sm:text-sm">
        {truncateHash(transaction.transactionHash)}
      </code>
      <Button
        variant="ghost"
        className="!px-2 !py-1 text-xs"
        onClick={handleCopy}
        aria-label={`Copy hash ${transaction.transactionHash}`}
      >
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );

  if (variant === 'card') {
    return (
      <div
        className={`grid gap-3 bg-stone-50/50 p-4 sm:grid-cols-2 ${
          onSelect ? 'cursor-pointer transition-colors hover:bg-stone-100/70' : ''
        }`}
        onClick={onSelect ? () => onSelect(transaction) : undefined}
        role={onSelect ? 'button' : undefined}
        tabIndex={onSelect ? 0 : undefined}
        onKeyDown={
          onSelect
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(transaction);
                }
              }
            : undefined
        }
      >
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-400">Hash</p>
          <div className="mt-1">{hashCell}</div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-400">Amount</p>
          <p className="mt-1 font-medium text-stone-900">
            {formatUsdtAmount(transaction.amount)} {transaction.tokenSymbol}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-400">Status</p>
          <div className="mt-1">
            <Badge variant={statusToBadgeVariant(transaction.confirmationStatus)}>
              {transaction.confirmationStatus}
            </Badge>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-400">Block</p>
          <p className="mt-1 text-sm text-stone-700">{transaction.blockNumber}</p>
        </div>
      </div>
    );
  }

  return (
    <tr
      className={`border-t border-stone-100 transition-colors hover:bg-stone-50/60 ${
        onSelect ? 'cursor-pointer' : ''
      }`}
      onClick={onSelect ? () => onSelect(transaction) : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={onSelect ? 'View transaction details' : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(transaction);
              }
            }
          : undefined
      }
    >
      <td className="px-4 py-3.5">{hashCell}</td>
      <td className="px-4 py-3.5 text-sm font-medium text-stone-900">
        {formatUsdtAmount(transaction.amount)}{' '}
        <span className="text-stone-400">{transaction.tokenSymbol}</span>
      </td>
      <td className="px-4 py-3.5">
        <Badge variant={statusToBadgeVariant(transaction.confirmationStatus)}>
          {transaction.confirmationStatus}
        </Badge>
      </td>
      <td className="hidden px-4 py-3.5 text-sm text-stone-600 md:table-cell">
        {transaction.blockNumber}
      </td>
      <td className="px-4 py-3.5 text-sm text-stone-600">
        <span title={formatAbsoluteTime(transaction.blockTimestamp)}>
          {formatRelativeTime(transaction.blockTimestamp)}
        </span>
      </td>
    </tr>
  );
}

'use client';

import { useState } from 'react';
import type { Transaction } from '@/lib/api/types';
import {
  copyToClipboard,
  formatDateTime,
  formatUsdtAmount,
  getTronScanTxUrl,
  truncateHash,
} from '@/lib/utils/format';
import {
  Badge,
  statusToBadgeVariant,
} from '@/components/ui/Badge';
import {
  CopyIcon,
  ExternalLinkIcon,
  StatusCheckIcon,
  StatusFailedIcon,
  StatusPendingIcon,
} from '@/components/icons/Icons';

interface TransactionRowProps {
  transaction: Transaction;
  onSelect?: (transaction: Transaction) => void;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
      aria-label={label}
      title={copied ? 'Copied' : 'Copy'}
    >
      <CopyIcon size="h-3.5 w-3.5" />
    </button>
  );
}

function StatusBadge({ transaction }: { transaction: Transaction }) {
  if (transaction.processingStatus === 'failed') {
    return (
      <Badge variant="failed" icon={<StatusFailedIcon />}>
        Failed
      </Badge>
    );
  }

  const variant = statusToBadgeVariant(transaction.confirmationStatus);
  const icon =
    variant === 'confirmed' ? (
      <StatusCheckIcon />
    ) : (
      <StatusPendingIcon />
    );

  return (
    <Badge variant={variant} icon={icon}>
      {transaction.confirmationStatus}
    </Badge>
  );
}

export function TransactionRow({ transaction, onSelect }: TransactionRowProps) {
  const explorerUrl = getTronScanTxUrl(transaction.transactionHash);

  return (
    <tr
      className={`border-t border-gray-100 transition-colors hover:bg-gray-50/80 ${
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
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex max-w-[220px] items-center gap-1 truncate font-mono text-xs text-emerald-600 hover:text-emerald-700 hover:underline sm:text-sm"
          >
            {truncateHash(transaction.transactionHash, 18, 0)}
            <ExternalLinkIcon size="h-3 w-3" />
          </a>
          <CopyButton
            value={transaction.transactionHash}
            label={`Copy hash ${transaction.transactionHash}`}
          />
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs text-gray-700 sm:text-sm">
            {truncateHash(transaction.senderAddress, 9, 9)}
          </span>
          <CopyButton
            value={transaction.senderAddress}
            label={`Copy sender ${transaction.senderAddress}`}
          />
        </div>
      </td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        {formatUsdtAmount(transaction.amount)} {transaction.tokenSymbol}
      </td>
      <td className="px-4 py-3">
        <StatusBadge transaction={transaction} />
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600 sm:text-sm">
        {formatDateTime(transaction.blockTimestamp)}
      </td>
    </tr>
  );
}

export function TransactionCardRow({
  transaction,
  onSelect,
}: TransactionRowProps) {
  return (
    <div
      className={`space-y-3 border-b border-gray-100 p-4 last:border-b-0 ${
        onSelect ? 'cursor-pointer hover:bg-gray-50' : ''
      }`}
      onClick={onSelect ? () => onSelect(transaction) : undefined}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Hash</p>
          <p className="mt-1 font-mono text-sm text-emerald-600">
            {truncateHash(transaction.transactionHash)}
          </p>
        </div>
        <StatusBadge transaction={transaction} />
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-400">From</p>
          <p className="mt-1 font-mono text-gray-700">
            {truncateHash(transaction.senderAddress, 6, 4)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Amount</p>
          <p className="mt-1 font-medium">
            {formatUsdtAmount(transaction.amount)} {transaction.tokenSymbol}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-gray-400">Time</p>
          <p className="mt-1 text-gray-600">{formatDateTime(transaction.blockTimestamp)}</p>
        </div>
      </div>
    </div>
  );
}

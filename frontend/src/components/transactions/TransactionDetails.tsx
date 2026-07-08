'use client';

import { useState } from 'react';
import type { Transaction } from '@/lib/api/types';
import {
  copyToClipboard,
  formatAbsoluteTime,
  formatRelativeTime,
  formatUsdtAmount,
} from '@/lib/utils/format';
import { Badge, statusToBadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface TransactionDetailsProps {
  transaction: Transaction;
}

function CopyableValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="mt-1 flex items-start gap-2">
      <code className="min-w-0 flex-1 break-all font-mono text-xs text-stone-700 sm:text-sm">
        {value}
      </code>
      <Button
        variant="ghost"
        className="!px-2 !py-1 text-xs"
        onClick={handleCopy}
        aria-label={`Copy ${label}`}
      >
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-stone-400">{label}</p>
      {children}
    </div>
  );
}

export function TransactionDetails({ transaction }: TransactionDetailsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label="Hash">
          <CopyableValue value={transaction.transactionHash} label="hash" />
        </Field>
      </div>

      <Field label="Status">
        <div className="mt-1">
          <Badge variant={statusToBadgeVariant(transaction.confirmationStatus)}>
            {transaction.confirmationStatus}
          </Badge>
        </div>
      </Field>

      <Field label="Amount">
        <p className="mt-1 font-medium text-stone-900">
          {formatUsdtAmount(transaction.amount)} {transaction.tokenSymbol}
        </p>
      </Field>

      <Field label="Block">
        <p className="mt-1 text-sm text-stone-700">{transaction.blockNumber}</p>
      </Field>

      <Field label="Time">
        <p
          className="mt-1 text-sm text-stone-700"
          title={formatAbsoluteTime(transaction.blockTimestamp)}
        >
          {formatAbsoluteTime(transaction.blockTimestamp)}
          <span className="text-stone-400">
            {' '}
            ({formatRelativeTime(transaction.blockTimestamp)})
          </span>
        </p>
      </Field>

      <div className="sm:col-span-2">
        <Field label="Sender">
          <CopyableValue value={transaction.senderAddress} label="sender" />
        </Field>
      </div>
    </div>
  );
}

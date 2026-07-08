'use client';

import { useEffect } from 'react';
import type { Transaction } from '@/lib/api/types';
import { Button } from '@/components/ui/Button';
import { TransactionDetails } from '@/components/transactions/TransactionDetails';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export function TransactionDetailModal({
  transaction,
  onClose,
}: TransactionDetailModalProps) {
  useEffect(() => {
    if (!transaction) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [transaction, onClose]);

  if (!transaction) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Transaction details"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl border border-stone-200/80 bg-white shadow-xl shadow-stone-300/40 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-stone-900">
            Transaction details
          </h2>
          <Button
            variant="ghost"
            className="!px-2 !py-1 text-sm"
            onClick={onClose}
            aria-label="Close details"
          >
            Close
          </Button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
          <TransactionDetails transaction={transaction} />
        </div>
      </div>
    </div>
  );
}

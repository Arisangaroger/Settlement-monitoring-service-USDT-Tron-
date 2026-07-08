import { WalletOutlineIcon } from '@/components/icons/Icons';

export function NoWalletBanner() {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <WalletOutlineIcon size="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-gray-900">No wallet connected</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500">
        Click &apos;Connect wallet&apos; in the top right corner to connect your TronLink wallet
      </p>
    </div>
  );
}

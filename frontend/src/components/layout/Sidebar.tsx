import { UsdtLogo } from '@/components/brand/UsdtLogo';
import { DashboardNavIcon, TronNetworkIcon } from '@/components/icons/Icons';

const NETWORK_LABEL =
  process.env.NEXT_PUBLIC_TRON_NETWORK_LABEL ?? 'TRON Shasta';

export function Sidebar() {
  return (
    <aside className="hidden w-[220px] shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <UsdtLogo size={32} />
        <div className="min-w-0 leading-tight">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
            USDT Settlement
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
            Monitor
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2" aria-label="Main navigation">
        <a
          href="#"
          className="flex items-center gap-2.5 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
          aria-current="page"
        >
          <DashboardNavIcon className="text-emerald-600" />
          Dashboard
        </a>
      </nav>

      <div className="border-t border-gray-100 p-3">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            <span className="text-[11px] font-medium text-gray-500">Network</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-gray-900">{NETWORK_LABEL}</p>
            <TronNetworkIcon size="h-4 w-4" />
          </div>
        </div>
      </div>
    </aside>
  );
}

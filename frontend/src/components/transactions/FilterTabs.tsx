import type { StatusFilter } from '@/lib/api/types';

const allFilters: {
  id: StatusFilter;
  label: string;
  activeClass: string;
  idleClass: string;
}[] = [
  {
    id: 'all',
    label: 'All',
    activeClass: 'border-emerald-600 text-emerald-700 bg-white shadow-sm',
    idleClass: 'border-transparent text-gray-600 hover:bg-gray-50',
  },
  {
    id: 'confirmed',
    label: 'Confirmed',
    activeClass: 'border-emerald-600 text-emerald-700 bg-white shadow-sm',
    idleClass: 'border-transparent text-emerald-600 hover:bg-emerald-50/50',
  },
  {
    id: 'pending',
    label: 'Pending',
    activeClass: 'border-orange-500 text-orange-700 bg-white shadow-sm',
    idleClass: 'border-transparent text-orange-600 hover:bg-orange-50/50',
  },
  {
    id: 'failed',
    label: 'Failed',
    activeClass: 'border-gray-500 text-gray-800 bg-white shadow-sm',
    idleClass: 'border-transparent text-gray-500 hover:bg-gray-50',
  },
];

const basicFilterOrder: StatusFilter[] = ['all', 'pending', 'confirmed'];
const basicFilters = basicFilterOrder
  .map((id) => allFilters.find((f) => f.id === id))
  .filter((f): f is (typeof allFilters)[number] => f != null);

interface FilterTabsProps {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
  variant?: 'default' | 'pill';
  basic?: boolean;
}

export function FilterTabs({
  value,
  onChange,
  variant = 'default',
  basic = false,
}: FilterTabsProps) {
  const filters = basic ? basicFilters : allFilters;

  if (variant === 'pill') {
    return (
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter transactions by status">
        {filters.map((filter) => {
          const active = value === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(filter.id)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-gray-200 text-gray-800'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter transactions by status">
      {filters.map((filter) => {
        const active = value === filter.id;
        return (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(filter.id)}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors sm:text-sm ${
              active ? filter.activeClass : filter.idleClass
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}

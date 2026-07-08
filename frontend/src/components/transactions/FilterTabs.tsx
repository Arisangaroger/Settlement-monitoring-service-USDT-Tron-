import type { StatusFilter } from '@/lib/api/types';

const filters: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'pending', label: 'Pending' },
];

interface FilterTabsProps {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
}

export function FilterTabs({ value, onChange }: FilterTabsProps) {
  return (
    <div
      className="inline-flex rounded-xl bg-stone-100/90 p-1 ring-1 ring-inset ring-stone-200/70"
      role="tablist"
      aria-label="Filter transactions by status"
    >
      {filters.map((filter) => {
        const active = value === filter.id;
        return (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(filter.id)}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 sm:px-4 ${
              active
                ? 'bg-white text-stone-900 shadow-sm shadow-stone-200/60'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}

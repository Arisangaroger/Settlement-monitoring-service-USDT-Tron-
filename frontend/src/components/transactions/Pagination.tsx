import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@/components/icons/Icons';

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function pageNumbers(current: number, total: number): number[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  return [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
}

export function Pagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (total === 0) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const pages = pageNumbers(page, totalPages);

  return (
    <nav
      className="flex flex-col gap-4 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-5"
      aria-label="Transaction pagination"
    >
      <p className="text-sm text-gray-500">
        Showing {start} to {end} of {total} transactions
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeftIcon />
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors ${
              p === page
                ? 'border-emerald-600 bg-white text-emerald-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRightIcon />
        </button>

        <span className="ml-2 text-sm text-gray-500">
          Page {page} of {totalPages}
        </span>
      </div>
    </nav>
  );
}

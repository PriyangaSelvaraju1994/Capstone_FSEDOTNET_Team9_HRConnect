import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  /** 1-based current page. */
  page: number;
  /** Total number of items across all pages. */
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Singular label used in the "Showing …" caption. Defaults to "items". */
  itemLabel?: string;
}

/**
 * Numeric paginator used by the S4 My-Leaves and S6 Employees tables.
 * Renders the "Showing 1–10 of 36" caption plus prev/page-buttons/next.
 */
export function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
  itemLabel = 'items',
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);
  const pages = pageWindow(page, totalPages);

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50">
      <div className="text-xs text-slate-500" aria-live="polite">
        Showing {first}\{last} of {total} {itemLabel}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className={`p-1.5 rounded ${
            page <= 1 ? 'text-slate-400' : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`px-2.5 py-1 text-xs rounded ${
              p === page
                ? 'bg-brand-600 text-white'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className={`p-1.5 rounded ${
            page >= totalPages
              ? 'text-slate-400'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/** Returns a tight window of page numbers centred on `current`, max 5 wide. */
function pageWindow(current: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  let start = Math.max(1, current - 2);
  const end = Math.min(totalPages, start + 4);
  start = Math.max(1, end - 4);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

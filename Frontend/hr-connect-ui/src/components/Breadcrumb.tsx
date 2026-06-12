import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: ReactNode;
  /** When set, the item is rendered as a Link; otherwise it's the current page. */
  to?: string;
}

interface Props {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Compact "Parent > Current" breadcrumb used by S5 / S7 / S8.
 * The last item is always treated as the current page (non-link, slate-900).
 */
export function Breadcrumb({ items, className = 'mb-4' }: Props) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`text-sm text-slate-500 flex items-center gap-1 flex-wrap ${className}`}
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={idx} className="flex items-center gap-1">
            {idx > 0 && (
              <ChevronRight
                className="w-3 h-3 text-slate-400"
                aria-hidden="true"
              />
            )}
            {isLast || !item.to ? (
              <span className="text-slate-900" aria-current={isLast ? 'page' : undefined}>
                {item.label}
              </span>
            ) : (
              <Link to={item.to} className="hover:text-slate-900">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

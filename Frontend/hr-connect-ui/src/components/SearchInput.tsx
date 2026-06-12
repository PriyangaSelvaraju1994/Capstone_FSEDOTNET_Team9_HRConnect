import { Search, X } from 'lucide-react';

interface Props {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  /** Accessible label for the input. */
  ariaLabel?: string;
  /** Optional extra className applied to the wrapper for layout. */
  className?: string;
}

/**
 * Generic search input with leading magnifier icon and a trailing
 * clear button. Used on the S6 Employees page.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search\u2026',
  ariaLabel = 'Search',
  className = '',
}: Props) {
  return (
    <div className={`relative ${className}`}>
      <Search
        className="w-4 h-4 absolute left-3 top-2.5 text-slate-400"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-full pl-9 pr-9 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

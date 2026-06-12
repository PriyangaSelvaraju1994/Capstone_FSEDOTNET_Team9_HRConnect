import { useMemo } from 'react';

export interface ActiveFilter {
  label: string;
  clear: () => void;
}

export interface UseActiveFiltersOptions<T extends Record<string, unknown>> {
  filters: T;
  defaultFilters: T;
  filterLabels: Record<keyof T, (value: T[keyof T]) => string>;
  onClear: <K extends keyof T>(key: K) => void;
}

/**
 * Generates a list of active filter chips with labels and clear handlers.
 * Used to display removable filter badges above filtered lists.
 */
export function useActiveFilters<T extends Record<string, unknown>>(
  options: UseActiveFiltersOptions<T>,
): ActiveFilter[] {
  const { filters, defaultFilters, filterLabels, onClear } = options;

  return useMemo(() => {
    const chips: ActiveFilter[] = [];

    for (const key in filters) {
      const value = filters[key];
      const defaultValue = defaultFilters[key];

      if (value !== defaultValue) {
        const labelFn = filterLabels[key];
        chips.push({
          label: labelFn(value),
          clear: () => onClear(key),
        });
      }
    }

    return chips;
  }, [filters, defaultFilters, filterLabels, onClear]);
}

import { useState, useCallback, useMemo } from 'react';

export interface UseFiltersOptions<T extends Record<string, unknown>> {
  initialFilters: T;
  onFilterChange?: (filters: T) => void;
}

export interface FiltersState<T extends Record<string, unknown>> {
  filters: T;
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  resetFilters: () => void;
  clearFilter: <K extends keyof T>(key: K, defaultValue: T[K]) => void;
  activeFilterCount: number;
}

/**
 * Generic hook for managing multiple filter states with reset and clear functionality.
 * Tracks which filters are active (non-default) for UI indicators.
 */
export function useFilters<T extends Record<string, unknown>>(
  options: UseFiltersOptions<T>,
): FiltersState<T> {
  const { initialFilters, onFilterChange } = options;
  const [filters, setFilters] = useState<T>(initialFilters);

  const setFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value };
        onFilterChange?.(next);
        return next;
      });
    },
    [onFilterChange],
  );

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    onFilterChange?.(initialFilters);
  }, [initialFilters, onFilterChange]);

  const clearFilter = useCallback(
    <K extends keyof T>(key: K, defaultValue: T[K]) => {
      setFilter(key, defaultValue);
    },
    [setFilter],
  );

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(
      ([key, value]) => value !== initialFilters[key as keyof T],
    ).length;
  }, [filters, initialFilters]);

  return {
    filters,
    setFilter,
    resetFilters,
    clearFilter,
    activeFilterCount,
  };
}

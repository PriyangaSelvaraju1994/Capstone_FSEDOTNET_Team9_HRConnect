import { useState, useCallback } from 'react';
import { useDebouncedValue } from './useDebouncedValue';

export interface UseSearchOptions {
  initialValue?: string;
  debounceMs?: number;
}

export interface SearchState {
  search: string;
  debouncedSearch: string;
  setSearch: (value: string) => void;
  clearSearch: () => void;
}

/**
 * Manages search input state with debouncing to optimize API calls.
 * The debounced value updates only after the user stops typing.
 */
export function useSearch(options: UseSearchOptions = {}): SearchState {
  const { initialValue = '', debounceMs = 300 } = options;
  const [search, setSearch] = useState(initialValue);
  const debouncedSearch = useDebouncedValue(search, debounceMs);

  const clearSearch = useCallback(() => setSearch(''), []);

  return {
    search,
    debouncedSearch,
    setSearch,
    clearSearch,
  };
}

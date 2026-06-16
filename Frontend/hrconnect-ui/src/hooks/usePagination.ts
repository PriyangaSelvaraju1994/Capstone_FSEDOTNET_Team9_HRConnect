import { useState, useCallback } from 'react';

export interface UsePaginationOptions {
  initialPage?: number;
  pageSize: number;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  resetPage: () => void;
  nextPage: () => void;
  prevPage: () => void;
}

/**
 * Manages pagination state and provides handlers for page navigation.
 * Used across list/table views for consistent pagination behavior.
 */
export function usePagination(options: UsePaginationOptions): PaginationState {
  const { initialPage = 1, pageSize } = options;
  const [page, setPage] = useState(initialPage);

  const resetPage = useCallback(() => setPage(1), []);
  const nextPage = useCallback(() => setPage((p) => p + 1), []);
  const prevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);

  return {
    page,
    pageSize,
    setPage,
    resetPage,
    nextPage,
    prevPage,
  };
}

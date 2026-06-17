import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchEmployees,
  selectEmployeeList,
} from '../store/slices/employeesSlice';
import {
  selectPendingCount,
} from '../store/slices/leavesSlice';
import type { Department, Designation } from '../types/auth';
import { usePagination } from './usePagination';
import { useSearch } from './useSearch';
import { useFilters } from './useFilters';
import { useActiveFilters } from './useActiveFilters';

export interface UseEmployeesListOptions {
  pageSize?: number;
}

interface EmployeeFilters extends Record<string, unknown> {
  department: Department | 'All';
  designation: Designation | 'All';
}

/**
 * Encapsulates all logic for the Employees list page including search,
 * filtering, pagination, and related data fetching.
 */
export function useEmployeesList(options: UseEmployeesListOptions = {}) {
  const { pageSize = 8 } = options;

  const searchState = useSearch();
  const pagination = usePagination({ pageSize });
  const filterState = useFilters<EmployeeFilters>({
    initialFilters: { department: 'All', designation: 'All' },
  });

  const dispatch = useAppDispatch();
  const list = useAppSelector(selectEmployeeList);
  const pendingCount = useAppSelector(selectPendingCount);

  const loading = list.status === 'loading';
  const error = list.status === 'failed' ? list.error : null;

  // One-time: warm filter options and badge
  useEffect(() => {
    // void dispatch(fetchDesignations());
    // void dispatch(fetchPendingCount());
  }, [dispatch]);

  // Fetch directory whenever search/filter/page changes
  useEffect(() => {
    void dispatch(
      fetchEmployees({
        search: searchState.debouncedSearch,
        department: filterState.filters.department,
        designation: filterState.filters.designation,
        page: pagination.page,
        pageSize: pagination.pageSize,
      }),
    );
  }, [
    dispatch,
    searchState.debouncedSearch,
    filterState.filters.department,
    filterState.filters.designation,
    pagination.page,
    pagination.pageSize,
  ]);

  const refetch = useCallback(() => {
    void dispatch(
      fetchEmployees({
        search: searchState.debouncedSearch,
        department: filterState.filters.department,
        designation: filterState.filters.designation,
        page: pagination.page,
        pageSize: pagination.pageSize,
      }),
    );
  }, [
    dispatch,
    searchState.debouncedSearch,
    filterState.filters.department,
    filterState.filters.designation,
    pagination.page,
    pagination.pageSize,
  ]);

  const setDepartment = useCallback(
    (dept: Department | 'All') => {
      filterState.setFilter('department', dept);
      pagination.resetPage();
    },
    [filterState, pagination],
  );

  const setDesignation = useCallback(
    (desig: Designation | 'All') => {
      filterState.setFilter('designation', desig);
      pagination.resetPage();
    },
    [filterState, pagination],
  );

  const activeFilters = useActiveFilters({
    filters: filterState.filters,
    defaultFilters: { department: 'All', designation: 'All' },
    filterLabels: {
      department: (value) => `Department: ${value}`,
      designation: (value) => `Designation: ${value}`,
    },
    onClear: (key) => {
      if (key === 'department') setDepartment('All');
      if (key === 'designation') setDesignation('All');
    },
  });

  const clearAllFilters = useCallback(() => {
    filterState.resetFilters();
    pagination.resetPage();
  }, [filterState, pagination]);

  return {
    // Data
    employees: list.items,
    totalCount: list.total,
    loading,
    error,
    pendingCount,

    // Search
    search: searchState.search,
    setSearch: searchState.setSearch,
    clearSearch: searchState.clearSearch,

    // Filters
    department: filterState.filters.department,
    designation: filterState.filters.designation,
    setDepartment,
    setDesignation,
    activeFilters,
    clearAllFilters,

    // Pagination
    page: pagination.page,
    pageSize: pagination.pageSize,
    setPage: pagination.setPage,

    // Actions
    refetch,
  };
}

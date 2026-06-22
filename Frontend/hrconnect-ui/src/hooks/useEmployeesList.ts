import { useEffect, useCallback, useMemo } from 'react';
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

  const normalizedSearch = searchState.debouncedSearch.trim().toLowerCase();

  const filteredEmployees = useMemo(() => {
    return list.items.filter((employee) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        employee.fullName.toLowerCase().includes(normalizedSearch) ||
        employee.email.toLowerCase().includes(normalizedSearch);

      const matchesDepartment =
        filterState.filters.department === 'All' ||
        employee.department === filterState.filters.department;

      const matchesDesignation =
        filterState.filters.designation === 'All' ||
        employee.designation === filterState.filters.designation;

      return matchesSearch && matchesDepartment && matchesDesignation;
    });
  }, [
    list.items,
    normalizedSearch,
    filterState.filters.department,
    filterState.filters.designation,
  ]);

  const totalCount = filteredEmployees.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pagination.pageSize));

  useEffect(() => {
    if (pagination.page > totalPages) {
      pagination.setPage(totalPages);
    }
  }, [pagination, totalPages]);

  const employees = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    return filteredEmployees.slice(start, start + pagination.pageSize);
  }, [filteredEmployees, pagination.page, pagination.pageSize]);

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

  const setSearch = useCallback(
    (value: string) => {
      searchState.setSearch(value);
      pagination.resetPage();
    },
    [searchState, pagination],
  );

  return {
    // Data
    employees,
    totalCount,
    loading,
    error,
    pendingCount,

    // Search
    search: searchState.search,
    setSearch,
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

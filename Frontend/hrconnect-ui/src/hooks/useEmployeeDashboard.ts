import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchEmployeeDashboard,
  selectEmployeeDashboard,
} from '../store/slices/dashboardSlice';

export interface UseEmployeeDashboardOptions {
  userId: number;
}

/**
 * Encapsulates all data fetching logic for the employee dashboard page.
 * Automatically fetches dashboard data on mount and when userId changes.
 */
export function useEmployeeDashboard(options: UseEmployeeDashboardOptions) {
  const { userId } = options;
  const dispatch = useAppDispatch();
  const slot = useAppSelector(selectEmployeeDashboard);

  const data = slot.data;
  const loading = slot.status === 'loading' && !data;
  const error = slot.status === 'failed' ? slot.error : null;

  useEffect(() => {
    if (userId) {
      void dispatch(fetchEmployeeDashboard(userId));
    }
  }, [dispatch, userId]);

  const refetch = useCallback(() => {
    if (userId) {
      void dispatch(fetchEmployeeDashboard(userId));
    }
  }, [dispatch, userId]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

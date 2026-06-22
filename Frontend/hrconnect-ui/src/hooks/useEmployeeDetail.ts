import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  deleteEmployee,
  fetchEmployeeById,
  selectEmployeeById,
  selectEmployeeByIdStatus,
  selectEmployeeIsNotFound,
} from '../store/slices/employeesSlice';
import {
  fetchBalances,
  fetchEmployeeHistory,
  selectBalancesFor,
  selectEmployeeHistory,
  selectPendingCount,
} from '../store/slices/leavesSlice';
import { useConfirmDialog } from './useConfirmDialog';

export interface UseEmployeeDetailOptions {
  employeeId: number | undefined;
  historyPageSize?: number;
}

/**
 * Encapsulates all logic for the Employee Detail page including fetching
 * employee data, balances, history, and delete functionality.
 */
export function useEmployeeDetail(options: UseEmployeeDetailOptions) {
  const { employeeId, historyPageSize = 10 } = options;
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const { confirm } = useConfirmDialog();

  const dispatch = useAppDispatch();
  const emp = useAppSelector(selectEmployeeById(employeeId));
  const byIdStatus = useAppSelector(selectEmployeeByIdStatus);
  const isNotFound = useAppSelector(selectEmployeeIsNotFound(employeeId));
  const balances = useAppSelector(selectBalancesFor(employeeId ?? 0));
  const history = useAppSelector(selectEmployeeHistory);
  const pendingCount = useAppSelector(selectPendingCount);

  const empLoading =
    byIdStatus.status === 'loading' && byIdStatus.fetchingId === employeeId;
  const empError =
    byIdStatus.status === 'failed' && !isNotFound ? byIdStatus.error : null;
  const balancesLoading = !balances;
  const historyLoading =
    history.status === 'loading' && history.forEmployeeId === employeeId;
  const historyMatchesEmployee = history.forEmployeeId === employeeId;

  // Fetch all data when employeeId changes
  useEffect(() => {
    if (!employeeId) return;
    void dispatch(fetchEmployeeById(employeeId));
    void dispatch(fetchBalances(employeeId));
    void dispatch(
      fetchEmployeeHistory({ employeeId }),
    );
  }, [dispatch, employeeId, historyPageSize]);

  const refetch = useCallback(() => {
    if (employeeId) {
      void dispatch(fetchEmployeeById(employeeId));
    }
  }, [dispatch, employeeId]);

  const handleDelete = useCallback(async () => {
    if (!emp) return;

    const confirmed = await confirm({
      message: `Delete ${emp.fullName}? This cannot be undone.`,
    });
    if (!confirmed) return;

    setDeleting(true);
    try {
      await dispatch(deleteEmployee(emp.id)).unwrap();
      navigate('/employees');
    } catch {
      // Error surfaced through slice mutation state
    } finally {
      setDeleting(false);
    }
  }, [emp, confirm, dispatch, navigate]);

  return {
    // Employee data
    employee: emp,
    empLoading,
    empError,
    isNotFound,
    deleting,

    // Related data
    balances,
    balancesLoading,
    history: historyMatchesEmployee ? history.items : [],
    historyLoading,
    pendingCount,

    // Actions
    refetch,
    handleDelete,
  };
}

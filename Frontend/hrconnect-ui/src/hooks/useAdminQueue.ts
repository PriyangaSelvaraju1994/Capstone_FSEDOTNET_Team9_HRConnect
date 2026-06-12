import { useEffect, useCallback, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  approveLeave,
  fetchPendingQueue,
  rejectLeave,
  selectLeaveMutation,
  selectPendingQueue,
} from '../store/slices/leavesSlice';
import { leavesApi } from '../api/leavesApi';
import type { LeaveBalance, LeaveRequest } from '../types/leave';

/**
 * Encapsulates all logic for the Admin Queue page including fetching,
 * selection, approval/rejection workflows, and balance preview.
 */
export function useAdminQueue() {
  const dispatch = useAppDispatch();
  const queue = useAppSelector(selectPendingQueue);
  const mutation = useAppSelector(selectLeaveMutation);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [selectedBalances, setSelectedBalances] = useState<LeaveBalance[]>([]);

  const data = queue.items;
  const loading = queue.status === 'loading' && data.length === 0;
  const error = queue.status === 'failed' ? queue.error : null;

  // Initial load
  useEffect(() => {
    void dispatch(fetchPendingQueue());
  }, [dispatch]);

  const refetch = useCallback(() => {
    void dispatch(fetchPendingQueue());
  }, [dispatch]);

  // Auto-select first item when list changes
  useEffect(() => {
    if (data.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !data.some((r) => r.id === selectedId)) {
      setSelectedId(data[0].id);
    }
  }, [data, selectedId]);

  const selected = useMemo<LeaveRequest | null>(
    () => data.find((r) => r.id === selectedId) ?? null,
    [data, selectedId],
  );

  // Fetch balances for selected employee
  useEffect(() => {
    if (!selected) {
      setSelectedBalances([]);
      return;
    }
    let cancelled = false;
    leavesApi
      .getBalances(selected.employeeId)
      .then((bals) => {
        if (!cancelled) setSelectedBalances(bals);
      })
      .catch(() => {
        if (!cancelled) setSelectedBalances([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const preview = useMemo(() => {
    if (!selected) return null;
    return leavesApi.computePreview(
      selectedBalances,
      selected.type,
      selected.startDate,
      selected.endDate,
    );
  }, [selected, selectedBalances]);

  const handleApprove = useCallback(async () => {
    if (!selected) return;
    setBusy('approve');
    try {
      await dispatch(approveLeave(selected.id)).unwrap();
      refetch();
    } catch {
      // Error surfaced via mutation
    } finally {
      setBusy(null);
    }
  }, [selected, dispatch, refetch]);

  const handleReject = useCallback(async () => {
    if (!selected) return;
    setBusy('reject');
    try {
      await dispatch(rejectLeave(selected.id)).unwrap();
      refetch();
    } catch {
      // Error surfaced via mutation
    } finally {
      setBusy(null);
    }
  }, [selected, dispatch, refetch]);

  const selectNext = useCallback(() => {
    const idx = data.findIndex((r) => r.id === selectedId);
    if (idx >= 0 && idx < data.length - 1) {
      setSelectedId(data[idx + 1].id);
    }
  }, [data, selectedId]);

  const selectPrev = useCallback(() => {
    const idx = data.findIndex((r) => r.id === selectedId);
    if (idx > 0) {
      setSelectedId(data[idx - 1].id);
    }
  }, [data, selectedId]);

  return {
    // Data
    requests: data,
    loading,
    error,
    mutation,

    // Selection
    selectedId,
    setSelectedId,
    selected,
    selectedBalances,
    preview,

    // Navigation
    selectNext,
    selectPrev,

    // Actions
    busy,
    handleApprove,
    handleReject,
    refetch,
  };
}

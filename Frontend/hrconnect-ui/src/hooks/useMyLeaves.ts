import { useEffect, useCallback, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  cancelLeave,
  fetchMyLeaves,
  selectLeaveMutation,
  selectMyLeaves,
} from '../store/slices/leavesSlice';
import type { LeaveRequest, LeaveStatusFilter } from '../types/leave';
import { usePagination } from './usePagination';
import { useConfirmDialog } from './useConfirmDialog';

export interface UseMyLeavesOptions {
  userId: number;
  pageSize?: number;
}

/**
 * Encapsulates all logic for the My Leaves page including fetching,
 * pagination, filtering, and cancellation with confirmation.
 */
export function useMyLeaves(options: UseMyLeavesOptions) {
  const { userId, pageSize = 8 } = options;
  const [status, setStatus] = useState<LeaveStatusFilter>('All');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const pagination = usePagination({ pageSize });
  const dispatch = useAppDispatch();
  const myLeaves = useAppSelector(selectMyLeaves);
  const mutation = useAppSelector(selectLeaveMutation);
  const { confirm } = useConfirmDialog();

  const loading = myLeaves.status === 'loading';
  const error = myLeaves.status === 'failed' ? myLeaves.error : null;

  // Fetch once per user; filtering and pagination are handled client-side.
  useEffect(() => {
    if (!userId) return;
    void dispatch(
      fetchMyLeaves({
        employeeId: userId
      }),
    );
  }, [dispatch, userId]);

  const refetch = useCallback(() => {
    void dispatch(
      fetchMyLeaves({
        employeeId: userId
      }),
    );
  }, [dispatch, userId]);

  const filteredLeaves = useMemo(() => {
    if (status === 'All') return myLeaves.items;
    return myLeaves.items.filter((leave) => leave.status === status);
  }, [myLeaves.items, status]);

  const totalCount = filteredLeaves.length;
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const pagedLeaves = filteredLeaves.slice(
    startIndex,
    startIndex + pagination.pageSize,
  );

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalCount / pagination.pageSize));
    if (pagination.page > maxPage) {
      pagination.setPage(maxPage);
    }
  }, [totalCount, pagination.page, pagination.pageSize, pagination.setPage]);

  const changeStatus = useCallback(
    (next: LeaveStatusFilter) => {
      setStatus(next);
      pagination.resetPage();
    },
    [pagination],
  );

  const handleCancel = useCallback(
    async (req: LeaveRequest) => {
      if (req.status !== 'Pending') return;
      const confirmed = await confirm({
        message: 'Cancel this leave request?',
      });
      if (!confirmed) return;

      setCancellingId(req.id);
      try {
        await dispatch(cancelLeave(req.id)).unwrap();
        refetch();
      } catch {
        // Error surfaced via mutation.error banner
      } finally {
        setCancellingId(null);
      }
    },
    [confirm, dispatch, refetch],
  );

  return {
    // Data
    leaves: pagedLeaves,
    totalCount,
    loading,
    error,
    mutation,
    cancellingId,

    // Filter
    status,
    changeStatus,

    // Pagination
    page: pagination.page,
    pageSize: pagination.pageSize,
    setPage: pagination.setPage,

    // Actions
    refetch,
    handleCancel,
  };
}

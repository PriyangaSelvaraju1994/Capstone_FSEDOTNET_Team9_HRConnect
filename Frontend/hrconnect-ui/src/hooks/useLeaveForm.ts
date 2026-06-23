import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  createLeave,
  fetchBalances,
  selectBalancesFor,
} from '../store/slices/leavesSlice';
import { leavesApi } from '../api/leavesApi';
import type { LeaveType } from '../types/leave';

export interface UseLeaveFormOptions {
  userId: number;
  redirectPath?: string;
}

/**
 * Encapsulates all logic for the Leave Request form including balance fetching,
 * preview computation, and submission with navigation.
 */
export function useLeaveForm(options: UseLeaveFormOptions) {
  const { userId, redirectPath = '/my-leaves' } = options;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();

  const dispatch = useAppDispatch();
  const balances = useAppSelector(selectBalancesFor(userId));

  // Fetch balances on mount
  useEffect(() => {
    if (userId) {
      void dispatch(fetchBalances(userId));
    }
  }, [dispatch, userId]);

  const computePreview = (
    type: LeaveType,
    startDate: string,
    endDate: string,
  ) => {
    return leavesApi.computePreview(balances ?? [], type, startDate, endDate);
  };

  const handleSubmit = async (values: {
    type: LeaveType;
    startDate: string;
    endDate: string;
    reason?: string;
  }) => {
    setSubmitError(null);
    try {
      await dispatch(
        createLeave({
          employeeId: userId,
          leaveType: values.type,
          startDate: values.startDate,
          endDate: values.endDate,
          reason: values.reason?.trim() || undefined,
        }),
      ).unwrap();
      // Refresh balances after submission
      void dispatch(fetchBalances(userId));
      navigate(redirectPath, {
        state: { message: 'Leave request submitted successfully.' },
      });
      
    } catch (e) {
      setSubmitError(
        typeof e === 'string'
          ? e
          : e instanceof Error
            ? e.message
            : 'Could not submit your request.',
      );
    }
  };

  const clearError = () => setSubmitError(null);

  return {
    balances,
    submitError,
    computePreview,
    handleSubmit,
    clearError,
  };
}

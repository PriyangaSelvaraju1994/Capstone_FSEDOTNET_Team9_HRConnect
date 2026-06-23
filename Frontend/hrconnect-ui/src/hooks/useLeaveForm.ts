import { useEffect, useState } from 'react';
import { useRef } from 'react';
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
  const timeoutRef = useRef<number | null>(null);

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
    // Clear any existing error immediately when submitting again
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
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
      navigate(redirectPath);
      
    } catch (e) {
      const message =
        typeof e === 'string'
          ? e
          : e instanceof Error
          ? e.message
          : 'Could not submit your request.';

      setSubmitError(message);
      // Auto-clear the error after 10 seconds
      timeoutRef.current = window.setTimeout(() => {
        setSubmitError(null);
        timeoutRef.current = null;
      }, 10000) as unknown as number;
    }
  };

  const clearError = () => setSubmitError(null);

  // Clear any pending timeout when the error is manually cleared.
  const wrappedClearError = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setSubmitError(null);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return {
    balances,
    submitError,
    computePreview,
    handleSubmit,
    clearError: wrappedClearError,
  };
}

// Ensure any pending timer is cleared when the hook is unmounted.
// (React guarantees hooks run in component context; this cleanup is defensive.)

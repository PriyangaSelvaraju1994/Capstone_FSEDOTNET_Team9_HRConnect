import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  changePassword,
  clearPasswordState as clearPasswordStateAction,
  clearProfileUpdateState,
  fetchProfile,
  selectProfile,
  updateProfile,
} from '../store/slices/profileSlice';
import type { ProfileFormValues, PasswordFormValues } from '../types/forms';

export interface UseProfileOptions {
  userId: number;
}

/**
 * Encapsulates all logic for the Profile page including data fetching,
 * profile updates, and password changes.
 */
export function useProfile(options: UseProfileOptions) {
  const { userId } = options;
  const dispatch = useAppDispatch();
  const profile = useAppSelector(selectProfile);

  const emp = profile.data;
  const loading = profile.status === 'loading' && !emp;
  const error = profile.status === 'failed' ? profile.error : null;

  const profileSaved = profile.updateStatus === 'succeeded';
  const profileSaveError =
    profile.updateStatus === 'failed' ? profile.updateError : null;

  const passwordChanged = profile.passwordStatus === 'succeeded';
  const passwordChangeError =
    profile.passwordStatus === 'failed' ? profile.passwordError : null;

  // Fetch profile on mount
  useEffect(() => {
    if (userId) {
      void dispatch(fetchProfile(userId));
    }
  }, [dispatch, userId]);

  const refetch = useCallback(() => {
    if (userId) {
      void dispatch(fetchProfile(userId));
    }
  }, [dispatch, userId]);

  const handleUpdateProfile = useCallback(
    async (data: ProfileFormValues) => {
      await dispatch(
        updateProfile({
          userId,
          payload: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone || undefined,
          },
        }),
      ).unwrap();
      // Refresh profile after update
      refetch();
    },
    [dispatch, userId, refetch],
  );

  const handleChangePassword = useCallback(
    async (data: PasswordFormValues) => {
      await dispatch(
        changePassword({
          employeeId: userId,
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      ).unwrap();
    },
    [dispatch],
  );

  const clearProfileState = useCallback(() => {
    dispatch(clearProfileUpdateState());
  }, [dispatch]);

  const clearPasswordState = useCallback(() => {
    dispatch(clearPasswordStateAction());
  }, [dispatch]);

  return {
    // Data
    employee: emp,
    loading,
    error,

    // Profile update
    profileSaved,
    profileSaveError,
    handleUpdateProfile,
    clearProfileState,

    // Password change
    passwordChanged,
    passwordChangeError,
    handleChangePassword,
    clearPasswordState,

    // Actions
    refetch,
  };
}

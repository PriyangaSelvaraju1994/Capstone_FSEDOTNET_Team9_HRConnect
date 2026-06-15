import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  clearAuthError,
  logout,
  selectAuthError,
  selectAuthStatus,
  selectAuthUser,
  selectIsAdmin,
  selectIsAuthenticated,
} from '../store/slices/authSlice';

/** Thin convenience wrapper over the auth slice. */
export function useAuth() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectAuthUser);
  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAdmin = useAppSelector(selectIsAdmin);

  const signOut = useCallback(() => dispatch(logout()), [dispatch]);
  const clearError = useCallback(() => dispatch(clearAuthError()), [dispatch]);
  
  return {
    user: { ...user, id: 1 },
    status,
    error,
    isAuthenticated,
    isAdmin,
    signOut,
    clearError,
  };
}

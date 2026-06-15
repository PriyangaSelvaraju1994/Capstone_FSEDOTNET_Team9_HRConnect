import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface Props {
  children: ReactNode;
}

/**
 * Guards admin-only routes. Unauthenticated users are sent to `/login`
 * (with `state.from` so they bounce back); authenticated non-admins
 * get the 403 page.
 */
export function AdminRoute({ children }: Props) {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!isAdmin) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}

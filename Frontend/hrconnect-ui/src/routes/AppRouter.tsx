import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/Login/LoginPage';
import RegisterPage from '../pages/Register/RegisterPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import ForbiddenPage from '../pages/Errors/ForbiddenPage';
import NotFoundPage from '../pages/Errors/NotFoundPage';
import ServerErrorPage from '../pages/Errors/ServerErrorPage';
import { AdminRoute } from './AdminRoute';
import { ProtectedRoute } from './ProtectedRoute';

// Code-split the larger authenticated screens so the auth bundle stays small.
const MyLeavesPage = lazy(() => import('../pages/MyLeaves/MyLeavesPage'));
const LeaveNewPage = lazy(() => import('../pages/LeaveNew/LeaveNewPage'));
const ProfilePage = lazy(() => import('../pages/Profile/ProfilePage'));
const EmployeesPage = lazy(() => import('../pages/Employees/EmployeesPage'));
const EmployeeDetailPage = lazy(
  () => import('../pages/Employees/EmployeeDetailPage'),
);
const EmployeeFormPage = lazy(
  () => import('../pages/Employees/EmployeeFormPage'),
);
const AdminQueuePage = lazy(
  () => import('../pages/AdminQueue/AdminQueuePage'),
);

function LazyFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen grid place-items-center text-sm text-slate-500"
    >
      Loading…
    </div>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<LazyFallback />}>
      <Routes>
        {/* Public auth pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Authenticated routes (Employee + HR Admin) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-leaves"
          element={
            <ProtectedRoute>
              <MyLeavesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaves/new"
          element={
            <ProtectedRoute>
              <LeaveNewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* HR-Admin-only routes (S6/S7/S8/S9) */}
        <Route
          path="/employees"
          element={
            <AdminRoute>
              <EmployeesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/employees/new"
          element={
            <AdminRoute>
              <EmployeeFormPage mode="create" />
            </AdminRoute>
          }
        />
        <Route
          path="/employees/:id"
          element={
            <AdminRoute>
              <EmployeeDetailPage />
            </AdminRoute>
          }
        />
        <Route
          path="/employees/:id/edit"
          element={
            <AdminRoute>
              <EmployeeFormPage mode="edit" />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/queue"
          element={
            <AdminRoute>
              <AdminQueuePage />
            </AdminRoute>
          }
        />

        {/* Error pages — public so they're reachable from any context (S11/S12/S13) */}
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="/500" element={<ServerErrorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

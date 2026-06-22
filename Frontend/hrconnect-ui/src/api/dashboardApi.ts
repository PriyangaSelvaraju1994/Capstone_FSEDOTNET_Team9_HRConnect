/**
 * Dashboard data layer.
 *
 * Talks to the HRConnect backend via the shared axios instance. The JWT and
 * base URL are handled centrally by `./client`.
 */
import { http } from './client';
import type {
  EmployeeDashboardData,
  HrActivityEntry,
  HrDashboardSummary,
} from '../types/leave';

export const dashboardApi = {
  getEmployeeDashboard: (userId: number): Promise<EmployeeDashboardData[]> =>
    http
      .get<EmployeeDashboardData[]>(`/leaves/leavebalances/${userId}`)
      .then((r) => r.data),

  getHrDashboard: (): Promise<HrDashboardSummary> =>
    http.get<HrDashboardSummary>('/dashboard/dashboard-summary').then((r) => r.data),

  getHrDashboardRecent: (): Promise<HrActivityEntry[]> =>
    http.get<HrActivityEntry[]>('/dashboard/recent-activities').then((r) => r.data),
};


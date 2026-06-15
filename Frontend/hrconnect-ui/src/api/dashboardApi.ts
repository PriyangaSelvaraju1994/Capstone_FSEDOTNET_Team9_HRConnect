/**
 * Dashboard data layer.
 *
 * Talks to the HRConnect backend via the shared axios instance. The JWT and
 * base URL are handled centrally by `./client`.
 */
import { http } from './client';
import type {
  EmployeeDashboardData,
  HrDashboardData,
} from '../types/leave';

export const dashboardApi = {
  getEmployeeDashboard: (userId: number): Promise<EmployeeDashboardData> =>
    http
      .get<EmployeeDashboardData>(`/employees/${userId}/dashboard`)
      .then((r) => r.data),

  getHrDashboard: (): Promise<HrDashboardData> =>
    http.get<HrDashboardData>('/hr/dashboard').then((r) => r.data),
};


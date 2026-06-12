import dashboardData from './dashboard.json';
import type {
  EmployeeDashboardData,
  HrDashboardData,
  LeaveBalance,
  LeaveRequest,
} from '../types/leave';

interface DashboardSeed {
  default: {
    balances: LeaveBalance[];
    recentRequests: LeaveRequest[];
  };
  employees: Record<string, EmployeeDashboardData | undefined>;
  hr: HrDashboardData;
}

const seed = dashboardData as DashboardSeed;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const mockDashboard = {
  async getEmployeeDashboard(userId: string): Promise<EmployeeDashboardData> {
    await sleep(350);
    const data = seed.employees[userId];
    if (data) return structuredClone(data);
    // New users get default empty-ish payload — exercises the "empty" state.
    return {
      balances: structuredClone(seed.default.balances),
      recentRequests: [],
    };
  },

  async getHrDashboard(): Promise<HrDashboardData> {
    await sleep(400);
    return structuredClone(seed.hr);
  },
};

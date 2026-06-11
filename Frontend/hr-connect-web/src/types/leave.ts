export type LeaveType = 'Annual' | 'Sick' | 'Personal' | 'CompOff';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

/** Status values that the My-Leaves filter chips expose (S4). */
export const LEAVE_STATUS_FILTERS = [
  'All',
  'Pending',
  'Approved',
  'Rejected',
  'Cancelled',
] as const;
export type LeaveStatusFilter = (typeof LEAVE_STATUS_FILTERS)[number];

export interface LeaveBalance {
  type: LeaveType;
  used: number;
  total: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeInitials: string;
  type: LeaveType;
  days: number;
  startDate: string; // ISO date
  endDate: string; // ISO date
  status: LeaveStatus;
  submittedAt: string; // ISO timestamp
  reason?: string;
  /** Designation snapshot — used by the S9 detail panel header. */
  employeeDesignation?: string;
  employeeDepartment?: string;
}

/** Payload accepted by `leavesApi.create()` (S5). */
export interface CreateLeaveRequest {
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

/** Live "what-if" balance projection rendered by the S5 sidebar + S9 panel. */
export interface LeaveBalancePreview {
  workingDays: number;
  currentUsed: number;
  currentTotal: number;
  /** After-approval projection. */
  projectedUsed: number;
  projectedTotal: number;
  /** True when the request fits within the remaining balance. */
  sufficient: boolean;
}

export interface LeaveListParams {
  employeeId?: string;
  status?: LeaveStatusFilter;
  page?: number;
  pageSize?: number;
}

export interface LeaveListResult {
  items: LeaveRequest[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EmployeeDashboardData {
  balances: LeaveBalance[];
  recentRequests: LeaveRequest[];
}

export type HrActivityAction = 'requested' | 'approved' | 'rejected';

export interface HrActivityEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorInitials: string;
  action: HrActivityAction;
  leaveType: LeaveType;
  days: number;
  startDate?: string;
  endDate?: string;
  occurredAt: string;
  status: LeaveStatus;
  /** true when the current admin performed the action (e.g. approved/rejected by me) */
  byMe?: boolean;
}

export interface HrKpis {
  pendingCount: number;
  approvedThisMonth: number;
  activeEmployees: number;
  onLeaveToday: number;
}

export interface HrDashboardData {
  kpis: HrKpis;
  recentActivity: HrActivityEntry[];
}

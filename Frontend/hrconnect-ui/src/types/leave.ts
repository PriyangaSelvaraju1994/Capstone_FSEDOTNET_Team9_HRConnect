export type LeaveType = 'Earned' | 'Sick' | 'Casual' | 'CompOff';
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
  leaveType: LeaveType;
  usedDays: number;
  totalDays: number;
  remainingDays: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: number;
  employeeName: string;
  employeeInitials: string;
  leaveType: LeaveType;
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
  employeeId: number;
  leaveType: LeaveType;
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
  employeeId?: number;
}

export interface LeaveListResult {
  items: LeaveRequest[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EmployeeDashboardData {
  employeeId: number;
  leaveType: LeaveType;
  remainingDays: number;
  totalDays: number;
  usedDays: number;
}

export type HrActivityAction = 'requested' | 'approved' | 'rejected';

export interface HrActivityEntry {
  id: string;
  actorId: number;
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

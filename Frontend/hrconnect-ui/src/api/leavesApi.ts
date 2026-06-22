/**
 * Leaves data layer.
 *
 * Talks to the HRConnect backend via the shared axios instance.
 */
import { http } from './client';
import { computeLeavePreview } from '../utils/leavePreview';
import type {
  CreateLeaveRequest,
  LeaveBalance,
  LeaveBalancePreview,
  LeaveListParams,
  LeaveRequest,
  LeaveType,
} from '../types/leave';

type LeaveRequestApiShape = LeaveRequest & {
  employeeDepartment?: string;
  employeeDesignation?: string;
  autoApproved?: boolean;
};

const normalizeLeaveRequest = (request: LeaveRequestApiShape): LeaveRequest => ({
  ...request,
  department: request.department ?? request.employeeDepartment,
  designation: request.designation ?? request.employeeDesignation,
  isAutoApproved: request.isAutoApproved ?? request.autoApproved,
});

const normalizeLeaveRequests = (
  requests: LeaveRequestApiShape[],
): LeaveRequest[] => requests.map(normalizeLeaveRequest);

export const leavesApi = {
  list: (params: LeaveListParams = {}): Promise<LeaveRequest[]> =>
    http
      .get<LeaveRequestApiShape[]>('/leaves/mine', { params })
      .then((r) => normalizeLeaveRequests(r.data)),

  getById: (id: string): Promise<LeaveRequest> =>
    http
      .get<LeaveRequestApiShape>(`/leaves/${id}`)
      .then((r) => normalizeLeaveRequest(r.data)),

  listPending: (): Promise<LeaveRequest[]> =>
    http
      .get<LeaveRequestApiShape[]>('/leaves/all')
      .then((r) => normalizeLeaveRequests(r.data)),

  getPendingCount: (): Promise<number> =>
    http
      .get<{ count: number }>('/leaves/pending/count')
      .then((r) => r.data.count),

  getBalances: (employeeId: number): Promise<LeaveBalance[]> =>
    http
      .get<LeaveBalance[]>(`/leaves/leavebalances/${employeeId}`)
      .then((r) => r.data),

  /**
   * Sync "what-if" projection used by the S5 form and the S9 admin detail
   * panel. Pure — pass the employee's current balances in (caller already
   * has them) so the preview updates without a round-trip.
   */
  computePreview: (
    balances: LeaveBalance[],
    type: LeaveType,
    startIso: string,
    endIso: string,
  ): LeaveBalancePreview =>
    computeLeavePreview(balances, type, startIso, endIso),

  create: (payload: CreateLeaveRequest): Promise<LeaveRequest> =>
    http
      .post<LeaveRequestApiShape>('/leaves', payload)
      .then((r) => normalizeLeaveRequest(r.data)),

  cancel: (id: string): Promise<LeaveRequest> =>
    http
      .post<LeaveRequestApiShape>(`/leaves/cancelleave/${id}`)
      .then((r) => normalizeLeaveRequest(r.data)),

  approve: (id: string): Promise<LeaveRequest> =>
    http
      .put<LeaveRequestApiShape>(`/leaves/${id}/status`, { status: 'Approved' })
      .then((r) => normalizeLeaveRequest(r.data)),

  reject: (id: string): Promise<LeaveRequest> =>
    http
      .put<LeaveRequestApiShape>(`/leaves/${id}/status`, { status: 'Rejected' })
      .then((r) => normalizeLeaveRequest(r.data)),
};

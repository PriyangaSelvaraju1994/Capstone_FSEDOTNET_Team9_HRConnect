import leavesData from './leaves.json';
import employeesData from './employees.json';
import type {
  CreateLeaveRequest,
  LeaveBalance,
  LeaveBalancePreview,
  LeaveListParams,
  LeaveListResult,
  LeaveRequest,
  LeaveStatusFilter,
  LeaveType,
} from '../types/leave';
import type { Employee } from '../types/employee';
import { getInitials } from '../utils/user';

interface RawRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  days: number;
  startDate: string;
  endDate: string;
  status: LeaveRequest['status'];
  submittedAt: string;
  reason?: string;
}

interface Seed {
  balances: Record<string, LeaveBalance[]>;
  requests: RawRequest[];
}

const seed = leavesData as Seed;
const employees = (employeesData as { items: Employee[] }).items;

const employeeIndex = new Map<string, Employee>(
  employees.map((e) => [e.id, e]),
);

const DEFAULT_BALANCES: LeaveBalance[] = [
  { type: 'Annual', used: 0, total: 18 },
  { type: 'Sick', used: 0, total: 10 },
  { type: 'Personal', used: 0, total: 5 },
  { type: 'CompOff', used: 0, total: 2 },
];

let balances: Record<string, LeaveBalance[]> = structuredClone(seed.balances);
let requests: LeaveRequest[] = seed.requests.map(decorate);

function decorate(raw: RawRequest): LeaveRequest {
  const emp = employeeIndex.get(raw.employeeId);
  return {
    ...raw,
    employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
    employeeInitials: emp ? getInitials(emp.firstName, emp.lastName) : '··',
    employeeDesignation: emp?.designation,
    employeeDepartment: emp?.department,
  };
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Working-day diff (inclusive) — excludes Sat/Sun. Public holidays would
 * subtract here once the calendar API is wired up.
 */
export function countWorkingDays(startIso: string, endIso: string): number {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  if (end < start) return 0;
  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export class LeaveNotFoundError extends Error {
  constructor(public readonly id: string) {
    super(`Leave request ${id} not found`);
    this.name = 'LeaveNotFoundError';
  }
}

function getBalancesFor(employeeId: string): LeaveBalance[] {
  return balances[employeeId] ?? DEFAULT_BALANCES.map((b) => ({ ...b }));
}

export const mockLeaves = {
  async list(params: LeaveListParams = {}): Promise<LeaveListResult> {
    await sleep(350);
    const status: LeaveStatusFilter = params.status ?? 'All';
    let filtered = [...requests];
    if (params.employeeId) {
      filtered = filtered.filter((r) => r.employeeId === params.employeeId);
    }
    if (status !== 'All') {
      filtered = filtered.filter((r) => r.status === status);
    }
    filtered.sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.max(1, params.pageSize ?? 10);
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    return {
      items: structuredClone(items),
      total: filtered.length,
      page,
      pageSize,
    };
  },

  async getById(id: string): Promise<LeaveRequest> {
    await sleep(250);
    const found = requests.find((r) => r.id === id);
    if (!found) throw new LeaveNotFoundError(id);
    return structuredClone(found);
  },

  /** Oldest-first queue of pending requests for the S9 admin view. */
  async listPending(): Promise<LeaveRequest[]> {
    await sleep(350);
    const items = requests
      .filter((r) => r.status === 'Pending')
      .sort(
        (a, b) =>
          new Date(a.submittedAt).getTime() -
          new Date(b.submittedAt).getTime(),
      );
    return structuredClone(items);
  },

  async getPendingCount(): Promise<number> {
    await sleep(120);
    return requests.filter((r) => r.status === 'Pending').length;
  },

  async getBalances(employeeId: string): Promise<LeaveBalance[]> {
    await sleep(200);
    return structuredClone(getBalancesFor(employeeId));
  },

  /** Pure helper — runs synchronously inside the S5 form for live updates. */
  computePreview(
    employeeId: string,
    type: LeaveType,
    startIso: string,
    endIso: string,
  ): LeaveBalancePreview {
    const balanceList = getBalancesFor(employeeId);
    const bal =
      balanceList.find((b) => b.type === type) ??
      ({ type, used: 0, total: 0 } as LeaveBalance);
    const workingDays = countWorkingDays(startIso, endIso);
    const projectedUsed = Math.min(bal.total, bal.used + workingDays);
    return {
      workingDays,
      currentUsed: bal.used,
      currentTotal: bal.total,
      projectedUsed,
      projectedTotal: bal.total,
      sufficient: bal.used + workingDays <= bal.total,
    };
  },

  async create(payload: CreateLeaveRequest): Promise<LeaveRequest> {
    await sleep(500);
    const days = countWorkingDays(payload.startDate, payload.endDate);
    const id = `lr-${Date.now()}`;
    const raw: RawRequest = {
      id,
      employeeId: payload.employeeId,
      type: payload.type,
      days,
      startDate: payload.startDate,
      endDate: payload.endDate,
      status: 'Pending',
      submittedAt: new Date().toISOString(),
      reason: payload.reason,
    };
    const decorated = decorate(raw);
    requests = [decorated, ...requests];
    return structuredClone(decorated);
  },

  async cancel(id: string): Promise<LeaveRequest> {
    await sleep(350);
    const idx = requests.findIndex((r) => r.id === id);
    if (idx < 0) throw new LeaveNotFoundError(id);
    if (requests[idx].status !== 'Pending') {
      throw new Error('Only pending requests can be cancelled.');
    }
    const updated: LeaveRequest = { ...requests[idx], status: 'Cancelled' };
    requests = requests.map((r, i) => (i === idx ? updated : r));
    return structuredClone(updated);
  },

  async approve(id: string): Promise<LeaveRequest> {
    await sleep(400);
    return decide(id, 'Approved');
  },

  async reject(id: string): Promise<LeaveRequest> {
    await sleep(400);
    return decide(id, 'Rejected');
  },
};

function decide(
  id: string,
  status: 'Approved' | 'Rejected',
): LeaveRequest {
  const idx = requests.findIndex((r) => r.id === id);
  if (idx < 0) throw new LeaveNotFoundError(id);
  const current = requests[idx];
  if (current.status !== 'Pending') {
    throw new Error('Only pending requests can be decided.');
  }
  // On approval, deduct from the employee's balance.
  if (status === 'Approved') {
    const list = balances[current.employeeId] ?? DEFAULT_BALANCES.map((b) => ({ ...b }));
    balances = {
      ...balances,
      [current.employeeId]: list.map((b) =>
        b.type === current.type
          ? { ...b, used: Math.min(b.total, b.used + current.days) }
          : b,
      ),
    };
  }
  const updated: LeaveRequest = { ...current, status };
  requests = requests.map((r, i) => (i === idx ? updated : r));
  return structuredClone(updated);
}

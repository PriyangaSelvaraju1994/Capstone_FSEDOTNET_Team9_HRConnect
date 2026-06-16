import type {
  LeaveBalance,
  LeaveBalancePreview,
  LeaveType,
} from '../types/leave';

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

/**
 * Pure projection used by S5 (employee leave form) and S9 (admin queue
 * detail) to show "what your balance will look like after this request".
 *
 * Kept synchronous and pure — no server round-trip — so the inputs (current
 * balances + the in-progress dates) drive an instant UI update.
 */
export function computeLeavePreview(
  balances: LeaveBalance[],
  type: LeaveType,
  startIso: string,
  endIso: string,
): LeaveBalancePreview {
  const bal =
    balances.find((b) => b.leaveType === type) ??
    ({ leaveType: type, usedDays: 0, totalDays: 0, remainingDays: 0 } as LeaveBalance);
  const workingDays = countWorkingDays(startIso, endIso);
  const projectedUsed = Math.min(bal.totalDays, bal.usedDays + workingDays);
  return {
    workingDays,
    currentUsed: bal.usedDays,
    currentTotal: bal.totalDays,
    projectedUsed,
    projectedTotal: bal.totalDays,
    sufficient: bal.usedDays + workingDays <= bal.totalDays,
  };
}

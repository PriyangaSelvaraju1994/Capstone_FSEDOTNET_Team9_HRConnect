import type { LeaveBalance } from '../types/leave';
import { getLeaveTypeMeta } from './leaveTypeMeta';

interface Props {
  balance: LeaveBalance;
}

/**
 * Leave-balance summary card: icon + type, "remaining / total days", and a
 * progress bar showing remaining capacity. Used on the employee dashboard
 * and (later) the My Leaves page header.
 */
export function LeaveBalanceCard({ balance }: Props) {
  const meta = getLeaveTypeMeta(balance.type);
  const Icon = meta.Icon;
  const remaining = Math.max(0, balance.total - balance.used);
  const pct = balance.total === 0 ? 0 : Math.round((remaining / balance.total) * 100);
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className={`flex items-center gap-2 mb-2 ${meta.accent}`}>
        <Icon className="w-4 h-4" aria-hidden="true" />
        <span className="text-sm font-medium">{meta.label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold">{remaining}</span>
        <span className="text-sm text-slate-500">/ {balance.total} days</span>
      </div>
      <div
        className="mt-2 h-1.5 bg-slate-100 rounded"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={balance.total}
        aria-valuenow={remaining}
        aria-label={`${meta.label} leave remaining`}
      >
        <div className={`h-1.5 rounded ${meta.bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function LeaveBalanceCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 animate-pulse">
      <div className="h-4 w-16 bg-slate-200 rounded mb-3" />
      <div className="h-7 w-20 bg-slate-200 rounded mb-2" />
      <div className="h-1.5 bg-slate-100 rounded" />
    </div>
  );
}

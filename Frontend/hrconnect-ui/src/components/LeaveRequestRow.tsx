import type { LeaveRequest } from '../types/leave';
import { formatDateRange } from '../utils/formatDate';
import { pluralize } from '../utils/format';
import { StatusBadge } from './StatusBadge';
import { getLeaveTypeMeta } from './leaveTypeMeta';

interface Props {
  request: LeaveRequest;
  /** When true, prefixes the title with the employee name (used in HR/admin lists). */
  showEmployeeName?: boolean;
}

/**
 * Row in a leave-request list: type icon + label + day count + date range +
 * status pill. Used on the employee dashboard recent-requests list and
 * (later) the full My Leaves table and admin queue.
 */
export function LeaveRequestRow({ request, showEmployeeName = false }: Props) {
  const meta = getLeaveTypeMeta(request.type);
  const Icon = meta.Icon;
  return (
    <li className="px-5 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${meta.text}`} aria-hidden="true" />
        <div>
          <div className="text-sm font-medium">
            {showEmployeeName && (
              <>
                <span>{request.employeeName}</span>
                <span className="text-slate-400"> · </span>
              </>
            )}
            {meta.label} · {request.days} {pluralize(request.days, 'day')}
          </div>
          <div className="text-xs text-slate-500">
            {formatDateRange(request.startDate, request.endDate)}
          </div>
        </div>
      </div>
      <StatusBadge status={request.status} />
    </li>
  );
}

export function LeaveRequestRowSkeleton() {
  return (
    <li className="px-5 py-3 flex items-center justify-between animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 bg-slate-200 rounded" />
        <div>
          <div className="h-4 w-32 bg-slate-200 rounded mb-1" />
          <div className="h-3 w-40 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="h-5 w-20 bg-slate-100 rounded-full" />
    </li>
  );
}

import { useEffect } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import type { LeaveBalancePreview, LeaveRequest } from '../types/leave';
import { calculateLeaveDays, formatDateRange } from '../utils/formatDate';
import { getAvatarClassName } from '../utils/avatarColor';
import { Avatar } from './Avatar';
import { BalancePreviewCard } from './BalancePreviewCard';
import { getLeaveTypeMeta } from './leaveTypeMeta';
import { StatusBadge } from './StatusBadge';
import { getInitials } from '../utils/user';

interface Props {
  request: LeaveRequest;
  preview: LeaveBalancePreview;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  /** Disables action buttons + spins the relevant one. */
  busy?: 'approve' | 'reject' | null;
}

/**
 * Right-hand slide-over for the S9 admin queue. Renders inline (not
 * `<dialog>`) because the wireframe shows it pinned beside the table on
 * desktop. Provides Esc-to-close.
 */
export function LeaveDetailPanel({
  request,
  preview,
  onClose,
  onApprove,
  onReject,
  busy = null,
}: Props) {
  const meta = getLeaveTypeMeta(request.leaveType);
  const TypeIcon = meta.Icon;
  const isPending = request.status === 'Pending';
  
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const initials = getInitials(request.employeeName ?? '', '') || '··';

  return (
    <aside
      role="dialog"
      aria-label="Leave request details"
      className="bg-white border border-slate-200 rounded-lg shadow-lg flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <h2 className="font-semibold">Request details</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details panel"
          className="p-1.5 rounded hover:bg-slate-100"
        >
          <X className="w-4 h-4 text-slate-500" aria-hidden="true" />
        </button>
      </div>

      <div className="p-5 flex-1 overflow-y-auto">
        <div className="flex items-center gap-3 mb-5">
          <Avatar
            initials={initials}
            size={12}
            className={getAvatarClassName(initials)}
          />
          <div>
            <div className="font-semibold">{request.employeeName}</div>
            <div className="text-xs text-slate-500">
              {request.designation ?? '—'}
              {request.department ? ` · ${request.department}` : ''}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3 rounded-md border border-slate-200">
            <div className="text-xs text-slate-500">Type</div>
            <div className="text-sm font-medium flex items-center gap-1.5 mt-1">
              <TypeIcon
                className={`w-4 h-4 ${meta.text}`}
                aria-hidden="true"
              />{' '}
              {meta.label}
            </div>
          </div>
          <div className="p-3 rounded-md border border-slate-200">
            <div className="text-xs text-slate-500">Working days</div>
            <div className="text-sm font-medium mt-1">
              {calculateLeaveDays(request.startDate, request.endDate)}
            </div>
          </div>
          <div className="p-3 rounded-md border border-slate-200 col-span-2">
            <div className="text-xs text-slate-500">Dates</div>
            <div className="text-sm font-medium mt-1">
              {formatDateRange(request.startDate, request.endDate)}
            </div>
          </div>
          <div className="p-3 rounded-md border border-slate-200 col-span-2">
            <div className="text-xs text-slate-500">Status</div>
            <div className="mt-1 mb-2">
              <StatusBadge status={request.status} />
            </div>
            <p className="text-sm text-slate-600">
              Auto approved: {request.isAutoApproved ? 'Yes' : 'No'}
            </p>
          </div>
        </div>

        <div className="mb-5">
          <BalancePreviewCard preview={preview} compact />
        </div>

        {request.reason && (
          <div className="mb-5">
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1.5">
              Reason
            </div>
            <p className="text-sm text-slate-700 p-3 rounded-md bg-slate-50 border border-slate-200">
              {request.reason}
            </p>
          </div>
        )}
      </div>

      {isPending && (
        <div className="p-4 border-t border-slate-200 flex items-center gap-2">
          <button
            type="button"
            onClick={onReject}
            disabled={busy !== null}
            className="px-3 py-2 text-sm font-medium text-rose-600 border border-rose-200 rounded-md hover:bg-rose-50 inline-flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy === 'reject' ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <X className="w-4 h-4" aria-hidden="true" />
            )}
            Reject
          </button>
          <button
            type="button"
            onClick={onApprove}
            disabled={busy !== null}
            className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md inline-flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy === 'approve' ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="w-4 h-4" aria-hidden="true" />
            )}
            Approve
          </button>
        </div>
      )}
    </aside>
  );
}

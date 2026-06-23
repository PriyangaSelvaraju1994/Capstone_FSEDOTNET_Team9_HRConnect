import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, Plus, XCircle } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { EmptyState } from '../../components/EmptyState';
import { FilterChip } from '../../components/FilterChip';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../components/ToastProvider';
import { getLeaveTypeMeta } from '../../components/leaveTypeMeta';
import { useAuth } from '../../hooks/useAuth';
import { useMyLeaves } from '../../hooks/useMyLeaves';
import { LEAVE_STATUS_FILTERS, type LeaveRequest } from '../../types/leave';
import { range } from '../../utils/array';
import { calculateLeaveDays, formatDateRange } from '../../utils/formatDate';

export default function MyLeavesPage() {
  const [cancelTarget, setCancelTarget] = useState<LeaveRequest | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const state = location.state as { message?: string } | null;
    if (!state?.message) return;

    toast.success(state.message);
    navigate(location.pathname + location.search, { replace: true });
  }, [location.pathname, location.search, location.state, navigate, toast]);

  const { user } = useAuth();
  const userId = user?.id ?? 0;

  const {
    leaves,
    totalCount,
    loading,
    error,
    mutation,
    cancellingId,
    status,
    changeStatus,
    page,
    pageSize,
    setPage,
    handleCancel,
  } = useMyLeaves({ userId });

  useEffect(() => {
    if (error) toast.error(error);
  }, [error, toast]);

  useEffect(() => {
    if (mutation.status === 'failed' && mutation.error) {
      toast.error(mutation.error);
    }
  }, [mutation.status, mutation.error, toast]);

  const isCancellingTarget =
    cancelTarget !== null && cancellingId === cancelTarget.id;

  return (
    <AppShell>
      <PageHeader
        title="My leaves"
        description="All your requests in one place."
        action={
          <Link
            to="/leaves/new"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-4 rounded-md"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            New request
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sm text-slate-500 mr-1">Show:</span>
        {LEAVE_STATUS_FILTERS.map((f) => (
          <FilterChip
            key={f}
            label={f}
            active={status === f}
            onClick={() => changeStatus(f)}
          />
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {loading ? (
          <SkeletonTable />
        ) : leaves.length === 0 ? (
          <div className="p-2">
            <EmptyState
              Icon={CalendarDays}
              title="No leave requests"
              description={
                status === 'All'
                  ? "You haven't submitted any requests yet."
                  : `You have no ${status.toLowerCase()} requests.`
              }
              action={
                <Link
                  to="/leaves/new"
                  className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 px-4 rounded-md"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  New request
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5">Type</th>
                  <th className="text-left font-medium px-5 py-2.5">Dates</th>
                  <th className="text-left font-medium px-5 py-2.5">Days</th>
                  <th className="text-left font-medium px-5 py-2.5">Status</th>
                  <th className="text-right font-medium px-5 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.map((req) => {
                  const meta = getLeaveTypeMeta(req.leaveType);
                  const TypeIcon = meta.Icon;                 
                  return (
                    <tr key={req.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5">
                          <TypeIcon
                            className={`w-4 h-4 ${meta.text}`}
                            aria-hidden="true"
                          />{' '}
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {formatDateRange(req.startDate, req.endDate)}
                      </td>
                      <td className="px-5 py-3">{calculateLeaveDays(req.startDate, req.endDate)}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={req.status} />
                      </td>
                     
                      <td className="px-5 py-3 text-right">
                        {req.status === 'Pending' ? (
                          <button
                            type="button"
                            onClick={() => setCancelTarget(req)}
                            disabled={cancellingId === req.id}
                            className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 text-xs font-medium disabled:opacity-60"
                          >
                            <XCircle
                              className="w-3.5 h-3.5"
                              aria-hidden="true"
                            />{' '}
                            {cancellingId === req.id ? 'Cancelling…' : 'Cancel'}
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination
              page={page}
              total={totalCount}
              pageSize={pageSize}
              onPageChange={setPage}
              itemLabel="requests"
            />
          </>
        )}
      </div>

      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-leave-title"
        >
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => {
              if (!isCancellingTarget) setCancelTarget(null);
            }}
          />
          <div className="relative w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <h2 id="cancel-leave-title" className="text-lg font-semibold text-slate-900">
              Cancel leave request?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              This will cancel your {cancelTarget.leaveType} leave request for{' '}
              {formatDateRange(cancelTarget.startDate, cancelTarget.endDate)}.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                disabled={isCancellingTarget}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md disabled:opacity-60"
              >
                Keep request
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleCancel(cancelTarget);
                  setCancelTarget(null);
                }}
                disabled={isCancellingTarget}
                className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-60"
              >
                <XCircle className="w-4 h-4" aria-hidden="true" />
                {isCancellingTarget ? 'Cancelling...' : 'Confirm cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function SkeletonTable() {
  return (
    <div className="divide-y divide-slate-100 animate-pulse">
      {range(4).map((i) => (
        <div key={i} className="px-5 py-3 flex items-center gap-3">
          <div className="h-4 w-20 bg-slate-200 rounded" />
          <div className="h-4 w-32 bg-slate-100 rounded" />
          <div className="h-4 w-6 bg-slate-100 rounded ml-auto" />
          <div className="h-5 w-20 bg-slate-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}

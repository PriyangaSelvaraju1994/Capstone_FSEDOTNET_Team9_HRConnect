import { Link } from 'react-router-dom';
import { CalendarDays, Plus, XCircle } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { FilterChip } from '../../components/FilterChip';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { StatusBadge } from '../../components/StatusBadge';
import { getLeaveTypeMeta } from '../../components/leaveTypeMeta';
import { useAuth } from '../../hooks/useAuth';
import { useMyLeaves } from '../../hooks/useMyLeaves';
import { LEAVE_STATUS_FILTERS } from '../../types/leave';
import { range } from '../../utils/array';
import { formatDate, formatDateRange } from '../../utils/formatDate';

export default function MyLeavesPage() {
  const { user } = useAuth();
  const userId = user?.id ?? '';

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
    refetch,
    handleCancel,
  } = useMyLeaves({ userId });

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

      {error && (
        <div className="mb-4">
          <ErrorBanner
            message="We couldn't load your leaves. Please try again."
            onRetry={refetch}
          />
        </div>
      )}

      {mutation.status === 'failed' && mutation.error && (
        <div className="mb-4">
          <ErrorBanner message={mutation.error} />
        </div>
      )}

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
                  <th className="text-left font-medium px-5 py-2.5">Submitted</th>
                  <th className="text-right font-medium px-5 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.map((req) => {
                  const meta = getLeaveTypeMeta(req.type);
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
                      <td className="px-5 py-3">{req.days}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {formatDate(req.submittedAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {req.status === 'Pending' ? (
                          <button
                            type="button"
                            onClick={() => handleCancel(req)}
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

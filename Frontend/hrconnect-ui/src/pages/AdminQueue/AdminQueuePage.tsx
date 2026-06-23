import { useEffect, useMemo, useState } from 'react';
import { Inbox } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { FilterChip } from '../../components/FilterChip';
import { LeaveDetailPanel } from '../../components/LeaveDetailPanel';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { useToast } from '../../components/ToastProvider';
import { getLeaveTypeMeta } from '../../components/leaveTypeMeta';
import { useAdminQueue } from '../../hooks/useAdminQueue';
import { usePagination } from '../../hooks/usePagination';
import { range } from '../../utils/array';
import { getAvatarClassName } from '../../utils/avatarColor';
import { calculateLeaveDays, formatDateRange, formatRelative } from '../../utils/formatDate';
import { LEAVE_STATUS_FILTERS, type LeaveStatusFilter } from '../../types/leave';
import { getInitials } from '../../utils/user';
import { StatusBadge } from '../../components/StatusBadge';

export default function AdminQueuePage() {
  const toast = useToast();
  const {
    requests,
    loading,
    error,
    mutation,
    selectedId,
    setSelectedId,
    selected,
    preview,
    busy,
    successMessage,
    handleApprove,
    handleReject,
  } = useAdminQueue();

  const [status, setStatus] = useState<LeaveStatusFilter>('Pending');
  const { page, pageSize, setPage, resetPage } = usePagination({ pageSize: 8 });
  const filteredRequests = useMemo(
    () =>
      status === 'All'
        ? requests
        : requests.filter((request) => request.status === status),
    [requests, status],
  );
  const pagedRequests = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, page, pageSize]);
  const total = filteredRequests.length;
  const selectedVisible =
    selected && pagedRequests.some((request) => request.id === selected.id);

  useEffect(() => {
    resetPage();
  }, [status, resetPage]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, pageSize, setPage, total]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error, toast]);

  useEffect(() => {
    if (mutation.status === 'failed' && mutation.error) {
      toast.error(mutation.error);
    }
  }, [mutation.status, mutation.error, toast]);

  useEffect(() => {
    if (successMessage === 'approved') {
      toast.success('Request approved successfully.');
    }
    if (successMessage === 'rejected') {
      toast.warning('Request rejected successfully.');
    }
  }, [successMessage, toast]);

  const handleRowClick = (requestId: string) => {
    setSelectedId((current) => (current === requestId ? null : requestId));
  };

  return (
    <AppShell>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Inbox
              className="w-6 h-6 text-brand-600"
              aria-hidden="true"
            />{' '}
            Leave queue
          </span>
        }
        description={
          loading
            ? 'Loading requests…'
            : `${total} ${status.toLowerCase() === 'all' ? '' : status.toLowerCase() + ' '}request${total === 1 ? '' : 's'}`
        }
        action={
          <></>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sm text-slate-500 mr-1">Show:</span>
        {LEAVE_STATUS_FILTERS.map((filter) => (
          <FilterChip
            key={filter}
            label={filter}
            active={status === filter}
            onClick={() => setStatus(filter)}
          />
        ))}
      </div>

      <div className="relative">
        <div
          className={`bg-white border border-slate-200 rounded-lg overflow-hidden ${selectedVisible ? 'lg:mr-[420px]' : ''
            }`}
        >
          {loading ? (
            <SkeletonRows />
          ) : filteredRequests.length === 0 ? (
            <div className="p-2">
              <EmptyState
                Icon={Inbox}
                title="No leave requests"
                description={
                  status === 'All'
                    ? 'No requests are waiting for review. Great work.'
                    : `No ${status.toLowerCase()} requests in this queue.`
                }
              />
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="text-left font-medium px-5 py-2.5">
                      Employee
                    </th>
                    <th className="text-left font-medium px-5 py-2.5">Type</th>
                    <th className="text-left font-medium px-5 py-2.5">Dates</th>
                    <th className="text-left font-medium px-5 py-2.5">Days</th>
                    <th className="text-left font-medium px-5 py-2.5">
                      Submitted
                    </th>
                    <th className="text-left font-medium px-5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedRequests.map((req) => {
                    const meta = getLeaveTypeMeta(req.leaveType);
                    const Icon = meta.Icon;
                    const isSelected = req.id === selectedId;
                    const initials = getInitials(req.employeeName ?? '', '') || '··';
                    return (
                      <tr
                        key={req.id}
                        onClick={() => handleRowClick(req.id)}
                        aria-selected={isSelected}
                        className={`cursor-pointer ${isSelected ? 'bg-brand-50' : 'hover:bg-slate-50'
                          }`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar
                              initials={initials}
                              size={7}
                              className={getAvatarClassName(
                                initials,
                              )}
                            />
                            <span className="font-medium">
                              {req.employeeName}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5">
                            <Icon
                              className={`w-4 h-4 ${meta.text}`}
                              aria-hidden="true"
                            />{' '}
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-700">
                          {formatDateRange(req.startDate, req.endDate)}
                        </td>
                        <td className="px-5 py-3">
                          {calculateLeaveDays(req.startDate, req.endDate)}
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {formatRelative(req.createdAt)}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={req.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Pagination
                page={page}
                total={total}
                pageSize={pageSize}
                onPageChange={setPage}
                itemLabel="requests"
              />
            </>
          )}
        </div>

        {selectedVisible && preview && (
          <div className="hidden lg:block absolute top-0 right-0 w-[400px]">
            <LeaveDetailPanel
              request={selected}
              preview={preview}
              onClose={() => setSelectedId(null)}
              onApprove={handleApprove}
              onReject={handleReject}
              busy={busy}
              successMessage={successMessage}
            />
          </div>
        )}
      </div>

      {filteredRequests.length > 0 && (
        <p className="text-xs text-slate-500 mt-4">
          After approve/reject, the panel auto-advances to the next request.
          Click the selected row again to close.
        </p>
      )}
    </AppShell>
  );
}

function SkeletonRows() {
  return (
    <div className="divide-y divide-slate-100 animate-pulse">
      {range(5).map((i) => (
        <div key={i} className="px-5 py-3 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-slate-200" />
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-4 w-20 bg-slate-100 rounded ml-auto" />
          <div className="h-4 w-24 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  );
}


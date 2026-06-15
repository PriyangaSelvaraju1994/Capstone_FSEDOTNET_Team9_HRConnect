import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LeaveDetailPanel } from '../../components/LeaveDetailPanel';
import { PageHeader } from '../../components/PageHeader';
import { getLeaveTypeMeta } from '../../components/leaveTypeMeta';
import { useAdminQueue } from '../../hooks/useAdminQueue';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { range } from '../../utils/array';
import { getAvatarClassName } from '../../utils/avatarColor';
import { formatDateRange, formatRelative } from '../../utils/formatDate';

export default function AdminQueuePage() {
  const {
    requests,
    loading,
    error,
    mutation,
    selectedId,
    setSelectedId,
    selected,
    preview,
    selectNext,
    selectPrev,
    busy,
    handleApprove,
    handleReject,
    refetch,
  } = useAdminQueue();

  // Keyboard shortcuts: J/K for navigation, A for approve, R for reject, Esc to deselect
  useKeyboardShortcuts({
    shortcuts: [
      { key: 'j', handler: selectNext },
      { key: 'k', handler: selectPrev },
      { key: 'a', handler: handleApprove },
      { key: 'r', handler: handleReject },
      { key: 'Escape', handler: () => setSelectedId(null) },
    ],
    enabled: requests.length > 0 && !busy,
  });

  const total = requests.length;

  return (
    <AppShell pendingCount={total}>
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
            ? 'Loading pending requests…'
            : `${total} pending request${total === 1 ? '' : 's'} · oldest first`
        }
        action={
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
            <Kbd>J</Kbd>
            <span>/</span>
            <Kbd>K</Kbd>
            <span>navigate ·</span>
            <Kbd>A</Kbd>
            <span>approve ·</span>
            <Kbd>R</Kbd>
            <span>reject</span>
          </div>
        }
      />

      {error && (
        <div className="mb-4">
          <ErrorBanner
            message="We couldn't load the queue. Please try again."
            onRetry={refetch}
          />
        </div>
      )}

      {mutation.status === 'failed' && mutation.error && (
        <div className="mb-4">
          <ErrorBanner message={mutation.error} />
        </div>
      )}

      <div className="relative">
        <div
          className={`bg-white border border-slate-200 rounded-lg overflow-hidden ${
            selected ? 'lg:mr-[420px]' : ''
          }`}
        >
          {loading ? (
            <SkeletonRows />
          ) : requests.length === 0 ? (
            <div className="p-2">
              <EmptyState
                Icon={Inbox}
                title="Inbox zero"
                description="No requests are waiting for review. Great work."
              />
            </div>
          ) : (
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => {
                  const meta = getLeaveTypeMeta(req.leaveType);
                  const Icon = meta.Icon;
                  const isSelected = req.id === selectedId;
                  return (
                    <tr
                      key={req.id}
                      onClick={() => setSelectedId(req.id)}
                      aria-selected={isSelected}
                      className={`cursor-pointer ${
                        isSelected ? 'bg-brand-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar
                            initials={req.employeeInitials}
                            size={7}
                            className={getAvatarClassName(
                              req.employeeInitials,
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
                      <td className="px-5 py-3">{req.days}</td>
                      <td className="px-5 py-3 text-slate-500">
                        {formatRelative(req.submittedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {selected && preview && (
          <div className="hidden lg:block absolute top-0 right-0 w-[400px]">
            <LeaveDetailPanel
              request={selected}
              preview={preview}
              onClose={() => setSelectedId(null)}
              onApprove={handleApprove}
              onReject={handleReject}
              busy={busy}
            />
          </div>
        )}
      </div>

      {requests.length > 0 && (
        <p className="text-xs text-slate-500 mt-4">
          After approve/reject, the panel auto-advances to the next request.
          Press <Kbd>Esc</Kbd> to close.
        </p>
      )}
    </AppShell>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="px-1.5 py-0.5 text-xs bg-slate-200 rounded font-mono">
      {children}
    </kbd>
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


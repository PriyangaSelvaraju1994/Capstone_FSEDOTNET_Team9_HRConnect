import { Navigate, useParams } from 'react-router-dom';
import { Briefcase, Building, Loader2, Mail, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import { Avatar } from '../../components/Avatar';
import { Breadcrumb } from '../../components/Breadcrumb';
import { ErrorBanner } from '../../components/ErrorBanner';
import { SectionCard } from '../../components/SectionCard';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusBadge } from '../../components/StatusBadge';
import { getLeaveTypeMeta } from '../../components/leaveTypeMeta';
import { useEmployeeDetail } from '../../hooks/useEmployeeDetail';
import { range } from '../../utils/array';
import { getAvatarClassName } from '../../utils/avatarColor';
import { formatDate, formatDateRange } from '../../utils/formatDate';
import { getInitials } from '../../utils/user';

const HISTORY_PAGE_SIZE = 10;

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    employee: emp,
    empLoading,
    empError,
    isNotFound,
    deleting,
    balances,
    balancesLoading,
    history,
    historyLoading,
    pendingCount,
    refetch,
    handleDelete,
  } = useEmployeeDetail({ employeeId: Number(id), historyPageSize: HISTORY_PAGE_SIZE });

  if (!id) return <Navigate to="/employees" replace />;
  if (isNotFound) return <Navigate to="/404" replace />;

  return (
    <AppShell pendingCount={pendingCount ?? undefined}>
      <Breadcrumb
        items={[
          { label: 'Employees', to: '/employees' },
          { label: emp ? emp.fullName : 'Loading…' },
        ]}
      />

      {empError && (
        <div className="mb-4">
          <ErrorBanner
            message="We couldn't load this employee. Please try again."
            onRetry={refetch}
          />
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
        {empLoading || !emp ? (
          <div className="animate-pulse flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-40 bg-slate-200 rounded" />
              <div className="h-4 w-64 bg-slate-100 rounded" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar
                initials={getInitials(emp.fullName ?? '', '') || '··'}
                size={12}
                className={getAvatarClassName(
                  getInitials(emp.fullName ?? '', '') || '··',
                )}
              />
              <div>
                <h1 className="text-xl font-semibold">
                  {emp.fullName}
                </h1>
                <p className="text-slate-600 text-sm flex items-center gap-3 mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />{' '}
                    {emp.designation}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" aria-hidden="true" />{' '}
                    {emp.department}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" aria-hidden="true" />{' '}
                    {emp.email}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={`/employees/${emp.id}/edit`}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-slate-300 rounded-md hover:bg-slate-50"
              >
                <Pencil className="w-4 h-4" aria-hidden="true" /> Edit
              </Link>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 border border-rose-200 rounded-md hover:bg-rose-50 disabled:opacity-60"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                )}{' '}
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <SectionHeading>Leave balances</SectionHeading>
            {balancesLoading || !balances ? (
              <ul className="space-y-3 animate-pulse">
                {range(4).map((i) => (
                  <li key={i} className="flex items-center justify-between">
                    <div className="h-4 w-20 bg-slate-200 rounded" />
                    <div className="h-4 w-12 bg-slate-100 rounded" />
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-3">
                {balances.map((b) => {
                  const meta = getLeaveTypeMeta(b.leaveType);
                  const Icon = meta.Icon;
                  const remaining = Math.max(0, b.totalDays - b.usedDays);
                  return (
                    <li
                      key={b.leaveType}
                      className="flex items-center justify-between"
                    >
                      <span className="inline-flex items-center gap-2 text-sm">
                        <Icon
                          className={`w-4 h-4 ${meta.text}`}
                          aria-hidden="true"
                        />{' '}
                        {meta.label}
                      </span>
                      <span className="text-sm font-semibold">
                        {remaining} / {b.totalDays}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {emp && (
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <SectionHeading>Employment</SectionHeading>
              <dl className="space-y-2 text-sm">
                <Row label="Employee ID" value={`EM${emp.id.toString()}`} />
                <Row label="Joined" value={formatDate(emp.joiningDate)} />
                {emp.managerName && (
                  <Row label="Manager" value={emp.managerName} />
                )}
                <Row label="Designation" value={emp.designation} />
              </dl>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <SectionCard title="Leave history">
            {historyLoading ? (
              <ul className="divide-y divide-slate-100">
                {range(3).map((i) => (
                  <li
                    key={i}
                    className="px-5 py-3 flex items-center gap-3 animate-pulse"
                  >
                    <div className="h-4 w-20 bg-slate-200 rounded" />
                    <div className="h-4 w-32 bg-slate-100 rounded" />
                    <div className="h-5 w-20 bg-slate-100 rounded-full ml-auto" />
                  </li>
                ))}
              </ul>
            ) : history.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No leave history yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="text-left font-medium px-5 py-2.5">Type</th>
                    <th className="text-left font-medium px-5 py-2.5">
                      Dates
                    </th>
                    <th className="text-left font-medium px-5 py-2.5">Days</th>
                    <th className="text-left font-medium px-5 py-2.5">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((req) => {
                    const meta = getLeaveTypeMeta(req.leaveType);
                    const Icon = meta.Icon;
                    return (
                      <tr key={req.id}>
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
                        <td className="px-5 py-3">
                          <StatusBadge status={req.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}

interface RowProps {
  label: string;
  value: string;
}

function Row({ label, value }: RowProps) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-600">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

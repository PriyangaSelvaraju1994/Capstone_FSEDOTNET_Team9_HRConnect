import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Plus, Sun, User as UserIcon } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import {
  LeaveBalanceCard,
  LeaveBalanceCardSkeleton,
} from '../../components/LeaveBalanceCard';
import {
  LeaveRequestRow,
  LeaveRequestRowSkeleton,
} from '../../components/LeaveRequestRow';
import { PageHeader } from '../../components/PageHeader';
import { QuickActionTile } from '../../components/QuickActionTile';
import { SectionCard } from '../../components/SectionCard';
import { SectionHeading } from '../../components/SectionHeading';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchEmployeeDashboard,
  selectEmployeeDashboard,
} from '../../store/slices/dashboardSlice';
import { range } from '../../utils/array';
import { getGreeting } from '../../utils/user';

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const dispatch = useAppDispatch();
  const slot = useAppSelector(selectEmployeeDashboard);
  const data = slot.data;
  const loading = slot.status === 'loading' && !data;
  const error = slot.status === 'failed' ? slot.error : null;

  useEffect(() => {
    if (userId) void dispatch(fetchEmployeeDashboard(userId));
  }, [dispatch, userId]);

  function refetch() {
    if (userId) void dispatch(fetchEmployeeDashboard(userId));
  }

  return (
    <AppShell>
      <PageHeader
        title={
          <span className="inline-flex items-center gap-3">
            <Sun className="w-7 h-7 text-amber-500" aria-hidden="true" />
            {getGreeting()}, {user?.firstName ?? 'there'}
          </span>
        }
      />

      {error && (
        <div className="mb-6">
          <ErrorBanner
            message="We couldn't load your dashboard. Please try again."
            onRetry={refetch}
          />
        </div>
      )}

      <section aria-labelledby="balances-heading" className="mb-8">
        <SectionHeading id="balances-heading" className="mb-3">
          Your leave balances
        </SectionHeading>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading || !data
            ? range(4).map((i) => <LeaveBalanceCardSkeleton key={i} />)
            : data.balances.map((b) => (
                <LeaveBalanceCard key={b.type} balance={b} />
              ))}
        </div>
      </section>

      <section aria-labelledby="quick-actions-heading" className="mb-8">
        <SectionHeading id="quick-actions-heading" className="mb-3">
          Quick actions
        </SectionHeading>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionTile
            to="/leaves/new"
            Icon={Plus}
            title="Request leave"
            description="Submit a new time-off request."
          />
          <QuickActionTile
            to="/my-leaves"
            Icon={CalendarDays}
            title="My leaves"
            description="See all your past requests."
          />
          <QuickActionTile
            to="/profile"
            Icon={UserIcon}
            title="Profile"
            description="Update your details."
          />
        </div>
      </section>

      <section aria-labelledby="recent-requests-heading">
        <SectionCard
          titleId="recent-requests-heading"
          title="Recent requests"
          headerAction={
            <Link
              to="/my-leaves"
              className="text-sm text-brand-600 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          }
        >
          {loading ? (
            <ul className="divide-y divide-slate-100">
              {range(3).map((i) => (
                <LeaveRequestRowSkeleton key={i} />
              ))}
            </ul>
          ) : !data || data.recentRequests.length === 0 ? (
            <EmptyState
              Icon={CalendarDays}
              title="No requests yet"
              description="Your past leave requests will show up here."
              action={
                <Link
                  to="/leaves/new"
                  className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 px-4 rounded-md"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Request leave
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentRequests.map((r) => (
                <LeaveRequestRow key={r.id} request={r} />
              ))}
            </ul>
          )}
        </SectionCard>
      </section>
    </AppShell>
  );
}

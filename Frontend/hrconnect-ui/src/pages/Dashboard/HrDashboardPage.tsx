import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Inbox,
  Search,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  ActivityListItem,
  ActivityListItemSkeleton,
} from '../../components/ActivityListItem';
import { AppShell } from '../../components/AppShell';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { KpiTile, KpiTileSkeleton } from '../../components/KpiTile';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { ShortcutLink } from '../../components/ShortcutLink';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchHrDashboard,
  fetchHrDashboardRecent,
  selectHrDashboard,
  selectHrDashboardRecent,
} from '../../store/slices/dashboardSlice';
import { range } from '../../utils/array';
import { formatLongDate } from '../../utils/formatDate';
import { HrDashboardSummary } from '@/types/leave';

export default function HrDashboardPage() {
  const dispatch = useAppDispatch();
  const slot = useAppSelector(selectHrDashboard);
  const recentSlot = useAppSelector(selectHrDashboardRecent);
  const data = slot.data;
  const recentData = recentSlot.data;
  const loading = slot.status === 'loading' && !data;
  const error = slot.status === 'failed' ? slot.error : null;

  useEffect(() => {
    void dispatch(fetchHrDashboard());
    void dispatch(fetchHrDashboardRecent());
  }, [dispatch]);

  function refetch() {
    void dispatch(fetchHrDashboard());
    void dispatch(fetchHrDashboardRecent());
  }

  const pendingCount = data?.pendingCount;

  return (
    <AppShell>
      <PageHeader
        title="HR overview"
        description={formatLongDate()}
        action={
          <Link
            to="/admin/queue"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-4 rounded-md"
          >
            <Inbox className="w-4 h-4" aria-hidden="true" />
            Open queue
            {typeof pendingCount === 'number' ? ` (${pendingCount})` : ''}
          </Link>
        }
      />

      {error && (
        <div className="mb-6">
          <ErrorBanner
            message="We couldn't load HR metrics. Please try again."
            onRetry={refetch}
          />
        </div>
      )}

      <section aria-labelledby="kpi-heading" className="mb-8">
        <h2 id="kpi-heading" className="sr-only">
          Key metrics
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading || !data ? (
            range(4).map((i) => <KpiTileSkeleton key={i} />)
          ) : (
            <KpiGrid summary={data} />
          )}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        <section aria-labelledby="activity-heading" className="lg:col-span-2">
          <SectionCard
            titleId="activity-heading"
            title="Recent activity"
            headerAction={
              <Link to="/admin/queue" className="text-sm text-brand-600 hover:underline">
                View queue →
              </Link>
            }
          >
            {loading ? (
              <ul className="divide-y divide-slate-100">
                {range(3).map((i) => (
                  <ActivityListItemSkeleton key={i} />
                ))}
              </ul>
            ) : !recentData || recentData.length === 0 ? (
              <EmptyState
                Icon={Inbox}
                title="No activity yet"
                description="New leave requests and approvals will appear here."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentData.map((a) => (
                  <ActivityListItem key={a.id} entry={a} />
                ))}
              </ul>
            )}
          </SectionCard>
        </section>

        <section aria-labelledby="shortcuts-heading" className="h-fit">
          <SectionCard padded>
            <h2 id="shortcuts-heading" className="font-semibold mb-3">
              Shortcuts
            </h2>
            <div className="space-y-2">
              <ShortcutLink to="/employees/new" Icon={UserPlus} label="Add employee" />
              <ShortcutLink to="/employees" Icon={Search} label="Search employees" />
              <ShortcutLink to="/admin/queue" Icon={Inbox} label="Review pending leaves" />
            </div>
          </SectionCard>
        </section>
      </div>
    </AppShell>
  );
}

interface KpiGridProps {
  summary: HrDashboardSummary;
}

function KpiGrid({ summary }: KpiGridProps) {
  return (
    <>
      <KpiTile
        to="/admin/queue"
        Icon={Clock}
        iconBg="bg-amber-100"
        iconText="text-amber-700"
        value={summary.pendingCount}
        label="Pending requests"
      />
      <KpiTile
        Icon={CheckCircle2}
        iconBg="bg-emerald-100"
        iconText="text-emerald-700"
        value={summary.approvedThisMonth}
        label="Approved this month"
      />
      <KpiTile
        to="/employees"
        Icon={Users}
        iconBg="bg-brand-100"
        iconText="text-brand-700"
        value={summary.activeEmployees}
        label="Active employees"
      />
      <KpiTile
        Icon={UserCheck}
        iconBg="bg-sky-100"
        iconText="text-sky-700"
        value={summary.onLeaveToday}
        label="On leave today"
      />
    </>
  );
}

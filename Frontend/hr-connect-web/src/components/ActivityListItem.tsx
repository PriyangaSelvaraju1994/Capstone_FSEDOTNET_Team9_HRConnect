import type { HrActivityEntry } from '../types/leave';
import { formatDateRange, formatRelative } from '../utils/formatDate';
import { pluralize } from '../utils/format';
import { Avatar } from './Avatar';
import { StatusBadge } from './StatusBadge';
import { getLeaveTypeMeta } from './leaveTypeMeta';

interface Props {
  entry: HrActivityEntry;
}

/**
 * One row in the HR "Recent activity" feed: actor avatar + verb-conjugated
 * sentence + timestamp + status pill.
 */
export function ActivityListItem({ entry }: Props) {
  const meta = getLeaveTypeMeta(entry.leaveType);
  return (
    <li className="px-5 py-3 flex items-center gap-3">
      <Avatar
        initials={entry.actorInitials}
        className={`${meta.bg} ${meta.accent}`}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm">
          <ActivitySentence entry={entry} />
        </div>
        <div className="text-xs text-slate-500">
          {formatRelative(entry.occurredAt)}
          {entry.startDate && entry.endDate && (
            <> · {formatDateRange(entry.startDate, entry.endDate)}</>
          )}
        </div>
      </div>
      <StatusBadge status={entry.status} />
    </li>
  );
}

export function ActivityListItemSkeleton() {
  return (
    <li className="px-5 py-3 flex items-center gap-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-slate-200" />
      <div className="flex-1">
        <div className="h-4 w-60 bg-slate-200 rounded mb-1" />
        <div className="h-3 w-40 bg-slate-100 rounded" />
      </div>
      <div className="h-5 w-20 bg-slate-100 rounded-full" />
    </li>
  );
}

function ActivitySentence({ entry }: { entry: HrActivityEntry }) {
  const meta = getLeaveTypeMeta(entry.leaveType);
  const daysWord = pluralize(entry.days, 'day');
  if (entry.action === 'requested') {
    return (
      <>
        <span className="font-medium">{entry.actorName}</span> requested {entry.days} {daysWord} of{' '}
        {meta.label}
      </>
    );
  }
  const verb = entry.action === 'approved' ? 'approved' : 'rejected';
  if (entry.byMe) {
    return (
      <>
        You {verb} <span className="font-medium">{entry.actorName}</span>'s {meta.label} leave
      </>
    );
  }
  return (
    <>
      <span className="font-medium">{entry.actorName}</span>'s {meta.label} leave was {verb}
    </>
  );
}

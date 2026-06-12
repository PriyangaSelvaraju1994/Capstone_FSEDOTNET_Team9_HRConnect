import { Ban, Check, Clock, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { LeaveStatus } from '../types/leave';

interface StatusStyle {
  bg: string;
  text: string;
  Icon: LucideIcon;
  label: string;
}

const STYLES: Record<LeaveStatus, StatusStyle> = {
  Pending: { bg: 'bg-amber-100', text: 'text-amber-800', Icon: Clock, label: 'Pending' },
  Approved: { bg: 'bg-emerald-100', text: 'text-emerald-800', Icon: Check, label: 'Approved' },
  Rejected: { bg: 'bg-rose-100', text: 'text-rose-800', Icon: X, label: 'Rejected' },
  Cancelled: { bg: 'bg-slate-100', text: 'text-slate-600', Icon: Ban, label: 'Cancelled' },
};

interface Props {
  status: LeaveStatus;
}

export function StatusBadge({ status }: Props) {
  const s = STYLES[status];
  const I = s.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}
    >
      <I className="w-3 h-3" aria-hidden="true" />
      {s.label}
    </span>
  );
}

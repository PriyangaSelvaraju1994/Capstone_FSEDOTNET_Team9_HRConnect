import { pluralize } from './format';
import { countWorkingDays } from './leavePreview';

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateRange(startIso: string, endIso: string): string {
  if (startIso === endIso) return formatDate(startIso);
  const s = new Date(startIso);
  const e = new Date(endIso);
  const sMonth = s.toLocaleDateString('en-US', { month: 'short' });
  const eMonth = e.toLocaleDateString('en-US', { month: 'short' });
  const year = e.getFullYear();
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${sMonth} ${s.getDate()} – ${e.getDate()}, ${year}`;
  }
  if (s.getFullYear() === e.getFullYear()) {
    return `${sMonth} ${s.getDate()} – ${eMonth} ${e.getDate()}, ${year}`;
  }
  return `${formatDate(startIso)} – ${formatDate(endIso)}`;
}

export function formatRelative(iso: string, now: Date = new Date()): string {
  const past = new Date(iso).getTime();
  const diff = Math.max(0, now.getTime() - past);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ${pluralize(h, 'h')} ago`;
  const d = Math.floor(h / 24);
  return `${d} ${pluralize(d, 'day')} ago`;
}

/** "Tuesday, 8 June 2026" — matches the S3a wireframe sub-header. */
export function formatLongDate(d: Date = new Date()): string {
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function calculateLeaveDays(startDate: string, endDate: string): number {
  return countWorkingDays(startDate, endDate);
}
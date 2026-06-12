import type { LucideIcon } from 'lucide-react';
import { Baby, Briefcase, Palmtree, Thermometer } from 'lucide-react';
import type { LeaveType } from '../types/leave';

interface LeaveTypeMeta {
  Icon: LucideIcon;
  /** icon foreground colour for inline usage */
  text: string;
  /** soft background tint for icon chips */
  bg: string;
  /** solid colour for progress bars */
  bar: string;
  /** label-row foreground (slightly darker than `text`) */
  accent: string;
  label: string;
}

const META: Record<LeaveType, LeaveTypeMeta> = {
  Annual: {
    Icon: Palmtree,
    text: 'text-emerald-600',
    bg: 'bg-emerald-100',
    bar: 'bg-emerald-500',
    accent: 'text-emerald-700',
    label: 'Annual',
  },
  Sick: {
    Icon: Thermometer,
    text: 'text-sky-600',
    bg: 'bg-sky-100',
    bar: 'bg-sky-500',
    accent: 'text-sky-700',
    label: 'Sick',
  },
  Personal: {
    Icon: Baby,
    text: 'text-violet-600',
    bg: 'bg-violet-100',
    bar: 'bg-violet-500',
    accent: 'text-violet-700',
    label: 'Personal',
  },
  CompOff: {
    Icon: Briefcase,
    text: 'text-amber-600',
    bg: 'bg-amber-100',
    bar: 'bg-amber-500',
    accent: 'text-amber-700',
    label: 'Comp-off',
  },
};

export function getLeaveTypeMeta(type: LeaveType): LeaveTypeMeta {
  return META[type];
}

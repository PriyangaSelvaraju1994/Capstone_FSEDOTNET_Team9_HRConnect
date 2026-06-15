import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  /** When provided, the tile becomes a navigable Link with a trailing arrow. */
  to?: string;
  Icon: LucideIcon;
  /** Tailwind background colour for the icon chip, e.g. "bg-amber-100". */
  iconBg: string;
  /** Tailwind foreground colour for the icon, e.g. "text-amber-700". */
  iconText: string;
  /** Big numeric value, e.g. 7 or 142. */
  value: number | string;
  /** Sub-label, e.g. "Pending requests". */
  label: string;
}

const BASE = 'bg-white border border-slate-200 rounded-lg p-5';

/**
 * Single metric tile used across HR/admin dashboards.
 * When `to` is supplied the whole tile becomes a link.
 */
export function KpiTile({ to, Icon, iconBg, iconText, value, label }: Props) {
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-lg grid place-items-center ${iconBg} ${iconText}`}>
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
        {to && <ArrowRight className="w-4 h-4 text-slate-400" aria-hidden="true" />}
      </div>
      <div className="mt-4 text-3xl font-semibold">{value}</div>
      <div className="text-sm text-slate-600">{label}</div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`${BASE} block hover:border-brand-500 hover:shadow-sm transition`}>
        {inner}
      </Link>
    );
  }
  return <div className={BASE}>{inner}</div>;
}

export function KpiTileSkeleton() {
  return (
    <div className={`${BASE} animate-pulse`}>
      <div className="w-10 h-10 rounded-lg bg-slate-200" />
      <div className="mt-4 h-8 w-16 bg-slate-200 rounded" />
      <div className="mt-2 h-4 w-32 bg-slate-100 rounded" />
    </div>
  );
}

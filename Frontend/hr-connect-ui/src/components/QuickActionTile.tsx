import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  to: string;
  Icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Vertical "icon-chip + title + description" card used by the employee
 * dashboard quick-actions row. Whole card is the click target.
 */
export function QuickActionTile({ to, Icon, title, description }: Props) {
  return (
    <Link
      to={to}
      className="group bg-white border border-slate-200 rounded-lg p-5 hover:border-brand-500 hover:shadow-sm transition"
    >
      <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-600 grid place-items-center mb-3 group-hover:bg-brand-600 group-hover:text-white transition">
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
      <div className="font-medium">{title}</div>
      <div className="text-sm text-slate-600">{description}</div>
    </Link>
  );
}

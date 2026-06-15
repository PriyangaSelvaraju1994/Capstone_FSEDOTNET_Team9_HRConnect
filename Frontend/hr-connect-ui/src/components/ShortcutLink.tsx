import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  to: string;
  Icon: LucideIcon;
  label: string;
}

/**
 * Horizontal "icon-chip + label" row used in sidebars (HR dashboard
 * shortcuts, future profile sidebar, etc.).
 */
export function ShortcutLink({ to, Icon, label }: Props) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-3 rounded-md hover:bg-slate-50 border border-slate-200"
    >
      <div className="w-9 h-9 rounded-lg bg-brand-100 text-brand-600 grid place-items-center">
        <Icon className="w-4 h-4" aria-hidden="true" />
      </div>
      <div className="text-sm font-medium">{label}</div>
    </Link>
  );
}

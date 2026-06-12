import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  Icon: LucideIcon;
  title: string;
  description?: ReactNode;
  /** Optional CTA button or link. */
  action?: ReactNode;
  /** Tailwind colour pair for the round icon chip. Defaults to slate. */
  iconClassName?: string;
}

/**
 * Empty-state pattern: round icon chip + title + description + optional CTA.
 * Used inside `SectionCard` bodies whenever a list has no items yet.
 */
export function EmptyState({
  Icon,
  title,
  description,
  action,
  iconClassName = 'bg-slate-100 text-slate-400',
}: Props) {
  return (
    <div className="p-8 text-center">
      <div
        className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${iconClassName}`}
      >
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <p className="font-medium text-slate-900">{title}</p>
      {description && <p className="text-sm text-slate-600 mt-1 mb-4">{description}</p>}
      {action}
    </div>
  );
}

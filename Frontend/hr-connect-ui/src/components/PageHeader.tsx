import type { ReactNode } from 'react';

interface Props {
  title: ReactNode;
  description?: ReactNode;
  /** Optional element rendered on the right (button, link, kbd hints). */
  action?: ReactNode;
  /** Tailwind margin-bottom. Defaults to 6. */
  className?: string;
}

/**
 * Page header pattern shared by S3/S3a/S4/S5/S6/S7/S8/S9/S10:
 * `h1 + optional p` on the left, optional action element on the right.
 */
export function PageHeader({
  title,
  description,
  action,
  className = 'mb-6',
}: Props) {
  return (
    <div
      className={`flex items-start justify-between flex-wrap gap-3 ${className}`}
    >
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && (
          <p className="text-slate-600 text-sm mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

import type { ReactNode } from 'react';

interface Props {
  /** Header text. When omitted, no header bar is rendered. */
  title?: ReactNode;
  /** Right-aligned element in the header (e.g. "View all →" link). */
  headerAction?: ReactNode;
  /** Used to associate the heading with the surrounding `<section>`. */
  titleId?: string;
  /** When true, applies p-5 to the body. Defaults to false so list-style bodies can manage their own padding. */
  padded?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * White card with optional header bar — the default container for dashboard
 * sections, list panels, and sidebars.
 */
export function SectionCard({
  title,
  headerAction,
  titleId,
  padded = false,
  children,
  className = '',
}: Props) {
  return (
    <div className={`bg-white border border-slate-200 rounded-lg ${className}`}>
      {title && (
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 id={titleId} className="font-semibold">
            {title}
          </h2>
          {headerAction}
        </div>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </div>
  );
}

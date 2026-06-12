import type { ReactNode } from 'react';

interface Props {
  id?: string;
  children: ReactNode;
  /** Tailwind classes for margin. Defaults to mb-3. */
  className?: string;
}

/**
 * Uppercase "section label" h2 used to introduce groups of cards/rows
 * (e.g. "Your leave balances", "Leave balances", "Employment").
 */
export function SectionHeading({ id, children, className = 'mb-3' }: Props) {
  return (
    <h2
      id={id}
      className={`text-sm font-semibold uppercase tracking-wide text-slate-500 ${className}`}
    >
      {children}
    </h2>
  );
}

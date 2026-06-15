import type { ReactNode } from 'react';
import { AppHeader } from './AppHeader';

interface Props {
  children: ReactNode;
  /** Tailwind max-width for the inner `<main>` container. Defaults to 7xl. */
  maxWidth?: 'max-w-3xl' | 'max-w-5xl' | 'max-w-7xl';
  /** Forwarded to AppHeader — shows queue count on Queue nav item (HR only). */
  pendingCount?: number;
  /** Forwarded to AppHeader — shows red dot on bell. */
  hasUnreadNotifications?: boolean;
}

/**
 * Shared chrome for every authenticated screen: sticky AppHeader + a
 * centred `<main>` with the standard horizontal padding and vertical
 * rhythm used in every wireframe (S3–S10).
 */
export function AppShell({
  children,
  maxWidth = 'max-w-7xl',
  pendingCount,
  hasUnreadNotifications,
}: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader
        pendingCount={pendingCount}
        hasUnreadNotifications={hasUnreadNotifications}
      />
      <main
        className={`flex-1 ${maxWidth} w-full mx-auto px-4 sm:px-6 lg:px-8 py-8`}
      >
        {children}
      </main>
    </div>
  );
}

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  /** HTTP status code shown above the title, e.g. "HTTP 404". */
  code: number;
  /** Big page heading, e.g. "Page not found". */
  title: string;
  /** Supporting text under the heading. */
  description: string;
  /** Icon shown in the round chip above the title. */
  Icon: LucideIcon;
  /** Tailwind classes for the icon chip (e.g. "bg-rose-50 text-rose-500"). */
  iconClassName: string;
  /** Optional small meta line under the description (e.g. trace id). */
  meta?: ReactNode;
  /** Action buttons rendered below. */
  actions: ReactNode;
}

/**
 * Shared chrome for the 403 / 404 / 500 wireframes (S11 / S12 / S13).
 */
export function ErrorPageLayout({
  code,
  title,
  description,
  Icon,
  iconClassName,
  meta,
  actions,
}: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Building2 className="w-5 h-5 text-brand-600" aria-hidden="true" />
            <span>HRConnect</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div
            className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 ${iconClassName}`}
          >
            <Icon className="w-12 h-12" aria-hidden="true" />
          </div>
          <div className="text-xs font-mono text-slate-500 mb-2">HTTP {code}</div>
          <h1 className="text-3xl font-semibold mb-2">{title}</h1>
          <p className="text-slate-600 mb-2">{description}</p>
          {meta && <p className="text-xs text-slate-500 font-mono mb-4">{meta}</p>}
          <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
            {actions}
          </div>
        </div>
      </main>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Home, LockKeyhole, Mail } from 'lucide-react';
import { ErrorPageLayout } from './ErrorPageLayout';

/** S11 — Forbidden. */
export default function ForbiddenPage() {
  return (
    <ErrorPageLayout
      code={403}
      title="You don't have access"
      description="This page is for HR admins only. If you think this is a mistake, ask your HR team to grant access."
      Icon={LockKeyhole}
      iconClassName="bg-rose-50 text-rose-500"
      actions={
        <>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-4 rounded-md"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            Go to dashboard
          </Link>
          <a
            href="mailto:hr@company.com"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-300 rounded-md hover:bg-slate-50"
          >
            <Mail className="w-4 h-4" aria-hidden="true" />
            Contact HR
          </a>
        </>
      }
    />
  );
}

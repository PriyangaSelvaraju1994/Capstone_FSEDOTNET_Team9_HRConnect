import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, Home } from 'lucide-react';
import { ErrorPageLayout } from './ErrorPageLayout';

/** S12 — Not found. */
export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <ErrorPageLayout
      code={404}
      title="Page not found"
      description="The page you're looking for doesn't exist or was moved. Let's get you back on track."
      Icon={Compass}
      iconClassName="bg-brand-50 text-brand-500"
      actions={
        <>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-4 rounded-md"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            Go to dashboard
          </Link>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-300 rounded-md hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Go back
          </button>
        </>
      }
    />
  );
}

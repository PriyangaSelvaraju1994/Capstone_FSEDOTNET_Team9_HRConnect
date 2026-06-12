import { Link } from 'react-router-dom';
import { CloudOff, Home, RotateCw } from 'lucide-react';
import { ErrorPageLayout } from './ErrorPageLayout';

interface Props {
  /** Optional trace id surfaced to support. */
  traceId?: string;
}

/** S13 — Internal server error. */
export default function ServerErrorPage({
  traceId = '0HMVD4U7NLA8N:00000003',
}: Props) {
  return (
    <ErrorPageLayout
      code={500}
      title="Something went wrong"
      description="We hit an unexpected error. Our team has been notified."
      Icon={CloudOff}
      iconClassName="bg-amber-50 text-amber-500"
      meta={<>Trace id: {traceId}</>}
      actions={
        <>
          <button
            type="button"
            onClick={() => location.reload()}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-4 rounded-md"
          >
            <RotateCw className="w-4 h-4" aria-hidden="true" />
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-300 rounded-md hover:bg-slate-50"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            Go home
          </Link>
        </>
      }
    />
  );
}

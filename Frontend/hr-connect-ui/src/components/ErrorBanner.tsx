import { AlertCircle, RotateCw } from 'lucide-react';

interface Props {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: Props) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-900"
    >
      <AlertCircle className="w-5 h-5 mt-0.5 flex-none" aria-hidden="true" />
      <div className="flex-1 text-sm">{message}</div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-900 hover:text-rose-700"
        >
          <RotateCw className="w-4 h-4" aria-hidden="true" />
          Retry
        </button>
      )}
    </div>
  );
}

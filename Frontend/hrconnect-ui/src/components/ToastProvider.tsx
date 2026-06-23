import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, X, XCircle } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastOptions {
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  success: (message: string, durationMs?: number) => void;
  error: (message: string, durationMs?: number) => void;
  warning: (message: string, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 4000;
const DEDUPE_WINDOW_MS = 1500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timeoutIds = useRef<number[]>([]);
  const lastShownAt = useRef<Record<string, number>>({});

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ message, variant = 'success', durationMs = DEFAULT_DURATION_MS }: ToastOptions) => {
      const normalizedMessage = message.trim();
      if (!normalizedMessage) return;

      const key = `${variant}:${normalizedMessage}`;
      const now = Date.now();
      const last = lastShownAt.current[key] ?? 0;
      if (now - last < DEDUPE_WINDOW_MS) return;
      lastShownAt.current[key] = now;

      // Keep the de-dupe map bounded by dropping stale keys opportunistically.
      Object.entries(lastShownAt.current).forEach(([k, ts]) => {
        if (now - ts > 60000) {
          delete lastShownAt.current[k];
        }
      });

      const id = nextId.current++;
      setToasts((current) => {
        const alreadyVisible = current.some(
          (toast) => toast.variant === variant && toast.message === normalizedMessage,
        );
        if (alreadyVisible) return current;
        return [...current, { id, message: normalizedMessage, variant }];
      });

      const timeoutId = window.setTimeout(() => {
        dismissToast(id);
      }, durationMs);
      timeoutIds.current.push(timeoutId);
    },
    [dismissToast],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      success: (message, durationMs) => showToast({ message, variant: 'success', durationMs }),
      error: (message, durationMs) => showToast({ message, variant: 'error', durationMs }),
      warning: (message, durationMs) => showToast({ message, variant: 'warning', durationMs }),
    }),
    [showToast],
  );

  useEffect(() => {
    return () => {
      timeoutIds.current.forEach((id) => clearTimeout(id));
      timeoutIds.current = [];
    };
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((toast) => {
          const styles =
            toast.variant === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : toast.variant === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-900'
                : 'border-amber-200 bg-amber-50 text-amber-900';

          return (
            <div
              key={toast.id}
              role={toast.variant === 'error' ? 'alert' : 'status'}
              className={`pointer-events-auto flex items-start gap-2 rounded-md border px-3 py-2 text-sm shadow-sm ${styles}`}
            >
              {toast.variant === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
              ) : toast.variant === 'error' ? (
                <XCircle className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
              )}
              <span className="flex-1">{toast.message}</span>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="rounded p-0.5 hover:bg-black/5"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

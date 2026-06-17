import { useEffect } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  Building2,
  Loader2,
  Lock,
  LogIn,
  Mail,
} from 'lucide-react';
import { useAppDispatch } from '../../store/hooks';
import { loginThunk } from '../../store/slices/authSlice';
import { useAuth } from '../../hooks/useAuth';

const schema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email like name@company.com'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { isAuthenticated, status, error, clearError } = useAuth();

  const routeState = location.state as
    | { from?: string; successMessage?: string }
    | null;
  const successMessage = routeState?.successMessage;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(
    () => () => {
      clearError();
    },
    [clearError],
  );

  if (isAuthenticated) {
    const from = routeState?.from ?? '/';
    return <Navigate to={from} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    await dispatch(loginThunk(values));
  });

  const submitting = status === 'loading';
  const loginErrorMessage = error?.message || 'Something went wrong. Please try again.';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center">
          <div className="flex items-center gap-2 font-semibold">
            <Building2 className="w-5 h-5 text-brand-600" aria-hidden="true" />
            <span>HRConnect</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-brand-100 text-brand-600 mb-3">
              <Building2 className="w-6 h-6" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-semibold">Welcome to HRConnect</h1>
            <p className="text-slate-600 text-sm mt-1">
              Sign in to manage your time off.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            {successMessage && (
              <div
                role="status"
                className="mb-4 flex gap-2 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm"
              >
                <span>{successMessage}</span>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-4 flex gap-2 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-900 text-sm"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-none" aria-hidden="true" />
                <span>{loginErrorMessage}</span>
              </div>
            )}

            <form onSubmit={onSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="w-4 h-4 absolute left-3 top-3 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className={`w-full pl-9 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                      errors.email ? 'border-rose-400' : 'border-slate-300'
                    }`}
                    placeholder="you@company.com"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="text-xs text-rose-600 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-sm font-medium">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock
                    className="w-4 h-4 absolute left-3 top-3 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                      errors.password ? 'password-error' : undefined
                    }
                    className={`w-full pl-9 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                      errors.password ? 'border-rose-400' : 'border-slate-300'
                    }`}
                    placeholder="••••••••"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p id="password-error" className="text-xs text-rose-600 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                )}
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-600 mt-5">
              New here?{' '}
              <Link to="/register" className="text-brand-600 hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

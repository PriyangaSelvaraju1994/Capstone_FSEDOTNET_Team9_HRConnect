import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  Building2,
  Check,
  ChevronDown,
  Loader2,
  UserPlus,
} from 'lucide-react';
import { useAppDispatch } from '../../store/hooks';
import { registerThunk } from '../../store/slices/authSlice';
import { useAuth } from '../../hooks/useAuth';
import type { Department } from '../../types/auth';
import { scorePassword, strengthLabel } from '../../utils/passwordStrength';

const DEPARTMENTS: Department[] = ['Engineering', 'Design', 'Sales', 'HR'];

const schema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email like name@company.com'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Add at least one uppercase letter')
    .regex(/[0-9]/, 'Add at least one digit'),
  department: z.enum(['Engineering', 'Design', 'Sales', 'HR']),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, status, error, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      department: 'Engineering',
    },
  });

  useEffect(
    () => () => {
      clearError();
    },
    [clearError],
  );

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    await dispatch(registerThunk(values));
  });

  const submitting = status === 'loading';
  const password = watch('password');
  const strength = scorePassword(password);

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
              <UserPlus className="w-6 h-6" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-semibold">Create your account</h1>
            <p className="text-slate-600 text-sm mt-1">
              Takes about a minute. You can finish your profile later.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            {error && (
              <div
                role="alert"
                className="mb-4 flex gap-2 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-900 text-sm"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-none" aria-hidden="true" />
                <span>{error.message}</span>
              </div>
            )}

            <form onSubmit={onSubmit} noValidate className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                    First name
                  </label>
                  <input
                    id="firstName"
                    autoComplete="given-name"
                    aria-invalid={Boolean(errors.firstName)}
                    aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      errors.firstName ? 'border-rose-400' : 'border-slate-300'
                    }`}
                    {...register('firstName')}
                  />
                  {errors.firstName && (
                    <p id="firstName-error" className="text-xs text-rose-600 mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    autoComplete="family-name"
                    aria-invalid={Boolean(errors.lastName)}
                    aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      errors.lastName ? 'border-rose-400' : 'border-slate-300'
                    }`}
                    placeholder="Rexy"
                    {...register('lastName')}
                  />
                  {errors.lastName && (
                    <p id="lastName-error" className="text-xs text-rose-600 mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Work email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    errors.email ? 'border-rose-400' : 'border-slate-300'
                  }`}
                  placeholder="you@company.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p id="email-error" className="text-xs text-rose-600 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? 'password-error' : 'password-strength'
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    errors.password ? 'border-rose-400' : 'border-slate-300'
                  }`}
                  placeholder="At least 8 characters"
                  {...register('password')}
                />
                <div className="mt-2 grid grid-cols-3 gap-1" aria-hidden="true">
                  <div className={`h-1 rounded ${strength >= 1 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  <div className={`h-1 rounded ${strength >= 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  <div className={`h-1 rounded ${strength >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                </div>
                {errors.password ? (
                  <p id="password-error" className="text-xs text-rose-600 mt-1">
                    {errors.password.message}
                  </p>
                ) : (
                  <p id="password-strength" className="text-xs text-slate-500 mt-1">
                    Strength: {strengthLabel(strength)}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium mb-1">
                  Department
                </label>
                <div className="relative">
                  <select
                    id="department"
                    className="w-full appearance-none px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    {...register('department')}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none"
                    aria-hidden="true"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="w-4 h-4" aria-hidden="true" />
                )}
                {submitting ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-600 mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

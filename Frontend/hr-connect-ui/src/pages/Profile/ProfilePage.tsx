import { forwardRef, useEffect } from 'react';
import type { InputHTMLAttributes } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  KeyRound,
  Loader2,
  LogOut,
  Upload,
} from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { Avatar } from '../../components/Avatar';
import { ErrorBanner } from '../../components/ErrorBanner';
import { PageHeader } from '../../components/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  changePassword,
  clearPasswordState,
  clearProfileUpdateState,
  fetchProfile,
  selectProfile,
  updateProfile,
} from '../../store/slices/profileSlice';
import type { Employee } from '../../types/employee';
import { getAvatarClassName } from '../../utils/avatarColor';
import { formatDate } from '../../utils/formatDate';
import { getInitials } from '../../utils/user';

const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  phone: z
    .string()
    .trim()
    .max(20, 'Phone number is too long')
    .optional()
    .or(z.literal('')),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(/[A-Z]/, 'Add at least one uppercase letter')
      .regex(/[0-9]/, 'Add at least one digit'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: "Passwords don't match",
  });
type PasswordValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const userId = user?.id ?? '';

  const dispatch = useAppDispatch();
  const profile = useAppSelector(selectProfile);
  const emp = profile.data;
  const loading = profile.status === 'loading' && !emp;
  const error = profile.status === 'failed' ? profile.error : null;

  useEffect(() => {
    if (userId) void dispatch(fetchProfile(userId));
  }, [dispatch, userId]);

  function refetch() {
    if (userId) void dispatch(fetchProfile(userId));
  }

  return (
    <AppShell maxWidth="max-w-3xl">
      <PageHeader
        title="Your profile"
        description="Update your personal info and password."
      />

      {error && (
        <div className="mb-4">
          <ErrorBanner
            message="We couldn't load your profile. Please try again."
            onRetry={refetch}
          />
        </div>
      )}

      <ProfileCard loading={loading} emp={emp} userId={userId} />

      <div className="h-6" />

      <PasswordCard />

      <div className="mt-6 text-right">
        <button
          type="button"
          onClick={signOut}
          className="inline-flex items-center gap-2 text-sm text-rose-600 hover:text-rose-700 font-medium"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" /> Sign out
        </button>
      </div>
    </AppShell>
  );
}

interface ProfileCardProps {
  loading: boolean;
  emp: Employee | null;
  userId: string;
}

function ProfileCard({ loading, emp, userId }: ProfileCardProps) {
  const dispatch = useAppDispatch();
  const profile = useAppSelector(selectProfile);
  const saved = profile.updateStatus === 'succeeded';
  const saveError =
    profile.updateStatus === 'failed' ? profile.updateError : null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: '', lastName: '', phone: '' },
  });

  useEffect(() => {
    if (emp) {
      reset({
        firstName: emp.firstName,
        lastName: emp.lastName,
        phone: emp.phone ?? '',
      });
      // Reset any prior banner state when the record (re-)loads.
      dispatch(clearProfileUpdateState());
    }
  }, [emp, reset, dispatch]);

  const onSubmit = handleSubmit(async (values) => {
    if (!userId) return;
    await dispatch(
      updateProfile({
        userId,
        payload: {
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone?.trim() || undefined,
        },
      }),
    );
    // Banner state is driven entirely by the slice (saved / saveError).
  });

  const initials = emp ? getInitials(emp.firstName, emp.lastName) : '··';

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-100">
        {loading || !emp ? (
          <div className="animate-pulse flex items-center gap-4 w-full">
            <div className="w-20 h-20 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-40 bg-slate-200 rounded" />
              <div className="h-4 w-60 bg-slate-100 rounded" />
            </div>
          </div>
        ) : (
          <>
            <Avatar
              initials={initials}
              size={12}
              className={`${getAvatarClassName(initials)} w-20 h-20 text-2xl`}
            />
            <div className="flex-1">
              <div className="font-semibold text-lg">
                {emp.firstName} {emp.lastName}
              </div>
              <div className="text-sm text-slate-600">
                {emp.designation} · {emp.department}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Joined {formatDate(emp.joiningDate)}
              </div>
            </div>
            <button
              type="button"
              className="px-3 py-2 text-sm font-medium border border-slate-300 rounded-md hover:bg-slate-50 inline-flex items-center gap-1.5"
              onClick={() =>
                window.alert(
                  'Photo upload is a stretch goal for v2 — using initials chip for now.',
                )
              }
            >
              <Upload className="w-4 h-4" aria-hidden="true" /> Upload photo
            </button>
          </>
        )}
      </div>

      {saveError && (
        <div
          role="alert"
          className="mb-4 flex gap-2 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-900 text-sm"
        >
          <AlertCircle
            className="w-4 h-4 mt-0.5 flex-none"
            aria-hidden="true"
          />
          <span>{saveError}</span>
        </div>
      )}
      {saved && (
        <div
          role="status"
          className="mb-4 flex gap-2 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm"
        >
          <CheckCircle2
            className="w-4 h-4 mt-0.5 flex-none"
            aria-hidden="true"
          />
          <span>Profile updated.</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field
            id="firstName"
            label="First name"
            placeholder="Rino"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Field
            id="lastName"
            label="Last name"
            placeholder="Rexy"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-1"
          >
            Email
          </label>
          <input
            id="email"
            value={emp?.email ?? ''}
            readOnly
            className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-md text-slate-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            Email is managed by HR.{' '}
            <a
              href="mailto:hr@company.com"
              className="text-brand-600 hover:underline"
            >
              Contact HR
            </a>{' '}
            to change.
          </p>
        </div>
        <Field
          id="phone"
          label="Phone"
          placeholder="+91 …"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="w-4 h-4" aria-hidden="true" />
            )}{' '}
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}

function PasswordCard() {
  const dispatch = useAppDispatch();
  const profile = useAppSelector(selectProfile);
  const submitError =
    profile.passwordStatus === 'failed' && !profile.passwordErrorField
      ? profile.passwordError
      : null;
  const done = profile.passwordStatus === 'succeeded';

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Surface server-side field errors (e.g. "current password is wrong") on the
  // matching field once the rejected action lands in the store.
  useEffect(() => {
    if (
      profile.passwordStatus === 'failed' &&
      profile.passwordErrorField &&
      profile.passwordError
    ) {
      setError(profile.passwordErrorField, {
        message: profile.passwordError,
      });
    }
  }, [profile.passwordStatus, profile.passwordErrorField, profile.passwordError, setError]);

  const onSubmit = handleSubmit(async (values) => {
    const result = await dispatch(
      changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }),
    );
    if (changePassword.fulfilled.match(result)) {
      reset();
    }
  });

  // Clear the slice's password state when this card unmounts so navigating
  // away and back doesn't show a stale success banner.
  useEffect(
    () => () => {
      dispatch(clearPasswordState());
    },
    [dispatch],
  );

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <h2 className="font-semibold mb-1">Change password</h2>
      <p className="text-slate-600 text-sm mb-4">
        You'll need to sign in again after changing.
      </p>

      {submitError && (
        <div
          role="alert"
          className="mb-4 flex gap-2 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-900 text-sm"
        >
          <AlertCircle
            className="w-4 h-4 mt-0.5 flex-none"
            aria-hidden="true"
          />
          <span>{submitError}</span>
        </div>
      )}
      {done && (
        <div
          role="status"
          className="mb-4 flex gap-2 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm"
        >
          <CheckCircle2
            className="w-4 h-4 mt-0.5 flex-none"
            aria-hidden="true"
          />
          <span>Password updated.</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field
          id="currentPassword"
          type="password"
          label="Current password"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <Field
            id="newPassword"
            type="password"
            label="New password"
            autoComplete="new-password"
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <Field
            id="confirmPassword"
            type="password"
            label="Confirm new password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <KeyRound className="w-4 h-4" aria-hidden="true" />
            )}{' '}
            Update password
          </button>
        </div>
      </form>
    </div>
  );
}

// --- Inline field helper shared by both forms on this page ---

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
}

const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { id, label, error, className, ...rest },
  ref,
) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 ${
          error ? 'border-rose-400' : 'border-slate-300'
        } ${className ?? ''}`}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-rose-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
});

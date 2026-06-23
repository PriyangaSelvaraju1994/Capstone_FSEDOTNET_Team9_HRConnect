import { forwardRef, useEffect } from 'react';
import type { InputHTMLAttributes } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  KeyRound,
  Loader2,
  LogOut,
} from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { Avatar } from '../../components/Avatar';
import { PageHeader } from '../../components/PageHeader';
import { useToast } from '../../components/ToastProvider';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import type { Employee } from '../../types/employee';
import type { PasswordFormValues } from '../../types/forms';
import { getAvatarClassName } from '../../utils/avatarColor';
import { formatDate } from '../../utils/formatDate';
import { getInitials } from '../../utils/user';

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

export default function ProfilePage() {
  const toast = useToast();
  const { user, signOut } = useAuth();
  const userId = user?.id ?? 0;

  const {
    employee: emp,
    loading,
    error,
    passwordChanged,
    passwordChangeError,
    handleChangePassword,
    clearPasswordState: clearPwdState,
  } = useProfile({ userId });

  useEffect(() => {
    if (error) {
      toast.error("We couldn't load your profile. Please try again.");
    }
  }, [error, toast]);

  useEffect(() => {
    if (passwordChangeError) {
      toast.error(passwordChangeError);
    }
  }, [passwordChangeError, toast]);

  useEffect(() => {
    if (passwordChanged) {
      toast.success('Password updated.');
    }
  }, [passwordChanged, toast]);

  return (
    <AppShell maxWidth="max-w-3xl">
      <PageHeader
        title="Your profile"
        description="View your details and change your password."
      />

      <ProfileCard loading={loading} emp={emp} />

      <div className="h-6" />

      <PasswordCard
        handleChangePassword={handleChangePassword}
        clearPasswordState={clearPwdState}
      />

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
}

function ProfileCard({ loading, emp }: ProfileCardProps) {
  const displayName = emp
    ? `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim()
    : '';
  const initials = getInitials(emp?.fullName ?? '', '');

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
                {displayName || emp.fullName}
              </div>
              <div className="text-sm text-slate-600">
                {emp.email}
              </div>
              <div className="text-sm text-slate-600">
                {emp.designation} · {emp.department}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Joined on {formatDate(emp.joiningDate)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Profile details are managed by HR.{' '}
                <a
                  href="mailto:hrconnect42@gmail.com"
                  className="text-brand-600 hover:underline"
                >
                  Contact HR
                </a>{' '}
                to change.
              </p>
            </div>

          </>

        )}
      </div>

      {emp && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">

          </div>


        </div>
      )}
    </div>
  );
}

interface PasswordCardProps {
  handleChangePassword: (data: PasswordFormValues) => Promise<void>;
  clearPasswordState: () => void;
}

function PasswordCard({
  handleChangePassword,
  clearPasswordState,
}: PasswordCardProps) {

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await handleChangePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      reset();
    } catch {
      // Error surfaced via passwordChangeError
    }
  });

  // Clear password state when unmounting
  useEffect(
    () => () => {
      clearPasswordState();
    },
    [clearPasswordState],
  );

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <h2 className="font-semibold mb-1">Change password</h2>
      <p className="text-slate-600 text-sm mb-4">
        You'll need to sign in again after changing.
      </p>

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
            Change password
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
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 ${error ? 'border-rose-400' : 'border-slate-300'
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

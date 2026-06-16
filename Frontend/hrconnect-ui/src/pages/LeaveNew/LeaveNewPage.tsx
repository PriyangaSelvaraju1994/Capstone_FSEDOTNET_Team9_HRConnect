import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Calendar, Loader2, Send } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { BalancePreviewCard } from '../../components/BalancePreviewCard';
import { Breadcrumb } from '../../components/Breadcrumb';
import { LeaveTypeDropdown } from '../../components/LeaveTypeDropdown';
import { PageHeader } from '../../components/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { useLeaveForm } from '../../hooks/useLeaveForm';
import type { LeaveType } from '../../types/leave';

const REASON_MAX = 500;

const schema = z
  .object({
    type: z.enum(['Earned', 'Sick', 'Casual', 'CompOff']),
    startDate: z.string().min(1, 'Pick a start date'),
    endDate: z.string().min(1, 'Pick an end date'),
    reason: z
      .string()
      .max(REASON_MAX, `Keep it under ${REASON_MAX} characters`)
      .optional(),
  })
  .refine(
    (v) => new Date(v.endDate).getTime() >= new Date(v.startDate).getTime(),
    {
      path: ['endDate'],
      message: 'End date must be on or after the start date',
    },
  );

type FormValues = z.infer<typeof schema>;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function LeaveNewPage() {
  const { user } = useAuth();
  const userId = user?.id ?? 0;

  const {
    balances,
    submitError,
    computePreview,
    handleSubmit: submitLeave,
  } = useLeaveForm({ userId: Number(userId) });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'Earned',
      startDate: today(),
      endDate: today(),
      reason: '',
    },
  });

  const type = watch('type');
  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const reason = watch('reason') ?? '';

  const preview = useMemo(
    () => computePreview(type, startDate, endDate),
    [computePreview, type, startDate, endDate],
  );

  const onSubmit = handleSubmit(async (values) => {
    await submitLeave(values);
  });

  return (
    <AppShell maxWidth="max-w-5xl">
      <Breadcrumb
        items={[
          { label: 'My Leaves', to: '/my-leaves' },
          { label: 'New request' },
        ]}
      />
      <PageHeader
        title="Request time off"
        description="Submit a new leave request. You'll see your projected balance on the right."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-lg p-6">
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
            <form onSubmit={onSubmit} className="space-y-5" noValidate>
              <LeaveTypeDropdown
                value={type}
                onChange={(v: LeaveType) => setValue('type', v, { shouldDirty: true })}
                balances={balances ?? undefined}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="startDate"
                    className="block text-sm font-medium mb-1"
                  >
                    Start date
                  </label>
                  <div className="relative">
                    <Calendar
                      className="w-4 h-4 absolute left-3 top-2.5 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="startDate"
                      type="date"
                      aria-invalid={Boolean(errors.startDate)}
                      className={`w-full pl-9 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        errors.startDate
                          ? 'border-rose-400'
                          : 'border-slate-300'
                      }`}
                      {...register('startDate')}
                    />
                  </div>
                  {errors.startDate && (
                    <p className="text-xs text-rose-600 mt-1">
                      {errors.startDate.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="endDate"
                    className="block text-sm font-medium mb-1"
                  >
                    End date
                  </label>
                  <div className="relative">
                    <Calendar
                      className="w-4 h-4 absolute left-3 top-2.5 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="endDate"
                      type="date"
                      aria-invalid={Boolean(errors.endDate)}
                      className={`w-full pl-9 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        errors.endDate ? 'border-rose-400' : 'border-slate-300'
                      }`}
                      {...register('endDate')}
                    />
                  </div>
                  {errors.endDate && (
                    <p className="text-xs text-rose-600 mt-1">
                      {errors.endDate.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="reason"
                  className="block text-sm font-medium mb-1"
                >
                  Reason{' '}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="reason"
                  rows={3}
                  maxLength={REASON_MAX}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Family wedding"
                  {...register('reason')}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {reason.length} / {REASON_MAX}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <Link
                  to="/my-leaves"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting || !preview.sufficient || preview.workingDays === 0}
                  className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2
                      className="w-4 h-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Send className="w-4 h-4" aria-hidden="true" />
                  )}
                  {isSubmitting ? 'Submitting…' : 'Submit request'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <aside className="lg:col-span-1">
          <BalancePreviewCard preview={preview} />
        </aside>
      </div>
    </AppShell>
  );
}

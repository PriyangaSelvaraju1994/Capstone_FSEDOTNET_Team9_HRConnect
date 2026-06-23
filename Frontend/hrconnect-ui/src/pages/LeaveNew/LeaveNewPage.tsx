import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Send } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { AppShell } from '../../components/AppShell';
import { BalancePreviewCard } from '../../components/BalancePreviewCard';
import { Breadcrumb } from '../../components/Breadcrumb';
import { LeaveTypeDropdown } from '../../components/LeaveTypeDropdown';
import { PageHeader } from '../../components/PageHeader';
import { useToast } from '../../components/ToastProvider';
import { useAuth } from '../../hooks/useAuth';
import { useLeaveForm } from '../../hooks/useLeaveForm';
import type { LeaveType } from '../../types/leave';

const REASON_MAX = 500;

const schema = z
  .object({
    type: z.enum(['Earned', 'Sick', 'Casual', 'CompOff']),
    startDate: z
      .string()
      .min(1, 'Pick a start date')
      .refine((value) => !isWeekend(new Date(`${value}T00:00:00`)), {
        message: 'Start date cannot be a weekend',
      }),
    endDate: z
      .string()
      .min(1, 'Pick an end date')
      .refine((value) => !isWeekend(new Date(`${value}T00:00:00`)), {
        message: 'End date cannot be a weekend',
      }),
    reason: z
      .string()
      .min(1, 'Reason is required')
      .max(REASON_MAX, `Keep it under ${REASON_MAX} characters`),
  })
  .refine(
    (value) => new Date(value.endDate).getTime() >= new Date(value.startDate).getTime(),
    {
      path: ['endDate'],
      message: 'End date must be on or after the start date',
    },
  );

type FormValues = z.infer<typeof schema>;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function toInputDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export default function LeaveNewPage() {
  const { user } = useAuth();
  const userId = user?.id ?? 0;

  const {
    balances,
    submitError,
    computePreview,
    handleSubmit: submitLeave,
    clearError,
  } = useLeaveForm({ userId: Number(userId) });
  const toast = useToast();

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

  const selectedStartDate = startDate ? new Date(`${startDate}T00:00:00`) : null;
  const selectedEndDate = endDate ? new Date(`${endDate}T00:00:00`) : null;

  const preview = useMemo(
    () => computePreview(type, startDate, endDate),
    [computePreview, type, startDate, endDate],
  );

  const onSubmit = handleSubmit(async (values) => {
    await submitLeave(values);
  });

  useEffect(() => {
    if (!submitError) return;
    toast.error(submitError);
    clearError();
  }, [submitError, toast, clearError]);

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
            <form onSubmit={onSubmit} className="space-y-5" noValidate>
              <LeaveTypeDropdown
                value={type}
                onChange={(v: LeaveType) => setValue('type', v, {  shouldDirty: true })}
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
                  <div className="rounded-md border border-slate-200 p-3">
                    <DatePicker
                      selected={selectedStartDate}
                      onChange={(date: Date | null) => {
                        if (date) {
                          setValue('startDate', toInputDate(date), {
                            shouldDirty: true,
                          });
                        }
                      }}
                      filterDate={(date: any) => !isWeekend(date)}
                      dateFormat="yyyy-MM-dd"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                  <div className="rounded-md border border-slate-200 p-3">
                    <DatePicker
                      selected={selectedEndDate}
                      onChange={(date: Date | null) => {
                        if (date) {
                          setValue('endDate', toInputDate(date), {
                            shouldDirty: true,
                          });
                        }
                      }}
                      filterDate={(date: any) => !isWeekend(date)}
                      dateFormat="yyyy-MM-dd"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                  Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id="reason"
                  rows={3}
                  maxLength={REASON_MAX}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Family wedding"
                  {...register('reason')}
                />
                {errors.reason && (
                  <p className="text-xs text-rose-600 mt-1">
                    {errors.reason.message}
                  </p>
                )}
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

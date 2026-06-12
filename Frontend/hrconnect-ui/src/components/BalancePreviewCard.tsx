import { AlertCircle, Calculator, CheckCircle2 } from 'lucide-react';
import type { LeaveBalancePreview } from '../types/leave';
import { countLabel } from '../utils/format';

interface Props {
  preview: LeaveBalancePreview;
  /** When true, renders the compact (panel-style) variant used by S9. */
  compact?: boolean;
}

/**
 * "What-if" balance projection card. Two visual variants:
 *  - default (S5 sidebar): heading + dl + status banner
 *  - compact (S9 detail panel): two-row strip without a heading
 */
export function BalancePreviewCard({ preview, compact = false }: Props) {
  const currentRemaining = Math.max(
    0,
    preview.currentTotal - preview.currentUsed,
  );
  const projectedRemaining = Math.max(
    0,
    preview.projectedTotal - preview.projectedUsed,
  );

  if (compact) {
    return (
      <div className="p-4 rounded-md bg-slate-50 border border-slate-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Current balance</span>
          <span className="font-medium">
            {currentRemaining} / {preview.currentTotal} days
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1 pt-2 border-t border-slate-200">
          <span className="text-slate-900 font-medium">After approval</span>
          <span
            className={`font-semibold ${
              preview.sufficient ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {projectedRemaining} / {preview.projectedTotal} days
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 sticky top-20">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4 text-brand-600" aria-hidden="true" />
        <h2 className="font-semibold text-sm">Balance preview</h2>
      </div>

      <dl className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-slate-600">Working days</dt>
          <dd className="font-semibold">{preview.workingDays}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-slate-600">Current balance</dt>
          <dd className="font-semibold">
            {currentRemaining} / {preview.currentTotal}
          </dd>
        </div>
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
          <dt className="text-slate-900 font-medium">After approval</dt>
          <dd
            className={`font-semibold ${
              preview.sufficient ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {projectedRemaining} / {preview.projectedTotal}
          </dd>
        </div>
      </dl>

      {preview.workingDays === 0 ? (
        <div className="mt-4 p-3 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600">
          Pick start and end dates to see your projection.
        </div>
      ) : preview.sufficient ? (
        <div className="mt-4 p-3 rounded-md bg-emerald-50 border border-emerald-200 flex gap-2">
          <CheckCircle2
            className="w-4 h-4 text-emerald-700 mt-0.5 flex-none"
            aria-hidden="true"
          />
          <p className="text-xs text-emerald-900">
            You have enough balance for this request.
          </p>
        </div>
      ) : (
        <div className="mt-4 p-3 rounded-md bg-rose-50 border border-rose-200 flex gap-2">
          <AlertCircle
            className="w-4 h-4 text-rose-700 mt-0.5 flex-none"
            aria-hidden="true"
          />
          <p className="text-xs text-rose-900">
            This request exceeds your balance by{' '}
            {countLabel(
              preview.currentUsed + preview.workingDays - preview.currentTotal,
              'day',
            )}
            .
          </p>
        </div>
      )}

      <p className="mt-4 text-xs text-slate-500">
        Weekends are excluded. Public holidays will be excluded once configured.
      </p>
    </div>
  );
}

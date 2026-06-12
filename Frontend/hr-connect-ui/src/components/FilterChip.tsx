interface Props {
  label: string;
  active: boolean;
  onClick: () => void;
  /** Optional small count rendered next to the label, e.g. "Pending · 5". */
  count?: number;
}

/**
 * Pill-shaped filter toggle used by the My-Leaves status filter row (S4).
 * Active chip uses the brand fill; inactive chips read as outlined buttons.
 */
export function FilterChip({ label, active, onClick, count }: Props) {
  const base =
    'px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition-colors';
  const styles = active
    ? 'bg-brand-600 text-white hover:bg-brand-700'
    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${base} ${styles}`}
    >
      {label}
      {typeof count === 'number' && (
        <span
          className={`text-[10px] leading-none px-1.5 py-0.5 rounded-full ${
            active ? 'bg-white/20' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

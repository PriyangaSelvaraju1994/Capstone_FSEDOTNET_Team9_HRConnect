import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { LeaveBalance, LeaveType } from '../types/leave';
import { getLeaveTypeMeta } from './leaveTypeMeta';

interface Props {
  value: LeaveType;
  onChange: (next: LeaveType) => void;
  /** Optional balances — when supplied, each option shows "x / y days". */
  balances?: LeaveBalance[];
  /** Custom label rendered above the trigger. */
  label?: string;
}

const OPTIONS: LeaveType[] = ['Annual', 'Sick', 'Personal', 'CompOff'];

/**
 * Custom listbox-style leave-type dropdown matching the S5 wireframe.
 *
 * Accessibility: trigger has `aria-haspopup="listbox"` and `aria-expanded`;
 * the open list has `role="listbox"` and each option `role="option"` with
 * `aria-selected`. Keyboard: Arrow keys cycle, Enter selects, Esc closes,
 * click-outside closes.
 */
export function LeaveTypeDropdown({
  value,
  onChange,
  balances,
  label = 'Leave type',
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number>(() =>
    Math.max(0, OPTIONS.indexOf(value)),
  );
  const labelId = useId();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  // Click-outside + Escape to close.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Focus the active option each time it changes while open.
  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.querySelectorAll<HTMLLIElement>('[role="option"]')[activeIdx];
    node?.focus();
  }, [open, activeIdx]);

  function handleTriggerKey(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
      setActiveIdx(OPTIONS.indexOf(value));
    }
  }

  function handleOptionKey(e: React.KeyboardEvent<HTMLLIElement>, idx: number) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((idx + 1) % OPTIONS.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((idx - 1 + OPTIONS.length) % OPTIONS.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      select(OPTIONS[idx]);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  }

  function select(next: LeaveType) {
    onChange(next);
    setOpen(false);
  }

  const currentMeta = getLeaveTypeMeta(value);
  const CurrentIcon = currentMeta.Icon;

  return (
    <div>
      <label id={labelId} className="block text-sm font-medium mb-1">
        {label}
      </label>
      <div className="relative" ref={wrapperRef}>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={labelId}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={handleTriggerKey}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border border-slate-300 rounded-md text-left hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        >
          <span className="flex items-center gap-2">
            <CurrentIcon
              className={`w-4 h-4 ${currentMeta.text}`}
              aria-hidden="true"
            />
            <span className="text-sm">{currentMeta.label}</span>
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400" aria-hidden="true" />
        </button>

        {open && (
          <ul
            ref={listRef}
            role="listbox"
            aria-labelledby={labelId}
            className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden"
          >
            {OPTIONS.map((opt, idx) => {
              const meta = getLeaveTypeMeta(opt);
              const Icon = meta.Icon;
              const isSelected = opt === value;
              const bal = balances?.find((b) => b.type === opt);
              return (
                <li
                  key={opt}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={-1}
                  onClick={() => select(opt)}
                  onKeyDown={(e) => handleOptionKey(e, idx)}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-slate-50 focus:bg-slate-50 focus:outline-none ${
                    isSelected ? 'bg-brand-50' : ''
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon
                      className={`w-4 h-4 ${meta.text}`}
                      aria-hidden="true"
                    />
                    <span
                      className={`text-sm ${isSelected ? 'font-medium' : ''}`}
                    >
                      {meta.label}
                    </span>
                  </span>
                  {bal && (
                    <span className="text-xs text-slate-500">
                      {Math.max(0, bal.total - bal.used)} / {bal.total} days
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

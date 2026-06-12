interface Props {
  initials: string;
  /** Tailwind colour pair, e.g. "bg-brand-100 text-brand-700". */
  className?: string;
  /** Size in Tailwind units (w-{size} h-{size}). Defaults to 8 (32px). */
  size?: 7 | 8 | 9 | 10 | 12;
}

const SIZE_CLASS: Record<NonNullable<Props['size']>, string> = {
  7: 'w-7 h-7 text-xs',
  8: 'w-8 h-8 text-xs',
  9: 'w-9 h-9 text-sm',
  10: 'w-10 h-10 text-sm',
  12: 'w-12 h-12 text-base',
};

/**
 * Circular initials chip — used in the app header, activity rows, and any
 * other surface that displays a person without an uploaded avatar.
 */
export function Avatar({
  initials,
  className = 'bg-brand-100 text-brand-700',
  size = 8,
}: Props) {
  return (
    <span
      className={`rounded-full grid place-items-center font-semibold ${SIZE_CLASS[size]} ${className}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

/**
 * Stable per-person colour for initials chips and table rows.
 *
 * Uses a tiny char-code hash so the same person always gets the same swatch,
 * keeping wireframe parity (RR=emerald, AN=violet, RK=sky, SP=amber, MO=brand).
 */
const PALETTE: Array<{ bg: string; text: string }> = [
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-violet-100', text: 'text-violet-700' },
  { bg: 'bg-sky-100', text: 'text-sky-700' },
  { bg: 'bg-amber-100', text: 'text-amber-700' },
  { bg: 'bg-rose-100', text: 'text-rose-700' },
  { bg: 'bg-brand-100', text: 'text-brand-700' },
];

export function getAvatarColor(seed: string): { bg: string; text: string } {
  let sum = 0;
  for (let i = 0; i < seed.length; i += 1) sum += seed.charCodeAt(i);
  return PALETTE[sum % PALETTE.length];
}

/** Convenience to get the joined "bg-… text-…" className string. */
export function getAvatarClassName(seed: string): string {
  const c = getAvatarColor(seed);
  return `${c.bg} ${c.text}`;
}

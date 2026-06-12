export type PasswordStrengthScore = 0 | 1 | 2 | 3;

const STRENGTH_LABELS: readonly string[] = [
  'Too short',
  'Weak',
  'Good',
  'Strong',
];

export function scorePassword(pw: string): PasswordStrengthScore {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 3) as PasswordStrengthScore;
}

export function strengthLabel(score: PasswordStrengthScore): string {
  return STRENGTH_LABELS[score];
}

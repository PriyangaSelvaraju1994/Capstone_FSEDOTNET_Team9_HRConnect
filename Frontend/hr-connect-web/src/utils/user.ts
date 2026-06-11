export function getGreeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function getInitials(firstName: string, lastName: string): string {
  const f = firstName.trim().charAt(0);
  const l = lastName.trim().charAt(0);
  return `${f}${l}`.toUpperCase();
}

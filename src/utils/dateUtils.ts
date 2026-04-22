export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + Math.round(days));
  return d;
}

export function fmt(d: Date | null | undefined): string {
  if (!d) return '—';
  return d.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function fmtMonth(d: Date): string {
  return d.toLocaleDateString('uk-UA', { month: 'short', year: '2-digit' });
}

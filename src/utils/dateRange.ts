export type RangeId = 'today' | 'week' | 'month' | '3month' | 'year';
export const RANGES: { id: RangeId; label: string }[] = [
  { id: 'today',  label: 'Today'    },
  { id: 'week',   label: 'Week'     },
  { id: 'month',  label: 'Month'    },
  { id: '3month', label: '3 Months' },
  { id: 'year',   label: 'Year'     },
];
function pad(n: number) { return String(n).padStart(2, '0'); }
export function fmt(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
export function getRangeDates(range: RangeId): { from: string; to: string } {
  const today = new Date(); const to = fmt(today);
  if (range === 'today') return { from: to, to };
  const from = new Date(today);
  if (range === 'week')   from.setDate(today.getDate() - 6);
  if (range === 'month')  from.setDate(today.getDate() - 29);
  if (range === '3month') from.setDate(today.getDate() - 89);
  if (range === 'year')   from.setDate(today.getDate() - 364);
  return { from: fmt(from), to };
}
export function fmtLabel(dateStr: string, range: RangeId): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (range === 'year')   return d.toLocaleDateString('en', { month: 'short' });
  if (range === '3month') return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  return d.toLocaleDateString('en', { weekday: 'short' });
}
export function pctColor(pct: number): string {
  if (pct >= 80) return 'var(--accent)';
  if (pct >= 50) return 'var(--warning)';
  return 'var(--danger)';
}

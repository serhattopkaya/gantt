export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function fromISODate(iso: string): Date {
  // Parse as local date (not UTC) by appending time
  return new Date(iso + 'T00:00:00');
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function formatDisplay(iso: string): string {
  const d = fromISODate(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

export function shiftISO(iso: string, days: number): string {
  return toISODate(addDays(fromISODate(iso), days));
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function localDayKey(isoTimestamp: string): string {
  return toISODate(new Date(isoTimestamp));
}

export function formatDisplay(iso: string): string {
  const d = fromISODate(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function calendarDaysBetween(startIso: string, endIso: string): number {
  const s = fromISODate(startIso).getTime();
  const e = fromISODate(endIso).getTime();
  const ms = e - s;
  return Math.round(ms / 86400000) + 1;
}

export function workingDaysBetween(startIso: string, endIso: string): number {
  const start = fromISODate(startIso);
  const end = fromISODate(endIso);
  if (end < start) return 0;
  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export function weekdayShort(iso: string): string {
  return fromISODate(iso).toLocaleDateString(undefined, { weekday: 'short' });
}

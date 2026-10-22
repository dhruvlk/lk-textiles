import { format } from 'date-fns';

/**
 * Calendar date (yyyy-MM-dd) in the user's local timezone.
 *
 * `new Date().toISOString().slice(0, 10)` returns the UTC date, which in IST
 * (UTC+05:30) is still "yesterday" between 00:00 and 05:30 — leading to
 * wrong default dates, financial years and "today" filters.
 */
export function toLocalISODate(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

export function todayISODate(): string {
  return toLocalISODate(new Date());
}

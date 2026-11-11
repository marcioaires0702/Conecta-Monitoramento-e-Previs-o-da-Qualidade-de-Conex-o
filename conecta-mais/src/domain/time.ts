import type { Period } from './types';

export const PERIOD_LABEL: Record<Period, string> = {
  madrugada: 'Madrugada',
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
};

export const PERIOD_RANGE: Record<Period, string> = {
  madrugada: '00h às 05h',
  manha: '06h às 11h',
  tarde: '12h às 17h',
  noite: '18h às 23h',
};

export const PERIOD_ORDER: Period[] = ['madrugada', 'manha', 'tarde', 'noite'];

export function periodOfHour(hour: number): Period {
  if (hour < 6) return 'madrugada';
  if (hour < 12) return 'manha';
  if (hour < 18) return 'tarde';
  return 'noite';
}

const LOCALE = 'pt-BR';

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
}

export function formatHourShort(iso: string): string {
  return `${new Date(iso).getHours()}h`;
}

export function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, { day: 'numeric', month: 'long' });
}

export function formatDayShort(iso: string): string {
  const d = new Date(iso);
  const wd = d.toLocaleDateString(LOCALE, { weekday: 'short' }).replace('.', '');
  return `${wd.charAt(0).toUpperCase()}${wd.slice(1)}`;
}

export function formatDayMonth(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, { day: '2-digit', month: '2-digit' });
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

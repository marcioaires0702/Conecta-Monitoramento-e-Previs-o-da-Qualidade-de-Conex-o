import { classifyQuality } from '../domain/quality';
import { periodOfHour, startOfDay } from '../domain/time';
import type { Forecast, FullMetrics, HistoryObservation, Quality } from '../domain/types';

/**
 * DADOS DE DEMONSTRAÇÃO — determinísticos, gerados localmente.
 * Não são medições nem previsões reais de nenhum modelo.
 */
const HOURLY: FullMetrics[] = [
  // 00h–05h
  { latencyMs: 12, downloadMbps: 95, uploadMbps: 45 },
  { latencyMs: 12, downloadMbps: 96, uploadMbps: 46 },
  { latencyMs: 13, downloadMbps: 95, uploadMbps: 45 },
  { latencyMs: 13, downloadMbps: 94, uploadMbps: 44 },
  { latencyMs: 14, downloadMbps: 92, uploadMbps: 44 },
  { latencyMs: 15, downloadMbps: 90, uploadMbps: 43 },
  // 06h–11h
  { latencyMs: 16, downloadMbps: 88, uploadMbps: 42 },
  { latencyMs: 18, downloadMbps: 85, uploadMbps: 40 },
  { latencyMs: 22, downloadMbps: 70, uploadMbps: 32 },
  { latencyMs: 24, downloadMbps: 65, uploadMbps: 30 },
  { latencyMs: 22, downloadMbps: 72, uploadMbps: 33 },
  { latencyMs: 20, downloadMbps: 78, uploadMbps: 36 },
  // 12h–17h
  { latencyMs: 20, downloadMbps: 80, uploadMbps: 38 },
  { latencyMs: 28, downloadMbps: 62, uploadMbps: 28 },
  { latencyMs: 38, downloadMbps: 50, uploadMbps: 22 },
  { latencyMs: 45, downloadMbps: 45, uploadMbps: 20 },
  { latencyMs: 55, downloadMbps: 38, uploadMbps: 16 },
  { latencyMs: 60, downloadMbps: 30, uploadMbps: 12 },
  // 18h–23h
  { latencyMs: 80, downloadMbps: 14, uploadMbps: 4 },
  { latencyMs: 85, downloadMbps: 12, uploadMbps: 3.5 },
  { latencyMs: 90, downloadMbps: 11, uploadMbps: 3 },
  { latencyMs: 60, downloadMbps: 28, uploadMbps: 10 },
  { latencyMs: 48, downloadMbps: 40, uploadMbps: 14 },
  { latencyMs: 30, downloadMbps: 55, uploadMbps: 24 },
];

export const DEMO_CURRENT: FullMetrics = { latencyMs: 18, downloadMbps: 87, uploadMbps: 42 };

export function demoForecastsForDay(day: Date): Forecast[] {
  const base = startOfDay(day);
  return HOURLY.map((m, hour) => {
    const t = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hour, 0, 0);
    return { ...m, timestamp: t.toISOString(), quality: classifyQuality(m), period: periodOfHour(hour) };
  });
}

/** Padrão semanal determinístico: [classe, horas] por dia, repetindo ciclo de 7 dias. */
const DAY_PATTERNS: [Quality, number][][] = [
  [['boa', 14], ['regular', 6], ['instavel', 4]],
  [['boa', 16], ['regular', 5], ['instavel', 3]],
  [['boa', 12], ['regular', 8], ['instavel', 4]],
  [['boa', 18], ['regular', 4], ['instavel', 2]],
  [['boa', 15], ['regular', 7], ['instavel', 2]],
  [['boa', 17], ['regular', 5], ['instavel', 2]],
  [['boa', 13], ['regular', 7], ['instavel', 4]],
];

export function demoHistory(days: number, now: Date): HistoryObservation[] {
  const out: HistoryObservation[] = [];
  const today = startOfDay(now);
  for (let back = days - 1; back >= 0; back--) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back);
    let hour = 0;
    for (const [quality, hours] of DAY_PATTERNS[(days - 1 - back) % 7]) {
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour);
      const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour + hours);
      out.push({ start: start.toISOString(), end: end.toISOString(), quality });
      hour += hours;
    }
  }
  return out;
}

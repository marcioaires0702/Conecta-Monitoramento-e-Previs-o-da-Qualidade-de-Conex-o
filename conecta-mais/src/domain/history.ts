import type { HistoryObservation, Quality } from './types';

export type QualityShare = Record<Quality, number>;

/**
 * Percentual de tempo em cada classe, ponderado pela DURAÇÃO de cada intervalo
 * (não pela contagem de amostras). Retorna null se não houver duração válida.
 * Os percentuais são arredondados pelo método do maior resto, somando sempre 100.
 */
export function computeShares(observations: HistoryObservation[]): QualityShare | null {
  const ms: Record<Quality, number> = { boa: 0, regular: 0, instavel: 0 };
  for (const o of observations) {
    const d = Date.parse(o.end) - Date.parse(o.start);
    if (Number.isFinite(d) && d > 0) ms[o.quality] += d;
  }
  const total = ms.boa + ms.regular + ms.instavel;
  if (total <= 0) return null;

  const keys: Quality[] = ['boa', 'regular', 'instavel'];
  const raw = keys.map((k) => (ms[k] / total) * 100);
  const floors = raw.map(Math.floor);
  let rest = 100 - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (rest <= 0) break;
    floors[i] += 1;
    rest -= 1;
  }
  return { boa: floors[0], regular: floors[1], instavel: floors[2] };
}

/** Mantém apenas observações que intersectam [from, to]. */
export function filterRange(
  observations: HistoryObservation[],
  from: Date,
  to: Date,
): HistoryObservation[] {
  const f = from.getTime();
  const t = to.getTime();
  return observations.filter((o) => Date.parse(o.end) > f && Date.parse(o.start) < t);
}

export interface DaySummary {
  /** ISO do início do dia (hora local) */
  day: string;
  shares: QualityShare | null;
  dominant: Quality | null;
}

const QUALITY_ORDER: Quality[] = ['boa', 'regular', 'instavel'];

/** Resumo por dia civil local dos últimos `days` dias (inclui hoje). */
export function dailySummaries(observations: HistoryObservation[], now: Date, days: number): DaySummary[] {
  const out: DaySummary[] = [];
  for (let back = days - 1; back >= 0; back--) {
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back);
    const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1);
    // Recorta cada intervalo ao dia, para ponderar só o tempo dentro dele.
    const clipped = filterRange(observations, from, to).map((o) => ({
      ...o,
      start: new Date(Math.max(Date.parse(o.start), from.getTime())).toISOString(),
      end: new Date(Math.min(Date.parse(o.end), to.getTime())).toISOString(),
    }));
    const shares = computeShares(clipped);
    const dominant = shares
      ? QUALITY_ORDER.reduce((best, q) => (shares[q] > shares[best] ? q : best), QUALITY_ORDER[0])
      : null;
    out.push({ day: from.toISOString(), shares, dominant });
  }
  return out;
}

const DEFAULT_GAP_MS = 60 * 60 * 1000;
const MAX_GAP_MS = 6 * 60 * 60 * 1000;

/**
 * Converte pontos no tempo (previsões) em intervalos com duração: cada ponto vale até o próximo
 * (no máximo 6 h); o último usa a menor diferença observada (ou 1 h), também limitada a 6 h.
 */
export function intervalsFromPoints(points: { timestamp: string; quality: Quality }[]): HistoryObservation[] {
  const sorted = [...points].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  const gaps = sorted
    .slice(1)
    .map((p, i) => Date.parse(p.timestamp) - Date.parse(sorted[i].timestamp))
    .filter((g) => g > 0);
  const lastGap = Math.min(gaps.length ? Math.min(...gaps) : DEFAULT_GAP_MS, MAX_GAP_MS);
  return sorted
    .map((p, i) => {
      const start = Date.parse(p.timestamp);
      const next = sorted[i + 1] ? Date.parse(sorted[i + 1].timestamp) : start + lastGap;
      const end = Math.min(next, start + MAX_GAP_MS);
      return { start: new Date(start).toISOString(), end: new Date(end).toISOString(), quality: p.quality };
    })
    .filter((o) => Date.parse(o.end) > Date.parse(o.start));
}

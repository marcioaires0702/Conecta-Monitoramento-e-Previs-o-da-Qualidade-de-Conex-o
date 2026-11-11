import { periodOfHour } from '../domain/time';
import type { Forecast, ModelInfo, Probe, Quality } from '../domain/types';
import { ApiError } from './errors';

function invalid(what: string): never {
  throw new ApiError('resposta-invalida', `Resposta inválida da API: ${what}`);
}
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function obj(v: unknown, field: string): Record<string, unknown> {
  if (!isObject(v)) invalid(`"${field}" não é um objeto`);
  return v;
}
function list(v: unknown, field: string): unknown[] {
  if (!Array.isArray(v)) invalid(`"${field}" não é uma lista`);
  return v;
}
function num(v: unknown, field: string, min = 0, max = Infinity): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) invalid(`campo "${field}"`);
  return v;
}
function optNum(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}
function str(v: unknown, field: string): string {
  if (typeof v !== 'string' || v.length === 0) invalid(`campo "${field}"`);
  return v;
}
function optStr(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}
function iso(v: unknown, field: string): string {
  const s = str(v, field);
  if (!Number.isFinite(Date.parse(s))) invalid(`campo "${field}"`);
  return s;
}

/** GOOD / MODERATE / UNSTABLE (regras experimentais da API) → classes do app. */
export function parseQuality(v: unknown, field = 'quality'): Quality {
  switch (v) {
    case 'GOOD':
      return 'boa';
    case 'MODERATE':
      return 'regular';
    case 'UNSTABLE':
      return 'instavel';
    default:
      return invalid(`campo "${field}"`);
  }
}

/** GET /api/v1/models */
export function parseModels(raw: unknown): ModelInfo[] {
  return list(obj(raw, 'resposta').items, 'items').map((m) => {
    const o = obj(m, 'modelo');
    return {
      id: str(o.id, 'id'),
      name: str(o.name, 'name'),
      description: optStr(o.description),
      groupName: optStr(o.groupName),
      algorithm: optStr(o.algorithm),
      version: optStr(o.version),
    };
  });
}

/** GET /api/v1/locations */
export function parseProbes(raw: unknown): Probe[] {
  return list(obj(raw, 'resposta').items, 'items').map((p) => {
    const o = obj(p, 'local');
    const loc = obj(o.location, 'location');
    return {
      probeId: num(o.probeId, 'probeId', 1),
      countryCode: str(o.countryCode, 'countryCode'),
      asnV4: optNum(o.asnV4),
      latitude: num(loc.latitude, 'latitude', -90, 90),
      longitude: num(loc.longitude, 'longitude', -180, 180),
    };
  });
}

function toForecast(o: Record<string, unknown>, timestamp: string, quality: Quality, qualityScore?: unknown): Forecast {
  return {
    timestamp,
    quality,
    period: periodOfHour(new Date(timestamp).getHours()),
    latencyMs: num(o.predictedAvgRttMs, 'predictedAvgRttMs'),
    packetLossPct: num(o.predictedPacketLossPct, 'predictedPacketLossPct', 0, 100),
    qualityScore: optNum(qualityScore),
  };
}

/** GET /api/v1/forecasts/probes/{id}/timeline */
export function parseTimeline(raw: unknown): Forecast[] {
  return list(obj(raw, 'resposta').items, 'items').map((i) => {
    const o = obj(i, 'item');
    return toForecast(o, iso(o.predictionFor, 'predictionFor'), parseQuality(o.quality), o.qualityScore);
  });
}

/** GET /api/v1/forecasts/probes/{id} */
export function parseProbeForecast(raw: unknown): Forecast {
  const r = obj(raw, 'resposta');
  const p = obj(r.prediction, 'prediction');
  const a = obj(r.assessment, 'assessment');
  return toForecast(p, iso(p.predictionFor, 'predictionFor'), parseQuality(a.quality, 'assessment.quality'), a.qualityScore);
}

/** POST /api/v1/activity/check */
export function parseActivityCheck(raw: unknown): { suitable: boolean; quality: Quality } {
  const r = obj(raw, 'resposta');
  if (typeof r.suitable !== 'boolean') invalid('campo "suitable"');
  return { suitable: r.suitable, quality: parseQuality(obj(r.forecast, 'forecast').quality, 'forecast.quality') };
}

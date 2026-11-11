import { ACTIVITY_API_VALUE } from '../domain/activities';
import { intervalsFromPoints } from '../domain/history';
import { startOfDay } from '../domain/time';
import type { Forecast, HistoryObservation, SourceChoice } from '../domain/types';
import { ApiError } from './errors';
import type { ConnectivityService } from './types';
import { parseActivityCheck, parseModels, parseProbeForecast, parseProbes, parseTimeline } from './validation';

/** Generoso: a API fica em plano gratuito e pode levar cerca de 1 minuto para "acordar". */
export const DEFAULT_TIMEOUT_MS = 60_000;
const TIMELINE_LIMIT = 100;
const P = '/api/v1';

interface Options {
  baseUrl: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

const dayAfter = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
const dayBefore = (d: Date, back: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - back);

/**
 * Cliente da Internet Quality API (contrato real, v0.2.0 — ver docs/API.md).
 * A API só entrega latência e perda de pacotes PREVISTAS. Nunca simula sucesso em caso de falha.
 */
export function createApiService({ baseUrl, timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl = fetch }: Options): ConnectivityService {
  const root = baseUrl.replace(/\/+$/, '');

  async function request(path: string, external?: AbortSignal, body?: unknown): Promise<unknown> {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const onExternalAbort = () => controller.abort();
    external?.addEventListener('abort', onExternalAbort);
    try {
      const res = await fetchImpl(`${root}${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      if (res.status === 404) throw new ApiError('sem-dados', 'HTTP 404');
      if (!res.ok) throw new ApiError('servidor', `HTTP ${res.status}`);
      try {
        return await res.json();
      } catch (e) {
        throw new ApiError('resposta-invalida', 'JSON malformado', e);
      }
    } catch (e) {
      if (e instanceof ApiError) throw e;
      if (timedOut) throw new ApiError('tempo-esgotado', 'Tempo esgotado', e);
      if (external?.aborted) throw new ApiError('cancelada', 'Requisição cancelada', e);
      throw new ApiError('rede', 'Falha de rede', e);
    } finally {
      clearTimeout(timer);
      external?.removeEventListener('abort', onExternalAbort);
    }
  }

  const need = (c: SourceChoice | null): SourceChoice => {
    if (!c) throw new ApiError('sem-dados', 'Modelo e ponto de referência não escolhidos');
    return c;
  };

  /** Previsão mais próxima (futura; se tudo for passado, a mais recente). */
  async function nearest(c: SourceChoice, signal?: AbortSignal): Promise<Forecast> {
    return parseProbeForecast(await request(`${P}/forecasts/probes/${c.probeId}?model_id=${encodeURIComponent(c.modelId)}`, signal));
  }

  /** Um dia civil local de previsões. 404 = sem previsões nesse dia (lista vazia). */
  async function dayTimeline(c: SourceChoice, day: Date, signal?: AbortSignal): Promise<Forecast[]> {
    const from = startOfDay(day);
    const to = dayAfter(from);
    const url =
      `${P}/forecasts/probes/${c.probeId}/timeline?model_id=${encodeURIComponent(c.modelId)}` +
      `&from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}&limit=${TIMELINE_LIMIT}`;
    try {
      return parseTimeline(await request(url, signal));
    } catch (e) {
      if (e instanceof ApiError && e.kind === 'sem-dados') return [];
      throw e;
    }
  }

  return {
    kind: 'api',

    async getModels(signal) {
      return parseModels(await request(`${P}/models`, signal));
    },

    async getProbes(signal) {
      return parseProbes(await request(`${P}/locations`, signal));
    },

    async getCurrent(choice, signal) {
      const f = await nearest(need(choice), signal);
      return {
        source: 'api',
        data: { latencyMs: f.latencyMs, packetLossPct: f.packetLossPct, quality: f.quality, measuredAt: f.timestamp, isForecast: true },
      };
    },

    async getForecasts(day, choice, signal) {
      const c = need(choice);
      let items = await dayTimeline(c, day, signal);
      if (items.length === 0) {
        // Sem previsões para o dia pedido: usa o dia da previsão mais próxima disponível (as telas mostram a data).
        items = await dayTimeline(c, new Date((await nearest(c, signal)).timestamp), signal);
      }
      if (items.length === 0) throw new ApiError('sem-dados', 'Linha do tempo vazia');
      return { source: 'api', data: items };
    },

    async getHistory(days, now, choice, signal): Promise<{ source: 'api'; data: HistoryObservation[] }> {
      const c = need(choice);
      // A API não tem observações medidas: usamos as PREVISÕES do período, um dia por requisição
      // (o limite de 100 itens por consulta cortaria uma semana inteira de previsões horárias).
      const fetchRange = (end: Date) =>
        Promise.all(Array.from({ length: days }, (_, i) => dayTimeline(c, dayBefore(end, days - 1 - i), signal))).then((a) => a.flat());
      let items = await fetchRange(now);
      if (items.length === 0) items = await fetchRange(new Date((await nearest(c, signal)).timestamp));
      return { source: 'api', data: intervalsFromPoints(items) };
    },

    async checkActivity(choice, activity, timestamp, signal) {
      const value = ACTIVITY_API_VALUE[activity];
      if (!value) return null; // valor do enum desconhecido: o app usa as regras locais
      const r = parseActivityCheck(
        await request(`${P}/activity/check`, signal, {
          modelId: choice.modelId,
          latitude: choice.latitude,
          longitude: choice.longitude,
          dateTime: timestamp,
          activity: value,
        }),
      );
      return r;
    },
  };
}

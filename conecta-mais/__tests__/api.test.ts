import { ACTIVITY_API_VALUE } from '../src/domain/activities';
import type { SourceChoice } from '../src/domain/types';
import { createApiService, DEFAULT_TIMEOUT_MS } from '../src/services/apiService';
import { ApiError, userMessage } from '../src/services/errors';
import { parseActivityCheck, parseModels, parseProbeForecast, parseProbes, parseQuality, parseTimeline } from '../src/services/validation';

const res = (body: unknown, status = 200) => Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response);
const BASE = 'https://exemplo.invalid/';
const CHOICE: SourceChoice = { modelId: 'model-a', modelName: 'Modelo A', probeId: 900001, countryCode: 'BR', latitude: -23.55, longitude: -46.63 };

// Exemplos copiados da documentação da API (v0.2.0).
const MODELS = { items: [{ id: 'model-a', name: 'Modelo A', description: 'Modelo desenvolvido pelo Grupo 1.', groupName: 'Grupo 1', algorithm: 'Linear Regression', version: '1.0' }], total: 1 };
const LOCATIONS = { items: [{ probeId: 900001, countryCode: 'BR', asnV4: 28573, asnV6: null, location: { latitude: -23.55, longitude: -46.63 } }], total: 1 };
const NEAREST = {
  model: { id: 'model-a', name: 'Modelo A', version: '1.0' },
  probeId: 900001,
  location: { latitude: -23.55, longitude: -46.63, countryCode: 'BR' },
  prediction: { predictionFor: '2026-08-20T19:00:00Z', predictedAvgRttMs: 71.4, predictedPacketLossPct: 1.5, modelConfidence: 0.82 },
  assessment: { quality: 'MODERATE', qualityScore: 68 },
  recommendation: { code: 'REDUCE_NETWORK_USAGE', message: 'x' },
};
const item = (predictionFor: string, quality = 'GOOD') => ({ predictionFor, predictedAvgRttMs: 40, predictedPacketLossPct: 0.5, quality, qualityScore: 90 });
const TIMELINE = { model: { id: 'model-a', name: 'Modelo A', version: '1.0' }, probeId: 900001, items: [item('2026-08-20T18:00:00Z'), item('2026-08-20T19:00:00Z', 'MODERATE')] };

const svc = (fetchImpl: unknown, timeoutMs?: number) => createApiService({ baseUrl: BASE, fetchImpl: fetchImpl as typeof fetch, timeoutMs });
const hang = ((_: string, init: RequestInit) => new Promise((_r, rej) => init.signal!.addEventListener('abort', () => rej(new Error('abort'))))) as unknown as typeof fetch;

describe('validação das respostas reais', () => {
  it('traduz as classes da API', () => {
    expect(['GOOD', 'MODERATE', 'UNSTABLE'].map((q) => parseQuality(q))).toEqual(['boa', 'regular', 'instavel']);
    expect(() => parseQuality('boa')).toThrow(ApiError);
    expect(() => parseQuality(undefined)).toThrow(ApiError);
  });
  it('lê modelos e pontos de referência', () => {
    expect(parseModels(MODELS)[0]).toMatchObject({ id: 'model-a', name: 'Modelo A', groupName: 'Grupo 1' });
    expect(parseProbes(LOCATIONS)[0]).toEqual({ probeId: 900001, countryCode: 'BR', asnV4: 28573, latitude: -23.55, longitude: -46.63 });
  });
  it('lê a previsão mais próxima', () => {
    expect(parseProbeForecast(NEAREST)).toMatchObject({ timestamp: '2026-08-20T19:00:00Z', quality: 'regular', latencyMs: 71.4, packetLossPct: 1.5, qualityScore: 68 });
  });
  it('lê a linha do tempo e a verificação de atividade', () => {
    expect(parseTimeline(TIMELINE).map((f) => f.quality)).toEqual(['boa', 'regular']);
    expect(parseActivityCheck({ suitable: false, forecast: { quality: 'UNSTABLE' } })).toEqual({ suitable: false, quality: 'instavel' });
  });
  it.each([
    ['sem items', {}],
    ['latência negativa', { items: [{ ...item('2026-08-20T18:00:00Z'), predictedAvgRttMs: -1 }] }],
    ['perda acima de 100', { items: [{ ...item('2026-08-20T18:00:00Z'), predictedPacketLossPct: 101 }] }],
    ['data inválida', { items: [item('ontem')] }],
    ['classe desconhecida', { items: [item('2026-08-20T18:00:00Z', 'OTIMA')] }],
  ])('rejeita linha do tempo malformada: %s', (_n, body) => {
    expect(() => parseTimeline(body)).toThrow(ApiError);
  });
  it('rejeita ponto com coordenada fora do intervalo e verificação sem "suitable"', () => {
    expect(() => parseProbes({ items: [{ probeId: 1, countryCode: 'BR', location: { latitude: 120, longitude: 0 } }] })).toThrow(ApiError);
    expect(() => parseActivityCheck({ forecast: { quality: 'GOOD' } })).toThrow(ApiError);
  });
});

describe('serviço de API', () => {
  it('usa timeout generoso para o servidor gratuito', () => {
    expect(DEFAULT_TIMEOUT_MS).toBeGreaterThanOrEqual(60_000);
  });

  it('lista modelos e pontos nas rotas certas', async () => {
    const f = jest.fn((url: string) => res(url.endsWith('/models') ? MODELS : LOCATIONS));
    const s = svc(f);
    expect((await s.getModels())[0].id).toBe('model-a');
    expect((await s.getProbes())[0].probeId).toBe(900001);
    expect(f.mock.calls.map((c) => c[0])).toEqual(['https://exemplo.invalid/api/v1/models', 'https://exemplo.invalid/api/v1/locations']);
  });

  it('getCurrent devolve a previsão mais próxima, marcada como previsão', async () => {
    const f = jest.fn(() => res(NEAREST));
    const r = await svc(f).getCurrent(CHOICE);
    expect(f).toHaveBeenCalledWith('https://exemplo.invalid/api/v1/forecasts/probes/900001?model_id=model-a', expect.anything());
    expect(r.source).toBe('api');
    expect(r.data).toMatchObject({ quality: 'regular', latencyMs: 71.4, packetLossPct: 1.5, isForecast: true });
    expect(r.data.downloadMbps).toBeUndefined();
  });

  it('sem modelo/ponto escolhidos não consulta nada', async () => {
    const f = jest.fn(() => res(NEAREST));
    await expect(svc(f).getCurrent(null)).rejects.toMatchObject({ kind: 'sem-dados' });
    expect(f).not.toHaveBeenCalled();
  });

  it('getForecasts pede o dia com from/to/limit e valida', async () => {
    const f = jest.fn(() => res(TIMELINE));
    const r = await svc(f).getForecasts(new Date(2026, 7, 20, 10), CHOICE);
    const url = new URL((f.mock.calls[0] as unknown as [string])[0]);
    expect(url.pathname).toBe('/api/v1/forecasts/probes/900001/timeline');
    expect(url.searchParams.get('model_id')).toBe('model-a');
    expect(url.searchParams.get('limit')).toBe('100');
    expect(Date.parse(url.searchParams.get('to')!) - Date.parse(url.searchParams.get('from')!)).toBeGreaterThanOrEqual(23 * 3600_000);
    expect(r.data).toHaveLength(2);
  });

  it('sem previsões no dia pedido, usa o dia da previsão mais próxima', async () => {
    let timelineCalls = 0;
    const f = jest.fn((url: string) => {
      if (url.includes('/timeline')) return ++timelineCalls === 1 ? res({}, 404) : res(TIMELINE);
      return res(NEAREST);
    });
    const r = await svc(f).getForecasts(new Date(2026, 9, 13), CHOICE);
    expect(timelineCalls).toBe(2);
    expect(r.data[0].timestamp).toBe('2026-08-20T18:00:00Z');
  });

  it('sem nenhuma previsão vira "sem-dados", sem inventar nada', async () => {
    const f = jest.fn((url: string) => (url.includes('/timeline') ? res({ items: [] }) : res(NEAREST)));
    await expect(svc(f).getForecasts(new Date(2026, 9, 13), CHOICE)).rejects.toMatchObject({ kind: 'sem-dados' });
  });

  it('histórico: uma consulta por dia (limite de 100 itens) e intervalos com duração', async () => {
    const f = jest.fn(() => res(TIMELINE));
    const r = await svc(f).getHistory(7, new Date(2026, 7, 20), CHOICE);
    expect(f).toHaveBeenCalledTimes(7);
    expect(r.source).toBe('api');
    expect(r.data.every((o) => Date.parse(o.end) > Date.parse(o.start))).toBe(true);
  });

  it('verifica atividade com o corpo do contrato; atividade sem valor de enum não chama a API', async () => {
    const f = jest.fn(() => res({ activity: 'VIDEO_CALL', suitable: true, forecast: { quality: 'GOOD' } }));
    const s = svc(f);
    const ok = await s.checkActivity!(CHOICE, 'videoconferencia', '2026-08-20T19:00:00Z');
    expect(ok).toEqual({ suitable: true, quality: 'boa' });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://exemplo.invalid/api/v1/activity/check');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ modelId: 'model-a', latitude: -23.55, longitude: -46.63, dateTime: '2026-08-20T19:00:00Z', activity: 'VIDEO_CALL' });

    expect(ACTIVITY_API_VALUE.streaming).toBeUndefined();
    expect(await s.checkActivity!(CHOICE, 'streaming', '2026-08-20T19:00:00Z')).toBeNull();
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('HTTP 500 vira "servidor"; 404 vira "sem-dados"; 422 não vira sucesso', async () => {
    await expect(svc(() => res({}, 500)).getModels()).rejects.toMatchObject({ kind: 'servidor' });
    await expect(svc(() => res({}, 404)).getCurrent(CHOICE)).rejects.toMatchObject({ kind: 'sem-dados' });
    await expect(svc(() => res({}, 422)).getProbes()).rejects.toMatchObject({ kind: 'servidor' });
  });
  it('falha de rede vira "rede" e JSON fora do contrato vira "resposta-invalida"', async () => {
    await expect(svc(() => Promise.reject(new TypeError('x'))).getModels()).rejects.toMatchObject({ kind: 'rede' });
    await expect(svc(() => res({ foo: 1 })).getModels()).rejects.toMatchObject({ kind: 'resposta-invalida' });
  });
  it('estoura o tempo limite e cancela requisições obsoletas', async () => {
    await expect(svc(hang, 20).getModels()).rejects.toMatchObject({ kind: 'tempo-esgotado' });
    const c = new AbortController();
    const p = svc(hang).getModels(c.signal);
    c.abort();
    await expect(p).rejects.toMatchObject({ kind: 'cancelada' });
  });
  it('mensagens ao usuário estão em português simples', () => {
    expect(userMessage(new ApiError('rede', 'x'))).toMatch(/internet/);
    expect(userMessage(new ApiError('servidor', 'x'))).toMatch(/indisponível/);
    expect(userMessage(new ApiError('sem-dados', 'x'))).toMatch(/ponto de referência/);
  });
});

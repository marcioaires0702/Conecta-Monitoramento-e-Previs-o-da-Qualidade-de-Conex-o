import { ACTIVITY_ORDER, API_ACTIVITY_RULES, assessActivity, assessAll, DEFAULT_ACTIVITY_RULES } from '../src/domain/activities';
import { computeShares, dailySummaries, filterRange, intervalsFromPoints } from '../src/domain/history';
import { classifyQuality, GLOSSARY, QUALITY_DESCRIPTION, QUALITY_LABEL } from '../src/domain/quality';
import { periodOfHour } from '../src/domain/time';
import type { HistoryObservation } from '../src/domain/types';

describe('classificação de qualidade', () => {
  it('classifica Boa, Regular e Instável', () => {
    expect(classifyQuality({ latencyMs: 18, downloadMbps: 87, uploadMbps: 42 })).toBe('boa');
    expect(classifyQuality({ latencyMs: 45, downloadMbps: 45, uploadMbps: 20 })).toBe('regular');
    expect(classifyQuality({ latencyMs: 80, downloadMbps: 14, uploadMbps: 4 })).toBe('regular');
    expect(classifyQuality({ latencyMs: 200, downloadMbps: 2, uploadMbps: 1 })).toBe('instavel');
  });
  it('usa os rótulos e definições oficiais do documento', () => {
    expect(QUALITY_LABEL).toEqual({ boa: 'Boa', regular: 'Regular', instavel: 'Instável' });
    expect(QUALITY_DESCRIPTION.boa).toBe('Conexão estável, ideal para atividades que exigem mais velocidade e baixa latência.');
    expect(GLOSSARY.map((g) => g.term)).toEqual(['Latência', 'Download', 'Upload', 'Jitter', 'Perda de pacotes']);
  });
  it('mapeia horas em períodos', () => {
    expect([0, 5, 6, 11, 12, 17, 18, 23].map(periodOfHour)).toEqual(['madrugada', 'madrugada', 'manha', 'manha', 'tarde', 'tarde', 'noite', 'noite']);
  });
});

describe('avaliação de atividades', () => {
  const boa = { latencyMs: 18, downloadMbps: 87, uploadMbps: 42 };
  const lenta = { latencyMs: 90, downloadMbps: 12, uploadMbps: 3 };
  const ruim = { latencyMs: 400, downloadMbps: 0.5, uploadMbps: 0.2 };

  it('cobre as cinco atividades', () => {
    expect(assessAll(boa).map((a) => a.activity)).toEqual(ACTIVITY_ORDER);
  });
  it('conexão boa é Boa para tudo', () => {
    expect(assessAll(boa).every((a) => a.quality === 'boa')).toBe(true);
  });
  it('conexão intermediária afeta atividades sensíveis a latência', () => {
    expect(assessActivity('videoconferencia', lenta).quality).toBe('regular');
    expect(assessActivity('jogos', lenta).quality).toBe('instavel');
    expect(assessActivity('navegacao', lenta).quality).toBe('boa');
  });
  it('conexão ruim é Instável', () => {
    expect(assessAll(ruim).every((a) => a.quality === 'instavel')).toBe(true);
  });
  it('aceita regras configuráveis', () => {
    const rules = { ...DEFAULT_ACTIVITY_RULES, navegacao: { ideal: { latencyMs: 5 }, minimo: { latencyMs: 10 } } };
    expect(assessActivity('navegacao', lenta, rules).quality).toBe('instavel');
  });
});

const h = (day: number, from: number, to: number, quality: HistoryObservation['quality']): HistoryObservation => ({
  start: new Date(2026, 9, day, from).toISOString(),
  end: new Date(2026, 9, day, to).toISOString(),
  quality,
});

describe('histórico', () => {
  it('pondera percentuais pela duração, não pela contagem de amostras', () => {
    // 3 intervalos curtos instáveis (1h cada) + 1 intervalo longo bom (21h) => 21/24 = 87,5% / 12,5%
    const obs = [h(13, 0, 21, 'boa'), h(13, 21, 22, 'instavel'), h(13, 22, 23, 'instavel'), h(13, 23, 24, 'instavel')];
    const s = computeShares(obs)!;
    expect(s.boa).toBe(88);
    expect(s.instavel).toBe(13 - 1); // 12
    expect(s.boa + s.regular + s.instavel).toBe(100);
  });
  it('soma sempre 100%', () => {
    const s = computeShares([h(13, 0, 8, 'boa'), h(13, 8, 16, 'regular'), h(13, 16, 24, 'instavel')])!;
    expect(s.boa + s.regular + s.instavel).toBe(100);
  });
  it('retorna null sem dados e ignora intervalos inválidos', () => {
    expect(computeShares([])).toBeNull();
    expect(computeShares([h(13, 5, 5, 'boa')])).toBeNull();
  });
  it('filtra por intervalo e resume por dia', () => {
    const obs = [h(12, 0, 24, 'regular'), h(13, 0, 12, 'boa'), h(13, 12, 24, 'instavel')];
    const now = new Date(2026, 9, 13, 10);
    expect(filterRange(obs, new Date(2026, 9, 13), new Date(2026, 9, 14))).toHaveLength(2);
    const d = dailySummaries(obs, now, 3);
    expect(d.map((x) => x.dominant)).toEqual([null, 'regular', 'boa']);
  });
});

describe('dados da API (só latência e perda de pacotes)', () => {
  it('perda de pacotes alta reprova atividades sensíveis, mesmo com latência boa', () => {
    const m = { latencyMs: 30, packetLossPct: 6 };
    const r = assessAll(m, API_ACTIVITY_RULES);
    expect(r.find((a) => a.activity === 'videoconferencia')!.quality).toBe('instavel');
    expect(r.find((a) => a.activity === 'jogos')!.quality).toBe('instavel');
  });
  it('conexão boa prevista é Boa para tudo; métrica ausente não reprova', () => {
    const r = assessAll({ latencyMs: 20, packetLossPct: 0.1 }, API_ACTIVITY_RULES);
    expect(r.every((a) => a.quality === 'boa')).toBe(true);
    // Regras de demonstração com métrica ausente: só latência é avaliada (download/upload ausentes não reprovam).
    expect(assessActivity('envio', { latencyMs: 20 }).quality).toBe('boa');
  });
  it('intervalsFromPoints: cada ponto vale até o próximo, limitado a 6 h, e os percentuais somam 100', () => {
    const iv = intervalsFromPoints([
      { timestamp: '2026-08-20T10:00:00Z', quality: 'boa' },
      { timestamp: '2026-08-20T11:00:00Z', quality: 'regular' },
      { timestamp: '2026-08-21T11:00:00Z', quality: 'instavel' },
    ]);
    expect(iv).toHaveLength(3);
    expect(Date.parse(iv[0].end) - Date.parse(iv[0].start)).toBe(3600_000);
    expect(Date.parse(iv[1].end) - Date.parse(iv[1].start)).toBe(6 * 3600_000); // lacuna de 24 h limitada a 6 h
    expect(Date.parse(iv[2].end) - Date.parse(iv[2].start)).toBe(3600_000); // último: menor diferença observada
    const s = computeShares(iv)!;
    expect(s.boa + s.regular + s.instavel).toBe(100);
  });
  it('intervalsFromPoints ignora lista vazia', () => {
    expect(intervalsFromPoints([])).toEqual([]);
  });
});

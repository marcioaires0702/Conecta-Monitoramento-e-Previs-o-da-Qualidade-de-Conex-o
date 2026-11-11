import type { ActivityAssessment, ActivityId, Metrics, Quality } from './types';

export const ACTIVITY_LABEL: Record<ActivityId, string> = {
  videoconferencia: 'Videoconferência',
  streaming: 'Streaming',
  jogos: 'Jogos online',
  navegacao: 'Navegação',
  envio: 'Envio de arquivos',
};

export const ACTIVITY_ORDER: ActivityId[] = [
  'videoconferencia',
  'streaming',
  'jogos',
  'navegacao',
  'envio',
];

/**
 * Requisitos mínimos CONFIGURÁVEIS por atividade (valores assumidos, não validados
 * cientificamente). "ideal" => Boa; "minimo" => Regular; abaixo => Instável.
 */
export interface ActivityRequirement {
  ideal: Partial<Metrics>;
  minimo: Partial<Metrics>;
}

export type ActivityRules = Record<ActivityId, ActivityRequirement>;

export const DEFAULT_ACTIVITY_RULES: ActivityRules = {
  videoconferencia: {
    ideal: { latencyMs: 50, downloadMbps: 10, uploadMbps: 5 },
    minimo: { latencyMs: 120, downloadMbps: 3, uploadMbps: 2 },
  },
  streaming: {
    ideal: { downloadMbps: 25 },
    minimo: { downloadMbps: 8 },
  },
  jogos: {
    ideal: { latencyMs: 40, downloadMbps: 10 },
    minimo: { latencyMs: 80, downloadMbps: 3 },
  },
  navegacao: {
    ideal: { latencyMs: 100, downloadMbps: 5 },
    minimo: { latencyMs: 300, downloadMbps: 1 },
  },
  envio: {
    ideal: { uploadMbps: 10 },
    minimo: { uploadMbps: 2 },
  },
};

/**
 * Regras para dados da API, que só trazem latência e perda de pacotes previstas.
 * Valores ASSUMIDOS (não validados cientificamente), configuráveis aqui.
 */
export const API_ACTIVITY_RULES: ActivityRules = {
  videoconferencia: {
    ideal: { latencyMs: 80, packetLossPct: 1 },
    minimo: { latencyMs: 150, packetLossPct: 3 },
  },
  streaming: {
    ideal: { latencyMs: 150, packetLossPct: 1 },
    minimo: { latencyMs: 300, packetLossPct: 3 },
  },
  jogos: {
    ideal: { latencyMs: 50, packetLossPct: 0.5 },
    minimo: { latencyMs: 100, packetLossPct: 2 },
  },
  navegacao: {
    ideal: { latencyMs: 150, packetLossPct: 2 },
    minimo: { latencyMs: 400, packetLossPct: 5 },
  },
  envio: {
    ideal: { latencyMs: 200, packetLossPct: 1 },
    minimo: { latencyMs: 400, packetLossPct: 3 },
  },
};

/**
 * Valor de cada atividade no campo `activity` de POST /activity/check.
 * Só VIDEO_CALL está CONFIRMADO (aparece na documentação da API). Os demais valores do enum
 * ActivityType ainda não foram informados: sem valor aqui, o app usa as regras locais, em vez de
 * arriscar um erro 422. Quando souber a lista, preencha abaixo.
 */
export const ACTIVITY_API_VALUE: Partial<Record<ActivityId, string>> = {
  videoconferencia: 'VIDEO_CALL',
};

const MESSAGES: Record<ActivityId, Record<Quality, string>> = {
  videoconferencia: {
    boa: 'Deve funcionar bem.',
    regular: 'Pode apresentar instabilidades.',
    instavel: 'Não recomendada: podem ocorrer travamentos e quedas.',
  },
  streaming: {
    boa: 'Reprodução fluida.',
    regular: 'Pode haver pausas ou queda na qualidade do vídeo.',
    instavel: 'Não recomendado: a reprodução deve travar com frequência.',
  },
  jogos: {
    boa: 'Deve funcionar bem.',
    regular: 'Pode apresentar instabilidades.',
    instavel: 'Não recomendado: atrasos frequentes.',
  },
  navegacao: {
    boa: 'Funciona bem.',
    regular: 'Funciona, mas páginas podem demorar mais.',
    instavel: 'Podem ocorrer falhas ao abrir páginas.',
  },
  envio: {
    boa: 'Sem problemas previstos.',
    regular: 'Funciona, mas pode ser mais lento.',
    instavel: 'Não recomendado: o envio pode falhar.',
  },
};

/**
 * Um requisito só é avaliado se a métrica existir. Métrica ausente NÃO aprova nem reprova;
 * por isso as regras da API (ver API_ACTIVITY_RULES) só usam latência e perda de pacotes.
 */
function meets(m: Metrics, req: Partial<Metrics>): boolean {
  if (req.latencyMs !== undefined && m.latencyMs > req.latencyMs) return false;
  if (req.packetLossPct !== undefined && m.packetLossPct !== undefined && m.packetLossPct > req.packetLossPct) return false;
  if (req.downloadMbps !== undefined && m.downloadMbps !== undefined && m.downloadMbps < req.downloadMbps) return false;
  if (req.uploadMbps !== undefined && m.uploadMbps !== undefined && m.uploadMbps < req.uploadMbps) return false;
  return true;
}

export function assessActivity(
  activity: ActivityId,
  metrics: Metrics,
  rules: ActivityRules = DEFAULT_ACTIVITY_RULES,
): ActivityAssessment {
  const rule = rules[activity];
  const quality: Quality = meets(metrics, rule.ideal)
    ? 'boa'
    : meets(metrics, rule.minimo)
      ? 'regular'
      : 'instavel';
  return { activity, quality, message: MESSAGES[activity][quality] };
}

export function assessAll(metrics: Metrics, rules?: ActivityRules): ActivityAssessment[] {
  return ACTIVITY_ORDER.map((a) => assessActivity(a, metrics, rules));
}

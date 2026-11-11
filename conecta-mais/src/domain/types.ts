export type Quality = 'boa' | 'regular' | 'instavel';
export type DataSource = 'demonstracao' | 'api' | 'indisponivel';

/**
 * Latência e perda de pacotes são o que a API real entrega (valores PREVISTOS).
 * Download e upload só existem nos dados de demonstração.
 */
export interface Metrics {
  latencyMs: number;
  packetLossPct?: number;
  downloadMbps?: number;
  uploadMbps?: number;
}

/** Métricas completas: só existem nos dados de demonstração. */
export type FullMetrics = Required<Pick<Metrics, 'latencyMs' | 'downloadMbps' | 'uploadMbps'>>;

export interface Forecast extends Metrics {
  /** ISO 8601 */
  timestamp: string;
  quality: Quality;
  period: Period;
  /** Pontuação 0–100 informada pela API (regra de negócio da API, não do RIPE Atlas). */
  qualityScore?: number;
}

export type Period = 'madrugada' | 'manha' | 'tarde' | 'noite';

export type ActivityId = 'videoconferencia' | 'streaming' | 'jogos' | 'navegacao' | 'envio';

export interface ActivityAssessment {
  activity: ActivityId;
  quality: Quality;
  /** Mensagem curta em pt-BR */
  message: string;
}

export interface HistoryObservation {
  /** ISO 8601, início do intervalo */
  start: string;
  /** ISO 8601, fim do intervalo */
  end: string;
  quality: Quality;
}

export interface Sourced<T> {
  data: T;
  source: DataSource;
}

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  groupName?: string;
  algorithm?: string;
  version?: string;
}

/** Ponto de referência (sonda RIPE Atlas). NÃO é a localização do usuário. */
export interface Probe {
  probeId: number;
  countryCode: string;
  asnV4?: number;
  latitude: number;
  longitude: number;
}

/** Escolha persistida do usuário: modelo de previsão + ponto de referência. */
export interface SourceChoice {
  modelId: string;
  modelName: string;
  probeId: number;
  countryCode: string;
  latitude: number;
  longitude: number;
}

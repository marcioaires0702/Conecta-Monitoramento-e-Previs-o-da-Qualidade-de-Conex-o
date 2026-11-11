import type { ActivityId, Forecast, HistoryObservation, Metrics, ModelInfo, Probe, Quality, SourceChoice, Sourced } from '../domain/types';

export interface CurrentConnection extends Metrics {
  quality: Quality;
  /** Quando foi medido (demo) ou para quando é a previsão (API). */
  measuredAt: string;
  /** true quando o valor é uma PREVISÃO: a API real não tem medição atual. */
  isForecast?: boolean;
}

export interface ActivityCheck {
  suitable: boolean;
  quality: Quality;
}

export interface ConnectivityService {
  /** 'api' exige modelo e ponto de referência escolhidos pelo usuário. */
  kind: 'demo' | 'api';
  getModels(signal?: AbortSignal): Promise<ModelInfo[]>;
  getProbes(signal?: AbortSignal): Promise<Probe[]>;
  getCurrent(choice: SourceChoice | null, signal?: AbortSignal): Promise<Sourced<CurrentConnection>>;
  getForecasts(day: Date, choice: SourceChoice | null, signal?: AbortSignal): Promise<Sourced<Forecast[]>>;
  getHistory(days: number, now: Date, choice: SourceChoice | null, signal?: AbortSignal): Promise<Sourced<HistoryObservation[]>>;
  /** Só existe quando a API avalia atividades (POST /activity/check). */
  checkActivity?(choice: SourceChoice, activity: ActivityId, timestamp: string, signal?: AbortSignal): Promise<ActivityCheck | null>;
}

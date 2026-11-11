import { classifyQuality } from '../domain/quality';
import { DEMO_CURRENT, demoForecastsForDay, demoHistory } from '../fixtures/demo';
import type { ConnectivityService } from './types';

/** Serviço local de demonstração. Substituível pelo serviço real sem mudar a UI. */
export function createDemoService(now: () => Date = () => new Date()): ConnectivityService {
  return {
    kind: 'demo',
    async getModels() {
      return [];
    },
    async getProbes() {
      return [];
    },
    async getCurrent() {
      return {
        source: 'demonstracao',
        data: { ...DEMO_CURRENT, quality: classifyQuality(DEMO_CURRENT), measuredAt: now().toISOString() },
      };
    },
    async getForecasts(day) {
      return { source: 'demonstracao', data: demoForecastsForDay(day) };
    },
    async getHistory(days, ref) {
      return { source: 'demonstracao', data: demoHistory(days, ref) };
    },
  };
}

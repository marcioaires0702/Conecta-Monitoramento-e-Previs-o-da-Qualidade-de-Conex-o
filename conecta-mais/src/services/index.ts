import { createApiService } from './apiService';
import { createDemoService } from './demoService';
import type { ConnectivityService } from './types';

/** Usa a API real apenas se EXPO_PUBLIC_API_URL estiver definida (valor público, sem segredos). */
export function createDefaultService(): ConnectivityService {
  const url = process.env.EXPO_PUBLIC_API_URL;
  return url ? createApiService({ baseUrl: url }) : createDemoService();
}

export type { ActivityCheck, ConnectivityService, CurrentConnection } from './types';

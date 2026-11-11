import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { SourceChoice } from '../domain/types';
import { useService } from './service';

export const CHOICE_KEY = 'conecta:fonte:v1';

/** Aceita apenas objetos com todos os campos esperados; qualquer outra coisa vira null. */
export function sanitizeChoice(raw: unknown): SourceChoice | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const ok =
    typeof r.modelId === 'string' &&
    typeof r.modelName === 'string' &&
    typeof r.countryCode === 'string' &&
    typeof r.probeId === 'number' &&
    typeof r.latitude === 'number' &&
    typeof r.longitude === 'number';
  if (!ok) return null;
  return {
    modelId: r.modelId as string,
    modelName: r.modelName as string,
    probeId: r.probeId as number,
    countryCode: r.countryCode as string,
    latitude: r.latitude as number,
    longitude: r.longitude as number,
  };
}

interface Ctx {
  choice: SourceChoice | null;
  /** false enquanto a escolha salva ainda está sendo lida do aparelho. */
  ready: boolean;
  save: (c: SourceChoice) => void;
}
const SourceChoiceContext = createContext<Ctx | null>(null);

/**
 * Modelo + ponto de referência escolhidos. As coordenadas são de uma sonda pública (RIPE Atlas),
 * não do usuário. `initial` (testes) dispensa a leitura do armazenamento.
 */
export function SourceChoiceProvider({ children, initial }: { children: React.ReactNode; initial?: SourceChoice | null }) {
  const [choice, setChoice] = useState<SourceChoice | null>(initial ?? null);
  const [ready, setReady] = useState(initial !== undefined);

  useEffect(() => {
    if (initial !== undefined) return;
    let alive = true;
    AsyncStorage.getItem(CHOICE_KEY)
      .then((v) => {
        if (alive && v) setChoice(sanitizeChoice(JSON.parse(v)));
      })
      .catch((e) => console.warn('Não foi possível carregar a escolha de modelo.', e))
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [initial]);

  const save = useCallback((c: SourceChoice) => {
    setChoice(c);
    AsyncStorage.setItem(CHOICE_KEY, JSON.stringify(c)).catch((e) => console.warn('Não foi possível salvar a escolha.', e));
  }, []);

  const value = useMemo(() => ({ choice, ready, save }), [choice, ready, save]);
  return <SourceChoiceContext.Provider value={value}>{children}</SourceChoiceContext.Provider>;
}

export function useSourceChoice(): Ctx {
  const c = useContext(SourceChoiceContext);
  if (!c) throw new Error('useSourceChoice deve ser usado dentro de SourceChoiceProvider');
  return c;
}

/**
 * Porteiro das consultas: no modo demonstração tudo roda; no modo API só depois que o usuário
 * escolheu modelo e ponto de referência.
 */
export function useSourceGate() {
  const service = useService();
  const { choice, ready } = useSourceChoice();
  const isApi = service.kind === 'api';
  return {
    isApi,
    choice,
    enabled: !isApi || (ready && !!choice),
    needsChoice: isApi && ready && !choice,
  };
}

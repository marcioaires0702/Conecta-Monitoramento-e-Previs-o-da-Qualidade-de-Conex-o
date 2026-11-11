import { useEffect, useMemo, useState } from 'react';
import { ACTIVITY_API_VALUE, ACTIVITY_ORDER, API_ACTIVITY_RULES, assessAll } from '../domain/activities';
import type { ActivityAssessment, ActivityId, Forecast } from '../domain/types';
import { ApiError } from '../services/errors';
import { useService } from './service';
import { useSourceChoice } from './sourceChoice';

/** Resultado por atividade e a origem de cada avaliação. */
export interface Assessments {
  items: ActivityAssessment[];
  /** Atividades avaliadas pela API (POST /activity/check); as demais são estimativas do app. */
  fromApi: ActivityId[];
  /** true enquanto as consultas à API ainda estão em andamento. */
  checking: boolean;
}

const MESSAGE_SUITABLE = 'Adequada para este horário (avaliação do serviço).';
const MESSAGE_UNSUITABLE = 'Não recomendada neste horário (avaliação do serviço).';

/**
 * Avaliação por atividade. Base: regras locais configuráveis (demo: todas as métricas; API:
 * latência e perda de pacotes). Quando o serviço avalia a atividade (hoje só videoconferência),
 * a resposta da API substitui a estimativa local. Se a consulta falhar, mantém a estimativa local
 * (sempre identificada como estimativa) em vez de esconder a atividade.
 */
export function useActivityAssessments(forecast: Forecast | undefined): Assessments {
  const service = useService();
  const { choice } = useSourceChoice();
  const isApi = service.kind === 'api';
  const check = service.checkActivity;
  const ts = forecast?.timestamp;

  const local = useMemo(() => (forecast ? assessAll(forecast, isApi ? API_ACTIVITY_RULES : undefined) : []), [forecast, isApi]);
  const [remote, setRemote] = useState<{ ts: string; items: Map<ActivityId, ActivityAssessment> } | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!isApi || !check || !choice || !ts) {
      setRemote(null);
      return;
    }
    const controller = new AbortController();
    const ids = ACTIVITY_ORDER.filter((a) => ACTIVITY_API_VALUE[a]);
    setChecking(true);
    Promise.all(
      ids.map(async (activity): Promise<ActivityAssessment | null> => {
        try {
          const r = await check.call(service, choice, activity, ts, controller.signal);
          if (!r) return null;
          // Inadequada = "Instável" para a atividade; adequada herda a classe prevista (no máx. Regular se a API disser Instável).
          const quality = !r.suitable ? 'instavel' : r.quality === 'instavel' ? 'regular' : r.quality;
          return { activity, quality, message: r.suitable ? MESSAGE_SUITABLE : MESSAGE_UNSUITABLE };
        } catch (e) {
          if (e instanceof ApiError && e.kind === 'cancelada') throw e;
          return null; // falhou: fica a estimativa local, identificada como tal
        }
      }),
    )
      .then((list) => {
        if (controller.signal.aborted) return;
        const items = new Map<ActivityId, ActivityAssessment>();
        for (const a of list) if (a) items.set(a.activity, a);
        setRemote({ ts, items });
      })
      .catch(() => undefined)
      .finally(() => {
        if (!controller.signal.aborted) setChecking(false);
      });
    return () => controller.abort();
  }, [service, check, choice, ts, isApi]);

  const current = remote && remote.ts === ts ? remote.items : null;
  const items = local.map((a) => current?.get(a.activity) ?? a);
  const fromApi = local.filter((a) => current?.has(a.activity)).map((a) => a.activity);
  return { items, fromApi, checking };
}

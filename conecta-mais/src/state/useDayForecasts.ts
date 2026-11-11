import { useMemo } from 'react';
import { isSameDay } from '../domain/time';
import type { Forecast } from '../domain/types';
import { useClock } from './clock';
import { useService } from './service';
import { useSourceGate } from './sourceChoice';
import { useAsync } from './useAsync';

/**
 * Previsões do dia. Se forem de hoje, horas passadas não são oferecidas. Se a API só tiver
 * previsões de outro dia, todas aparecem e `isToday` é false (as telas mostram a data).
 */
export function useDayForecasts() {
  const service = useService();
  const clock = useClock();
  const { choice, enabled, needsChoice } = useSourceGate();
  const day = useMemo(() => clock(), [clock]);
  const state = useAsync(async (signal) => service.getForecasts(day, choice, signal), [service, day, choice], enabled);
  const first = state.status === 'ok' ? state.data.data[0] : undefined;
  const isToday = !!first && isSameDay(new Date(first.timestamp), day);
  const upcoming: Forecast[] = useMemo(() => {
    if (state.status !== 'ok') return [];
    const all = state.data.data;
    if (!isToday) return all;
    return all.filter((f) => new Date(f.timestamp).getHours() >= day.getHours());
  }, [state, day, isToday]);
  return { ...state, now: day, upcoming, needsChoice, isToday };
}

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ActivityId, Period } from '../domain/types';

interface Selection {
  /** ISO do horário escolhido, ou null enquanto nada foi escolhido. */
  timestamp: string | null;
  period: Period | null;
  activity: ActivityId;
}

interface Ctx extends Selection {
  selectTime: (timestamp: string, period: Period) => void;
  selectActivity: (activity: ActivityId) => void;
}

const SelectionContext = createContext<Ctx | null>(null);

export function SelectionProvider({ children, initial }: { children: React.ReactNode; initial?: Partial<Selection> }) {
  const [state, setState] = useState<Selection>({ timestamp: null, period: null, activity: 'videoconferencia', ...initial });
  const selectTime = useCallback((timestamp: string, period: Period) => setState((s) => ({ ...s, timestamp, period })), []);
  const selectActivity = useCallback((activity: ActivityId) => setState((s) => ({ ...s, activity })), []);
  const value = useMemo(() => ({ ...state, selectTime, selectActivity }), [state, selectTime, selectActivity]);
  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelection(): Ctx {
  const c = useContext(SelectionContext);
  if (!c) throw new Error('useSelection deve ser usado dentro de SelectionProvider');
  return c;
}

import React, { createContext, useContext } from 'react';

type Clock = () => Date;
const ClockContext = createContext<Clock>(() => new Date());

/** Relógio injetável: permite testes determinísticos. */
export function ClockProvider({ now, children }: { now: Clock; children: React.ReactNode }) {
  return <ClockContext.Provider value={now}>{children}</ClockContext.Provider>;
}
export function useClock(): Clock {
  return useContext(ClockContext);
}

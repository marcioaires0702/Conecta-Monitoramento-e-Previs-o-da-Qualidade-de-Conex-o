import React, { createContext, useContext, useMemo } from 'react';
import { createDefaultService, type ConnectivityService } from '../services';

const ServiceContext = createContext<ConnectivityService | null>(null);

export function ServiceProvider({ children, service }: { children: React.ReactNode; service?: ConnectivityService }) {
  const value = useMemo(() => service ?? createDefaultService(), [service]);
  return <ServiceContext.Provider value={value}>{children}</ServiceContext.Provider>;
}

export function useService(): ConnectivityService {
  const c = useContext(ServiceContext);
  if (!c) throw new Error('useService deve ser usado dentro de ServiceProvider');
  return c;
}

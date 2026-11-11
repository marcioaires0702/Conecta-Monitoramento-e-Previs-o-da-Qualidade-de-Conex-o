import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { highContrastPalette, standardPalette, type Palette } from '../theme';

export type FontSize = 'padrao' | 'grande' | 'muito-grande';

export interface Preferences {
  fontSize: FontSize;
  highContrast: boolean;
  simplifiedNavigation: boolean;
  iconDescriptions: boolean;
  plainLanguage: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  fontSize: 'padrao',
  highContrast: false,
  simplifiedNavigation: false,
  iconDescriptions: true,
  plainLanguage: true,
};

export const FONT_SCALE: Record<FontSize, number> = { padrao: 1, grande: 1.25, 'muito-grande': 1.5 };
export const FONT_LABEL: Record<FontSize, string> = {
  padrao: 'Padrão',
  grande: 'Grande',
  'muito-grande': 'Muito grande',
};
export const FONT_ORDER: FontSize[] = ['padrao', 'grande', 'muito-grande'];

export const STORAGE_KEY = 'conecta:preferencias:v1';

/** Aceita apenas campos conhecidos com tipos válidos; ignora o resto. */
export function sanitizePreferences(raw: unknown): Preferences {
  const out = { ...DEFAULT_PREFERENCES };
  if (typeof raw !== 'object' || raw === null) return out;
  const r = raw as Record<string, unknown>;
  if (typeof r.fontSize === 'string' && (FONT_ORDER as string[]).includes(r.fontSize)) out.fontSize = r.fontSize as FontSize;
  if (typeof r.highContrast === 'boolean') out.highContrast = r.highContrast;
  if (typeof r.simplifiedNavigation === 'boolean') out.simplifiedNavigation = r.simplifiedNavigation;
  if (typeof r.iconDescriptions === 'boolean') out.iconDescriptions = r.iconDescriptions;
  if (typeof r.plainLanguage === 'boolean') out.plainLanguage = r.plainLanguage;
  return out;
}

interface Ctx {
  prefs: Preferences;
  palette: Palette;
  fontScale: number;
  ready: boolean;
  update: (patch: Partial<Preferences>) => void;
}

const PreferencesContext = createContext<Ctx | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (alive && v) setPrefs(sanitizePreferences(JSON.parse(v)));
      })
      .catch((e) => console.warn('Não foi possível carregar as preferências.', e))
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  const update = useCallback((patch: Partial<Preferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((e) =>
        console.warn('Não foi possível salvar as preferências.', e),
      );
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      prefs,
      palette: prefs.highContrast ? highContrastPalette : standardPalette,
      fontScale: FONT_SCALE[prefs.fontSize],
      ready,
      update,
    }),
    [prefs, ready, update],
  );
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): Ctx {
  const c = useContext(PreferencesContext);
  if (!c) throw new Error('usePreferences deve ser usado dentro de PreferencesProvider');
  return c;
}

import type { Quality } from '../domain/types';

export interface Palette {
  navy: string;
  primary: string;
  onPrimary: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  borderWidth: number;
  info: string;
  quality: Record<Quality, { fg: string; bg: string; border: string }>;
}

export const standardPalette: Palette = {
  navy: '#0B1B3A',
  primary: '#2563EB',
  onPrimary: '#FFFFFF',
  background: '#EEF4FF',
  surface: '#FFFFFF',
  surfaceAlt: '#E3EDFF',
  text: '#0F172A',
  textMuted: '#475569',
  border: '#CBD5E1',
  borderWidth: 1,
  info: '#DBEAFE',
  quality: {
    boa: { fg: '#166534', bg: '#DCFCE7', border: '#16A34A' },
    regular: { fg: '#854D0E', bg: '#FEF3C7', border: '#CA8A04' },
    instavel: { fg: '#991B1B', bg: '#FEE2E2', border: '#DC2626' },
  },
};

export const highContrastPalette: Palette = {
  navy: '#000000',
  primary: '#1E3A8A',
  onPrimary: '#FFFFFF',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#FFFFFF',
  text: '#000000',
  textMuted: '#1F2937',
  border: '#000000',
  borderWidth: 2,
  info: '#FFFFFF',
  quality: {
    boa: { fg: '#14532D', bg: '#FFFFFF', border: '#14532D' },
    regular: { fg: '#713F12', bg: '#FFFFFF', border: '#713F12' },
    instavel: { fg: '#7F1D1D', bg: '#FFFFFF', border: '#7F1D1D' },
  },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
/** Área mínima de toque (RNF09). */
export const MIN_TOUCH = 48;

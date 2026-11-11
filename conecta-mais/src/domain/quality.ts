import type { Quality } from './types';

export const QUALITY_LABEL: Record<Quality, string> = {
  boa: 'Boa',
  regular: 'Regular',
  instavel: 'Instável',
};

/** Definições oficiais do Documento de Requisitos (Considerações Finais). */
export const QUALITY_DESCRIPTION: Record<Quality, string> = {
  boa: 'Conexão estável, ideal para atividades que exigem mais velocidade e baixa latência.',
  regular:
    'Pode haver lentidão ou pequenas instabilidades. Algumas atividades podem ser afetadas.',
  instavel:
    'Conexão com falhas frequentes. Não é recomendada para atividades que exigem estabilidade.',
};

export const GLOSSARY: { term: string; meaning: string }[] = [
  { term: 'Latência', meaning: 'É o tempo que os dados levam para ir e voltar.' },
  { term: 'Download', meaning: 'É a velocidade com que os dados chegam ao seu dispositivo.' },
  { term: 'Upload', meaning: 'É a velocidade com que os dados saem do seu dispositivo.' },
  { term: 'Jitter', meaning: 'É a variação do tempo de resposta.' },
  { term: 'Perda de pacotes', meaning: 'É quando alguns dados não chegam ao destino.' },
];

/**
 * Limiares ASSUMIDOS (decisão de engenharia, não validados cientificamente).
 * Usados apenas para classificar quando a API não informa a classe.
 */
export const QUALITY_THRESHOLDS = {
  boa: { maxLatencyMs: 30, minDownloadMbps: 50, minUploadMbps: 20 },
  regular: { maxLatencyMs: 100, minDownloadMbps: 10, minUploadMbps: 3 },
} as const;

/** Usado só nos dados de demonstração (a API real já informa a classe). */
export function classifyQuality(m: { latencyMs: number; downloadMbps: number; uploadMbps: number }): Quality {
  const b = QUALITY_THRESHOLDS.boa;
  const r = QUALITY_THRESHOLDS.regular;
  if (m.latencyMs <= b.maxLatencyMs && m.downloadMbps >= b.minDownloadMbps && m.uploadMbps >= b.minUploadMbps)
    return 'boa';
  if (m.latencyMs <= r.maxLatencyMs && m.downloadMbps >= r.minDownloadMbps && m.uploadMbps >= r.minUploadMbps)
    return 'regular';
  return 'instavel';
}

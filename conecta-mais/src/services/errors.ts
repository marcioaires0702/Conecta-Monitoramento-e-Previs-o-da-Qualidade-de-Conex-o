export type ApiErrorKind = 'rede' | 'tempo-esgotado' | 'resposta-invalida' | 'servidor' | 'sem-dados' | 'cancelada';

export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Mensagens em linguagem simples (RNF12). */
export function userMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.kind) {
      case 'rede':
        return 'Não foi possível se conectar. Verifique sua internet e tente de novo.';
      case 'tempo-esgotado':
        return 'O serviço demorou demais para responder. Ele pode estar “acordando”; tente novamente em instantes.';
      case 'resposta-invalida':
        return 'Recebemos dados que não conseguimos entender. Tente novamente mais tarde.';
      case 'servidor':
        return 'O serviço de previsões está indisponível no momento. Tente mais tarde.';
      case 'sem-dados':
        return 'Ainda não há previsões para este modelo e ponto de referência. Tente escolher outro.';
      case 'cancelada':
        return '';
    }
  }
  return 'Algo deu errado. Tente novamente.';
}

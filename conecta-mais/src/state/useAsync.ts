import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, userMessage } from '../services/errors';

export type AsyncState<T> =
  | { status: 'loading'; data: T | null; error: null }
  | { status: 'ok'; data: T; error: null }
  | { status: 'error'; data: null; error: string };

/**
 * Executa `fn` ao montar e quando `deps` mudam. Cancela a requisição anterior e ignora
 * respostas obsoletas (não sobrescrevem seleções mais novas). Com `enabled=false` não executa
 * (ex.: ainda falta o usuário escolher modelo e ponto de referência).
 */
export function useAsync<T>(fn: (signal: AbortSignal) => Promise<T>, deps: unknown[], enabled = true) {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading', data: null, error: null });
  const [nonce, setNonce] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setState((s) => ({ status: 'loading', data: s.data, error: null }));
    fnRef
      .current(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ status: 'ok', data, error: null });
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.kind === 'cancelada') return;
        setState({ status: 'error', data: null, error: userMessage(e) });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce, enabled]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}

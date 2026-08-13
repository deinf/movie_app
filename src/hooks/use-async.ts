import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
  refetch: () => void;
}

interface Settled<T> {
  key: string;
  data?: T;
  error?: Error;
}

export function useAsync<T>(fn: () => Promise<T>, deps: readonly unknown[] = []): AsyncState<T> {
  const [nonce, setNonce] = useState(0);
  const [settled, setSettled] = useState<Settled<T>>({ key: '' });

  // identifies the run, so a slow response that has been superseded is ignored
  const key = JSON.stringify([deps, nonce]);

  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    let active = true;

    fnRef
      .current()
      .then((data) => active && setSettled({ key, data }))
      .catch((err: unknown) => {
        if (!active) return;
        setSettled((previous) => ({
          key,
          data: previous.data,
          error: err instanceof Error ? err : new Error(String(err)),
        }));
      });

    return () => {
      active = false;
    };
  }, [key]);

  const refetch = useCallback(() => setNonce((current) => current + 1), []);

  return {
    data: settled.data,
    loading: settled.key !== key,
    error: settled.key === key ? settled.error : undefined,
    refetch,
  };
}

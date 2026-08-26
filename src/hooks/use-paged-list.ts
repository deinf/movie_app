import { useCallback, useEffect, useState } from 'react';

import type { Paged } from '@/api/tmdb';

export interface PagedListState<T> {
  items: T[];
  loading: boolean;
  initialLoading: boolean;
  error: Error | undefined;
  exhausted: boolean;
  loadMore: () => void;
  retry: () => void;
}

// tmdb won't page past 500 whatever total_pages says
const MAX_PAGE = 500;

export function usePagedList<T extends { id: number }>(
  fetchPage: (page: number) => Promise<Paged<T>>,
  resetKey: string,
): PagedListState<T> {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [loadedPage, setLoadedPage] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<Error>();
  const [exhausted, setExhausted] = useState(false);
  const [activeKey, setActiveKey] = useState(resetKey);

  const loading = !error && (loadedPage < page || activeKey !== resetKey);
  const initialLoading = loading && items.length === 0;

  // reset during render rather than from an effect, so no stale frame paints first
  if (activeKey !== resetKey) {
    setActiveKey(resetKey);
    setItems([]);
    setPage(1);
    setLoadedPage(0);
    setError(undefined);
    setExhausted(false);
  }

  useEffect(() => {
    let active = true;

    fetchPage(page)
      .then((paged) => {
        if (!active) return;
        setItems((current) => {
          // tmdb repeats entries across pages
          const seen = new Set(current.map((item) => item.id));
          return [...current, ...paged.results.filter((item) => !seen.has(item.id))];
        });
        if (page >= Math.min(paged.total_pages || 1, MAX_PAGE)) setExhausted(true);
        setError(undefined);
        setLoadedPage(page);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err : new Error(String(err)));
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, page, attempt]);

  const loadMore = useCallback(() => {
    if (loading || exhausted || error) return;
    setPage((current) => current + 1);
  }, [loading, exhausted, error]);

  const retry = useCallback(() => {
    setError(undefined);
    setAttempt((current) => current + 1);
  }, []);

  return { items, loading, initialLoading, error, exhausted, loadMore, retry };
}

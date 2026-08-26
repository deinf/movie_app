import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'movieapp.recentSearches.v1';
const MAX_ENTRIES = 8;

export function useRecentSearches() {
  const [searches, setSearches] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (active && raw) setSearches(JSON.parse(raw) as string[]);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const persist = (next: string[]) => {
    setSearches(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };

  const remember = useCallback((term: string) => {
    const trimmed = term.trim();
    if (trimmed.length < 2) return;
    setSearches((current) => {
      const next = [trimmed, ...current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(
        0,
        MAX_ENTRIES,
      );
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const remove = useCallback(
    (term: string) => persist(searches.filter((item) => item !== term)),
    [searches],
  );

  const clear = useCallback(() => persist([]), []);

  return { searches, remember, remove, clear };
}

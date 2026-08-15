import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { Media, MediaType } from '@/api/tmdb';

const STORAGE_KEY = 'movieapp.mylist.v1';

export interface SavedItem {
  id: number;
  mediaType: MediaType;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  date: string;
  savedAt: number;
}

interface MyListValue {
  items: SavedItem[];
  ready: boolean;
  has: (id: number) => boolean;
  toggle: (item: Media, mediaType?: MediaType) => boolean;
  remove: (id: number) => void;
  clear: () => void;
}

const MyListContext = createContext<MyListValue | null>(null);

function toSaved(item: Media, mediaType: MediaType): SavedItem {
  return {
    id: item.id,
    mediaType,
    title: item.title ?? item.name ?? 'Untitled',
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    vote_average: item.vote_average,
    date: item.release_date ?? item.first_air_date ?? '',
    savedAt: Date.now(),
  };
}

export function MyListProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active) return;
        if (raw) setItems(JSON.parse(raw) as SavedItem[]);
      })
      .catch(() => {})
      .finally(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, [items, ready]);

  const has = useCallback((id: number) => items.some((item) => item.id === id), [items]);

  const toggle = useCallback(
    (item: Media, mediaType: MediaType = 'movie') => {
      const type = (item.media_type === 'tv' ? 'tv' : item.media_type === 'movie' ? 'movie' : mediaType) as MediaType;
      const wasSaved = items.some((saved) => saved.id === item.id);

      setItems((current) =>
        current.some((saved) => saved.id === item.id)
          ? current.filter((saved) => saved.id !== item.id)
          : [toSaved(item, type), ...current],
      );

      return !wasSaved;
    },
    [items],
  );

  const remove = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, ready, has, toggle, remove, clear }),
    [items, ready, has, toggle, remove, clear],
  );

  return <MyListContext.Provider value={value}>{children}</MyListContext.Provider>;
}

export function useMyList(): MyListValue {
  const context = useContext(MyListContext);
  if (!context) throw new Error('useMyList must be used inside <MyListProvider>');
  return context;
}

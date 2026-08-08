import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'movieapp.cache.';
const INDEX_KEY = 'movieapp.cache.index';
const MAX_ENTRIES = 120;

interface Entry<T> {
  v: T;
  t: number;
}

const memory = new Map<string, Entry<unknown>>();

let index: string[] | null = null;

async function loadIndex(): Promise<string[]> {
  if (index) return index;
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    index = raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    index = [];
  }
  return index;
}

async function trackKey(key: string): Promise<void> {
  const keys = await loadIndex();
  const existing = keys.indexOf(key);
  if (existing !== -1) keys.splice(existing, 1);
  keys.push(key);

  const overflow = keys.splice(0, Math.max(0, keys.length - MAX_ENTRIES));
  index = keys;

  await Promise.all([
    AsyncStorage.setItem(INDEX_KEY, JSON.stringify(keys)),
    overflow.length ? AsyncStorage.multiRemove(overflow.map((k) => PREFIX + k)) : Promise.resolve(),
  ]).catch(() => {});

  for (const stale of overflow) memory.delete(stale);
}

export interface CacheHit<T> {
  value: T;
  age: number;
}

export async function readCache<T>(key: string): Promise<CacheHit<T> | null> {
  const hit = memory.get(key) as Entry<T> | undefined;
  if (hit) return { value: hit.v, age: Date.now() - hit.t };

  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry<T>;
    memory.set(key, entry);
    return { value: entry.v, age: Date.now() - entry.t };
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, value: T): Promise<void> {
  const entry: Entry<T> = { v: value, t: Date.now() };
  memory.set(key, entry);
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(entry));
    await trackKey(key);
  } catch {}
}

export async function clearCache(): Promise<void> {
  memory.clear();
  const keys = await loadIndex();
  index = [];
  try {
    await AsyncStorage.multiRemove([INDEX_KEY, ...keys.map((k) => PREFIX + k)]);
  } catch {}
}

export async function cacheSize(): Promise<number> {
  const keys = await loadIndex();
  return keys.length;
}

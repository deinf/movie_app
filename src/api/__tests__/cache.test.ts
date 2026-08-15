import AsyncStorage from '@react-native-async-storage/async-storage';

import { clearCache, readCache, writeCache } from '@/api/cache';

beforeEach(async () => {
  await clearCache();
  jest.clearAllMocks();
});

describe('cache', () => {
  it('returns null for a key that was never written', async () => {
    expect(await readCache('missing')).toBeNull();
  });

  it('round-trips a value', async () => {
    await writeCache('key', { hello: 'world' });
    expect((await readCache<{ hello: string }>('key'))?.value).toEqual({ hello: 'world' });
  });

  it('reports the age of an entry so callers can judge freshness', async () => {
    await writeCache('key', 1);
    const hit = await readCache<number>('key');
    expect(hit?.age).toBeGreaterThanOrEqual(0);
    expect(hit?.age).toBeLessThan(1000);
  });

  it('serves repeat reads from memory without hitting storage again', async () => {
    await writeCache('key', 'value');
    jest.clearAllMocks();
    await readCache('key');
    expect(AsyncStorage.getItem).not.toHaveBeenCalled();
  });

  it('survives unparseable stored data rather than throwing', async () => {
    await clearCache();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('not json');
    expect(await readCache('corrupt')).toBeNull();
  });

  it('drops everything on clear', async () => {
    await writeCache('a', 1);
    await writeCache('b', 2);
    await clearCache();
    expect(await readCache('a')).toBeNull();
    expect(await readCache('b')).toBeNull();
  });

  it('evicts the oldest entries once the cap is passed', async () => {
    for (let index = 0; index < 130; index += 1) {
      await writeCache(`key-${index}`, index);
    }
    expect(await readCache('key-0')).toBeNull();
    expect((await readCache<number>('key-129'))?.value).toBe(129);
  });
});

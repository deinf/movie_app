// the api client pulls in AsyncStorage at module scope; these tests never touch storage
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();
  return {
    getItem: jest.fn(async (key) => store.get(key) ?? null),
    setItem: jest.fn(async (key, value) => void store.set(key, value)),
    removeItem: jest.fn(async (key) => void store.delete(key)),
    multiRemove: jest.fn(async (keys) => keys.forEach((key) => store.delete(key))),
  };
});

process.env.EXPO_PUBLIC_TMDB_API_KEY = 'test-key';

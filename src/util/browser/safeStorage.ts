const memoryStore = new Map<string, string>();

const memoryStorage: Storage = {
  get length() {
    return memoryStore.size;
  },
  clear() {
    memoryStore.clear();
  },
  getItem(key: string) {
    return memoryStore.has(key) ? memoryStore.get(key)! : null;
  },
  key(index: number) {
    return Array.from(memoryStore.keys())[index] ?? null;
  },
  removeItem(key: string) {
    memoryStore.delete(key);
  },
  setItem(key: string, value: string) {
    memoryStore.set(key, value);
  },
};

function getBrowserStorage(): Storage | undefined {
  if (typeof window === 'undefined' || !window.localStorage) {
    return undefined;
  }

  try {
    const testKey = '__safe_storage_probe__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch (err) {
    return undefined;
  }
}

export const safeStorage: Storage = getBrowserStorage() || memoryStorage;

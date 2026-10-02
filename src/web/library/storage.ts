import { LIBRARY_STORAGE_KEY, pruneExpiredContent, readStoredLibrary, serializeStoredLibrary, type LibraryStorage, type SavedContent } from '../../domain/content.ts';

type BrowserStore = Pick<Storage, 'getItem' | 'setItem'>;

/** Keep the original AsyncStorage web key and reject privacy/quota failures. */
export function createBrowserStorage(getStorage: () => BrowserStore): LibraryStorage {
  return {
    async getItem(key) { return getStorage().getItem(key); },
    async setItem(key, value) { getStorage().setItem(key, value); },
  };
}

export const browserStorage = createBrowserStorage(() => window.localStorage);

export type BrowserExclusiveRunner = <T>(operation: () => T) => Promise<T>;
type LibraryBuilder = (previous: SavedContent[], now: string) => SavedContent[];

export class BrowserWriteUnavailableError extends Error {
  constructor() {
    super('이 브라우저에서는 안전한 저장을 지원하지 않아요. 최신 Chrome·Edge·Firefox·Safari에서 열어 주세요. 기존 데이터는 유지돼요.');
    this.name = 'BrowserWriteUnavailableError';
  }
}

/** All cooperating tabs use one origin-wide lock and read the latest snapshot inside it. */
export function createBrowserLibraryRepository(getStorage: () => BrowserStore, runExclusive?: BrowserExclusiveRunner) {
  const read = (storage: BrowserStore, now: string) => {
    const loaded = readStoredLibrary(storage.getItem(LIBRARY_STORAGE_KEY), now);
    const cleaned = pruneExpiredContent(loaded.items, now);
    return { items: cleaned.items, needsWrite: loaded.needsMigration || cleaned.changed };
  };
  const write = (storage: BrowserStore, items: SavedContent[], now: string) => {
    const serialized = serializeStoredLibrary(pruneExpiredContent(items, now).items, now);
    const committed = readStoredLibrary(serialized, now).items;
    // Keep this write synchronous with the read/build while the exclusive lock is held.
    storage.setItem(LIBRARY_STORAGE_KEY, serialized);
    return committed;
  };
  return {
    async load(now = new Date().toISOString()): Promise<SavedContent[]> {
      const operation = () => {
        const storage = getStorage();
        const loaded = read(storage, now);
        if (!loaded.needsWrite) return loaded.items;
        if (!runExclusive) throw new BrowserWriteUnavailableError();
        return write(storage, loaded.items, now);
      };
      return runExclusive ? runExclusive(operation) : operation();
    },
    async transact(build: LibraryBuilder, now = new Date().toISOString()): Promise<SavedContent[]> {
      if (!runExclusive) throw new BrowserWriteUnavailableError();
      return runExclusive(() => {
        const storage = getStorage();
        const latest = read(storage, now).items;
        return write(storage, build(latest, now), now);
      });
    },
  };
}

const browserExclusive: BrowserExclusiveRunner | undefined = typeof navigator !== 'undefined' && navigator.locks
  ? operation => navigator.locks.request(LIBRARY_STORAGE_KEY, { mode: 'exclusive' }, operation)
  : undefined;

export const browserLibraryRepository = createBrowserLibraryRepository(() => window.localStorage, browserExclusive);

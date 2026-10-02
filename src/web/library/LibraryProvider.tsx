import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { browserLibraryRepository, BrowserWriteUnavailableError } from './storage';
import { buildContentImport, createContent, LIBRARY_STORAGE_KEY, normalizeUrl, removeAccountImportedContent, type DraftInput, type SavedContent } from '../../domain/content';

type LibraryContextValue = {
  items: SavedContent[]; loading: boolean; saving: boolean; error: string | null; retry: () => void;
  add: (draft: DraftInput) => Promise<SavedContent>;
  toggleVisited: (id: string) => Promise<void>;
  update: (id: string, draft: DraftInput) => Promise<void>;
  importMany: (drafts: DraftInput[]) => Promise<{ added: number; duplicates: number }>;
  removeAccountImports: (connectionId?: string) => Promise<number>;
};
const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<SavedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = useRef(false);
  const busy = useRef(false);
  const cleanupQueued = useRef(false);
  const requestCleanup = useRef<() => void>(() => {});
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    ready.current = false;
    browserLibraryRepository.load().then(parsed => {
      if (!active) return;
      setItems(parsed);
      ready.current = true;
    }).catch(error => {
      if (active) setError(error instanceof BrowserWriteUnavailableError ? error.message : '저장함을 불러오지 못했어요. 기존 데이터는 유지됩니다. 다시 시도해 주세요.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  useEffect(() => {
    let active = true;
    const cleanExpired = async () => {
      if (!ready.current) return;
      if (busy.current) { cleanupQueued.current = true; return; }
      busy.current = true;
      setSaving(true);
      try {
        const committed = await browserLibraryRepository.load();
        if (!active) return;
        setItems(committed);
      } catch (error) {
        if (active) {
          ready.current = false;
          setError(error instanceof BrowserWriteUnavailableError ? error.message : '저장함을 다시 확인하지 못했어요. 기존 데이터를 유지한 채 다시 불러와 주세요.');
        }
      } finally {
        busy.current = false;
        if (active) setSaving(false);
        if (active && cleanupQueued.current) { cleanupQueued.current = false; requestCleanup.current(); }
      }
    };
    const request = () => { void cleanExpired(); };
    requestCleanup.current = request;
    const onVisible = () => { if (document.visibilityState === 'visible') request(); };
    const onStorage = (event: StorageEvent) => { if (event.key === LIBRARY_STORAGE_KEY || event.key === null) request(); };
    window.addEventListener('focus', onVisible);
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') request();
    }, 60 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
      requestCleanup.current = () => {};
    };
  }, []);

  const transact = async (build: (previous: SavedContent[], now: string) => SavedContent[]) => {
    if (!ready.current) throw new Error('저장함을 먼저 불러와 주세요.');
    if (busy.current) throw new Error('이전 저장이 끝난 뒤 다시 시도해 주세요.');
    busy.current = true;
    setSaving(true);
    try {
      const next = await browserLibraryRepository.transact(build);
      setItems(next);
    } finally {
      busy.current = false;
      setSaving(false);
      if (cleanupQueued.current) { cleanupQueued.current = false; requestCleanup.current(); }
    }
  };
  const add = async (draft: DraftInput) => {
    let result: SavedContent | undefined;
    await transact((previous, now) => { result = createContent(draft, previous, now); return [result, ...previous]; });
    return result!;
  };
  const toggleVisited = async (id: string) => transact(previous => {
    if (!previous.some(item => item.id === id)) throw new Error('콘텐츠를 찾을 수 없어요. 저장함을 다시 확인해 주세요.');
    return previous.map(item => item.id === id ? { ...item, visited: !item.visited } : item);
  });
  const update = async (id: string, draft: DraftInput) => transact((previous, now) => {
    const original = previous.find(item => item.id === id);
    if (!original) throw new Error('콘텐츠를 찾을 수 없어요.');
    const urlChanged = normalizeUrl(draft.url) !== original.url;
    const external = urlChanged ? draft.external ?? null : draft.external === undefined ? original.external : draft.external;
    const replacement = createContent({
      ...draft,
      external,
      titleMode: draft.titleMode ?? (urlChanged ? 'manual' : original.titleMode),
      importedFrom: original.importedFrom,
      place: draft.place === undefined ? original.place : draft.place,
    }, previous.filter(item => item.id !== id), now);
    return previous.map(item => item.id === id ? { ...replacement, id, visited: original.visited, createdAt: original.createdAt } : item);
  });
  const importMany = async (drafts: DraftInput[]) => {
    let result = { added: 0, duplicates: 0 };
    await transact((previous, now) => {
      const batch = buildContentImport(drafts, previous, now);
      result = { added: batch.added, duplicates: batch.duplicates };
      return batch.items;
    });
    return result;
  };
  const removeAccountImports = async (connectionId?: string) => {
    let removed = 0;
    await transact(previous => {
      const result = removeAccountImportedContent(previous, connectionId);
      removed = result.removed;
      return result.items;
    });
    return removed;
  };
  return <LibraryContext.Provider value={{ items, loading, saving, error, retry: () => { setLoading(true); setError(null); setAttempt(value => value + 1); }, add, update, toggleVisited, importMany, removeAccountImports }}>{children}</LibraryContext.Provider>;
}
export function useLibrary() {
  const value = useContext(LibraryContext);
  if (!value) throw new Error('LibraryProvider is missing.');
  return value;
}

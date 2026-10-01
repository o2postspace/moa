import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { buildContentImport, createContent, loadStoredLibrary, normalizeUrl, pruneExpiredContent, removeAccountImportedContent, saveStoredLibrary, type DraftInput, type SavedContent } from '../../domain/content';

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
  const current = useRef<SavedContent[]>([]);
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
    loadStoredLibrary(AsyncStorage).then(parsed => {
      if (!active) return;
      current.current = parsed;
      setItems(parsed);
      ready.current = true;
    }).catch(() => {
      if (active) setError('저장함을 불러오지 못했어요. 기존 데이터는 유지됩니다. 다시 시도해 주세요.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  useEffect(() => {
    let active = true;
    const cleanExpired = async () => {
      if (!ready.current) return;
      if (busy.current) { cleanupQueued.current = true; return; }
      const now = new Date().toISOString();
      try {
        const cleaned = pruneExpiredContent(current.current, now);
        if (!cleaned.changed) return;
        busy.current = true;
        setSaving(true);
        const committed = await saveStoredLibrary(AsyncStorage, cleaned.items, now);
        if (!active) return;
        current.current = committed;
        setItems(committed);
      } catch {
        if (active) {
          ready.current = false;
          setError('기간이 지난 정보를 정리하지 못했어요. 기존 데이터를 유지한 채 다시 불러와 주세요.');
        }
      } finally {
        busy.current = false;
        if (active) setSaving(false);
        if (active && cleanupQueued.current) { cleanupQueued.current = false; requestCleanup.current(); }
      }
    };
    const request = () => { void cleanExpired(); };
    requestCleanup.current = request;
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') request();
    });
    const timer = setInterval(() => {
      if (AppState.currentState === 'active' || AppState.currentState === null) request();
    }, 60 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(timer);
      subscription.remove();
      requestCleanup.current = () => {};
    };
  }, []);

  const transact = async (build: (previous: SavedContent[], now: string) => SavedContent[]) => {
    if (!ready.current) throw new Error('저장함을 먼저 불러와 주세요.');
    if (busy.current) throw new Error('이전 저장이 끝난 뒤 다시 시도해 주세요.');
    busy.current = true;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const previous = pruneExpiredContent(current.current, now).items;
      const next = await saveStoredLibrary(AsyncStorage, build(previous, now), now);
      current.current = next;
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
  const toggleVisited = async (id: string) => transact(previous => previous.map(item => item.id === id ? { ...item, visited: !item.visited } : item));
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

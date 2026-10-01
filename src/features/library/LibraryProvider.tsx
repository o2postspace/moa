import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContent, parseStoredContent, type DraftInput, type SavedContent } from '../../domain/content';

const STORAGE_KEY = 'moa.library.v1';
type LibraryContextValue = { items: SavedContent[]; loading: boolean; saving: boolean; error: string | null; retry: () => void; add: (draft: DraftInput) => Promise<SavedContent>; toggleVisited: (id: string) => Promise<void>; update: (id: string, draft: DraftInput) => Promise<void> };
const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<SavedContent[]>([]);
  const current = useRef<SavedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = useRef(false);
  const busy = useRef(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    ready.current = false;
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      const parsed = parseStoredContent(raw);
      if (!active) return;
      current.current = parsed;
      setItems(parsed);
      ready.current = true;
    }).catch(() => {
      if (active) setError('저장함을 불러오지 못했어요. 기존 데이터는 유지됩니다. 다시 시도해 주세요.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  const transact = async (build: (previous: SavedContent[]) => SavedContent[]) => {
    if (!ready.current) throw new Error('저장함을 먼저 불러와 주세요.');
    if (busy.current) throw new Error('이전 저장이 끝난 뒤 다시 시도해 주세요.');
    busy.current = true;
    setSaving(true);
    try {
      const next = build(current.current);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      current.current = next;
      setItems(next);
    } finally { busy.current = false; setSaving(false); }
  };
  const add = async (draft: DraftInput) => {
    let result: SavedContent | undefined;
    await transact(previous => { result = createContent(draft, previous); return [result, ...previous]; });
    return result!;
  };
  const toggleVisited = async (id: string) => transact(previous => previous.map(item => item.id === id ? { ...item, visited: !item.visited } : item));
  const update = async (id: string, draft: DraftInput) => transact(previous => {
    const original = previous.find(item => item.id === id);
    if (!original) throw new Error('콘텐츠를 찾을 수 없어요.');
    const replacement = createContent(draft, previous.filter(item => item.id !== id));
    return previous.map(item => item.id === id ? { ...replacement, id, visited: original.visited, createdAt: original.createdAt } : item);
  });
  return <LibraryContext.Provider value={{ items, loading, saving, error, retry: () => { setLoading(true); setError(null); setAttempt(value => value + 1); }, add, update, toggleVisited }}>{children}</LibraryContext.Provider>;
}
export function useLibrary() {
  const value = useContext(LibraryContext);
  if (!value) throw new Error('LibraryProvider is missing.');
  return value;
}

import assert from 'node:assert/strict';
import test from 'node:test';
import { BrowserWriteUnavailableError, createBrowserLibraryRepository, createBrowserStorage, type BrowserExclusiveRunner } from '../src/web/library/storage.ts';
import { createContent, LIBRARY_STORAGE_KEY, loadStoredLibrary, saveStoredLibrary, serializeStoredLibrary } from '../src/domain/content.ts';

const now = '2026-10-03T03:00:00.000Z';
const item = createContent({ title: '기존 저장', url: 'https://example.com/preserved', category: 'other', note: '내 메모' }, [], now);

test('browser adapter reads the existing AsyncStorage web key without moving or reseeding v2 data', async () => {
  const raw = serializeStoredLibrary([item], now);
  const values = new Map([[LIBRARY_STORAGE_KEY, raw]]);
  let writes = 0;
  const storage = createBrowserStorage(() => ({ getItem: key => values.get(key) ?? null, setItem: (key, value) => { writes++; values.set(key, value); } }));
  assert.deepEqual(await loadStoredLibrary(storage, now), [item]);
  assert.equal(writes, 0);
  assert.equal(values.get(LIBRARY_STORAGE_KEY), raw);
});

test('blocked browser storage is rejected asynchronously rather than appearing as an empty library', async () => {
  const storage = createBrowserStorage(() => { throw new Error('Storage blocked'); });
  await assert.rejects(loadStoredLibrary(storage, now), /Storage blocked/);
});

test('browser quota failure leaves the existing saved snapshot intact', async () => {
  const original = serializeStoredLibrary([item], now);
  let raw = original;
  let rejectWrites = true;
  const storage = createBrowserStorage(() => ({ getItem: () => raw, setItem: (_key, value) => { if (rejectWrites) throw new Error('Quota exceeded'); raw = value; } }));
  await assert.rejects(saveStoredLibrary(storage, [], now), /Quota exceeded/);
  assert.equal(raw, original);
  rejectWrites = false;
  assert.deepEqual(await loadStoredLibrary(storage, now), [item]);
});

function sharedExclusiveRunner(): BrowserExclusiveRunner {
  let queued: Promise<unknown> = Promise.resolve();
  return operation => {
    const result = queued.then(operation);
    queued = result.then(() => undefined, () => undefined);
    return result;
  };
}

test('two repository tabs read the latest locked snapshot and preserve each other’s additions and visits', async () => {
  const values = new Map([[LIBRARY_STORAGE_KEY, serializeStoredLibrary([item], now)]]);
  const getStore = () => ({ getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } });
  const exclusive = sharedExclusiveRunner();
  const tabA = createBrowserLibraryRepository(getStore, exclusive);
  const tabB = createBrowserLibraryRepository(getStore, exclusive);
  assert.deepEqual(await tabA.load(now), await tabB.load(now));
  const added = createContent({ title: '다른 탭의 새 저장', url: 'https://example.com/tab-a', category: 'cafe' }, [item], now);

  await Promise.all([
    tabA.transact(previous => [added, ...previous], now),
    tabB.transact(previous => previous.map(value => value.id === item.id ? { ...value, visited: true } : value), now),
  ]);

  assert.deepEqual(await tabA.load(now), [added, { ...item, visited: true }]);
  assert.deepEqual(await tabB.load(now), [added, { ...item, visited: true }]);
});

test('concurrent migration loads share the lock and write the v1 replacement only once', async () => {
  let raw = JSON.stringify([item]);
  let writes = 0;
  const getStore = () => ({ getItem: () => raw, setItem: (_key: string, value: string) => { writes++; raw = value; } });
  const exclusive = sharedExclusiveRunner();
  const first = createBrowserLibraryRepository(getStore, exclusive);
  const second = createBrowserLibraryRepository(getStore, exclusive);
  assert.deepEqual(await Promise.all([first.load(now), second.load(now)]), [[item], [item]]);
  assert.equal(writes, 1);
  assert.equal(raw, serializeStoredLibrary([item], now));
});

test('repository quota failure preserves the latest snapshot and a later transaction can retry', async () => {
  const original = serializeStoredLibrary([item], now);
  let raw = original;
  let rejectWrites = true;
  const repository = createBrowserLibraryRepository(() => ({
    getItem: () => raw,
    setItem: (_key, value) => { if (rejectWrites) throw new Error('Quota exceeded'); raw = value; },
  }), sharedExclusiveRunner());
  const change = (previous: typeof item[]) => previous.map(value => ({ ...value, visited: true }));
  await assert.rejects(repository.transact(change, now), /Quota exceeded/);
  assert.equal(raw, original);
  assert.deepEqual(await repository.load(now), [item]);
  rejectWrites = false;
  assert.deepEqual(await repository.transact(change, now), [{ ...item, visited: true }]);
});

test('repository migration failure preserves the v1 source until replacement succeeds', async () => {
  const original = JSON.stringify([item]);
  let raw = original;
  let rejectWrites = true;
  const repository = createBrowserLibraryRepository(() => ({
    getItem: () => raw,
    setItem: (_key, value) => { if (rejectWrites) throw new Error('Migration quota'); raw = value; },
  }), sharedExclusiveRunner());
  await assert.rejects(repository.load(now), /Migration quota/);
  assert.equal(raw, original);
  rejectWrites = false;
  assert.deepEqual(await repository.load(now), [item]);
  assert.equal(raw, serializeStoredLibrary([item], now));
});

test('repository retention failure preserves the source and only publishes the cleaned snapshot after a successful write', async () => {
  const fetchedAt = '2026-09-03T03:00:00.000Z';
  const imported = createContent({
    title: '저장한 YouTube 영상', url: 'https://www.youtube.com/watch?v=retained', category: 'other', note: '기한이 있는 메모',
    titleMode: 'external', external: { provider: 'youtube', title: 'API 제목', fetchedAt },
    importedFrom: { provider: 'youtube', method: 'public-playlist', fetchedAt },
  }, [], fetchedAt);
  const original = serializeStoredLibrary([imported, item], now);
  let raw = original;
  let rejectWrites = true;
  const repository = createBrowserLibraryRepository(() => ({
    getItem: () => raw,
    setItem: (_key, value) => { if (rejectWrites) throw new Error('Retention quota'); raw = value; },
  }), sharedExclusiveRunner());
  await assert.rejects(repository.load(now), /Retention quota/);
  assert.equal(raw, original);
  rejectWrites = false;
  assert.deepEqual(await repository.load(now), [item]);
  assert.equal(raw, serializeStoredLibrary([item], now));
});

test('repository compatibility read and visit change retain legacy NAVER provenance', async () => {
  const legacy = {
    ...item, url: 'https://map.naver.com/p/search/legacy', source: 'naver' as const,
    importedFrom: { provider: 'naver' as const, method: 'place-search' as const, fetchedAt: now },
  };
  let raw = serializeStoredLibrary([legacy], now);
  const repository = createBrowserLibraryRepository(() => ({ getItem: () => raw, setItem: (_key, value) => { raw = value; } }), sharedExclusiveRunner());
  assert.deepEqual(await repository.load(now), [legacy]);
  assert.deepEqual(await repository.transact(previous => previous.map(value => ({ ...value, visited: true })), now), [{ ...legacy, visited: true }]);
});

test('repository rejects a malformed latest snapshot before running the change builder', async () => {
  const original = '{"version":99,"items":[]}';
  let raw = original;
  let built = false;
  const repository = createBrowserLibraryRepository(() => ({ getItem: () => raw, setItem: (_key, value) => { raw = value; } }), sharedExclusiveRunner());
  await assert.rejects(repository.transact(() => { built = true; return []; }, now), /지원하지 않는 저장 형식/);
  assert.equal(built, false);
  assert.equal(raw, original);
});

test('repository rejects invalid built items without replacing the saved snapshot', async () => {
  const original = serializeStoredLibrary([item], now);
  let raw = original;
  const repository = createBrowserLibraryRepository(() => ({ getItem: () => raw, setItem: (_key, value) => { raw = value; } }), sharedExclusiveRunner());
  await assert.rejects(repository.transact(previous => previous.map(value => ({ ...value, url: 'javascript:alert(1)' })), now), /올바른 링크/);
  assert.equal(raw, original);
});

test('without an exclusive runner repository reads valid v2 data but refuses every write', async () => {
  const original = serializeStoredLibrary([item], now);
  let raw = original;
  let writes = 0;
  const repository = createBrowserLibraryRepository(() => ({ getItem: () => raw, setItem: (_key, value) => { writes++; raw = value; } }));
  assert.deepEqual(await repository.load(now), [item]);
  await assert.rejects(repository.transact(() => [], now), BrowserWriteUnavailableError);
  assert.equal(writes, 0);
  assert.equal(raw, original);
});

test('without an exclusive runner migration is blocked while its source remains unchanged', async () => {
  const original = JSON.stringify([item]);
  let raw = original;
  const repository = createBrowserLibraryRepository(() => ({ getItem: () => raw, setItem: (_key, value) => { raw = value; } }));
  await assert.rejects(repository.load(now), BrowserWriteUnavailableError);
  assert.equal(raw, original);
});

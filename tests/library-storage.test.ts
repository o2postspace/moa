import assert from 'node:assert/strict';
import test from 'node:test';
import { API_RETENTION_MS, buildContentImport, createContent, LIBRARY_STORAGE_KEY, loadStoredLibrary, saveStoredLibrary, serializeStoredLibrary } from '../src/domain/content.ts';
import type { LibraryStorage, SavedContent } from '../src/domain/content.ts';

const now = '2026-10-01T03:00:00.000Z';
const manual = (): SavedContent => createContent({ title: '나의 메모', url: 'https://example.com/my-link', category: 'other', note: '보존할 입력' }, [], now);

class MemoryStorage implements LibraryStorage {
  raw: string | null;
  writes: { key: string; value: string }[] = [];
  rejectWrites = false;
  constructor(raw: string | null) { this.raw = raw; }
  async getItem(key: string): Promise<string | null> {
    assert.equal(key, LIBRARY_STORAGE_KEY);
    return this.raw;
  }
  async setItem(key: string, value: string): Promise<void> {
    this.writes.push({ key, value });
    if (this.rejectWrites) throw new Error('Storage unavailable');
    this.raw = value;
  }
}

test('legacy data migrates with a single replacement write before committed items are returned', async () => {
  const item = manual();
  const storage = new MemoryStorage(JSON.stringify([item]));
  assert.deepEqual(await loadStoredLibrary(storage, now), [item]);
  assert.equal(storage.writes.length, 1);
  assert.equal(storage.writes[0].key, LIBRARY_STORAGE_KEY);
  assert.equal(JSON.parse(storage.raw!).version, 2);
  await loadStoredLibrary(storage, now);
  assert.equal(storage.writes.length, 1);
});

test('failed migration does not return ready items or replace the original array', async () => {
  const oldRaw = JSON.stringify([manual()]);
  const storage = new MemoryStorage(oldRaw);
  storage.rejectWrites = true;
  await assert.rejects(loadStoredLibrary(storage, now), /Storage unavailable/);
  assert.equal(storage.raw, oldRaw);
  storage.rejectWrites = false;
  assert.equal((await loadStoredLibrary(storage, now)).length, 1);
  assert.equal(JSON.parse(storage.raw!).version, 2);
});

test('corrupt data and unsupported versions never trigger a replacement write', async () => {
  for (const raw of ['{broken', JSON.stringify({ version: 4, items: [] }), JSON.stringify({ version: 2, items: [null] })]) {
    const storage = new MemoryStorage(raw);
    await assert.rejects(loadStoredLibrary(storage, now));
    assert.equal(storage.writes.length, 0);
    assert.equal(storage.raw, raw);
  }
  const storage = new MemoryStorage(null);
  assert.deepEqual(await loadStoredLibrary(storage, now), []);
  assert.equal(storage.writes.length, 0);
});

test('expired API imports are durably removed before loading while manual data stays', async () => {
  const api = createContent({ title: '계정에서 가져온 영상', url: 'https://youtube.com/watch?v=api', category: 'other', note: '가져온 항목의 메모', importedFrom: { provider: 'youtube', method: 'account-playlist', connectionId: 'grant-A', fetchedAt: now } }, [], now);
  const user = manual();
  const original = serializeStoredLibrary([api, user], now);
  const storage = new MemoryStorage(original);
  const expiredAt = new Date(Date.parse(now) + API_RETENTION_MS).toISOString();
  storage.rejectWrites = true;
  await assert.rejects(loadStoredLibrary(storage, expiredAt));
  assert.equal(storage.raw, original);
  storage.rejectWrites = false;
  assert.deepEqual(await loadStoredLibrary(storage, expiredAt), [user]);
  assert.deepEqual(JSON.parse(storage.raw!).items, [user]);
});

test('batch import commits once and failed writes preserve the current snapshot', async () => {
  const user = manual();
  const previous = [user];
  const original = serializeStoredLibrary(previous, now);
  const storage = new MemoryStorage(original);
  const result = buildContentImport([{ title: '가져온 영상', url: 'https://youtube.com/watch?v=new', category: 'other', importedFrom: { provider: 'youtube', method: 'public-playlist', fetchedAt: now } }], previous, now);
  storage.rejectWrites = true;
  await assert.rejects(saveStoredLibrary(storage, result.items, now));
  assert.equal(storage.raw, original);
  assert.deepEqual(previous, [user]);
  storage.rejectWrites = false;
  const before = storage.writes.length;
  assert.deepEqual(await saveStoredLibrary(storage, result.items, now), result.items);
  assert.equal(storage.writes.length - before, 1);
});

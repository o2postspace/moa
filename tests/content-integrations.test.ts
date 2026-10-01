import assert from 'node:assert/strict';
import test from 'node:test';
import {
  API_RETENTION_MS, buildContentImport, createContent, displayContentTitle, DomainError,
  parseStoredContent, pruneExpiredContent, readStoredLibrary, removeAccountImportedContent,
  searchContent, serializeStoredLibrary,
} from '../src/domain/content.ts';
import type { DraftInput, SavedContent } from '../src/domain/content.ts';

const now = '2026-10-01T03:00:00.000Z';
const at = (offset: number) => new Date(Date.parse(now) + offset).toISOString();
const manual = (): SavedContent => ({ id: 'manual', title: '직접 적은 산책', url: 'https://www.youtube.com/watch?v=manual', source: 'youtube', category: 'other', placeName: '한강', note: '친구와 함께', visited: true, createdAt: now });
const importedDraft = (video: string, connectionId?: string): DraftInput => ({
  title: '저장한 YouTube 영상', url: `https://www.youtube.com/watch?v=${video}`, category: 'other',
  titleMode: 'external', external: { provider: 'youtube', title: `${video} 영상 제목`, authorName: '채널', fetchedAt: now },
  importedFrom: { provider: 'youtube', method: connectionId ? 'account-playlist' : 'public-playlist', fetchedAt: now, ...(connectionId ? { connectionId } : {}) },
});

test('v1 migration keeps user data and v2 metadata round trips without inventing fields', () => {
  const legacy = manual();
  const old = readStoredLibrary(JSON.stringify([legacy]), now);
  assert.equal(old.needsMigration, true);
  assert.deepEqual(old.items, [legacy]);
  const imported = createContent(importedDraft('video123', 'grant-1'), [], now);
  const serialized = serializeStoredLibrary([legacy, imported], now);
  assert.equal(JSON.parse(serialized).version, 2);
  assert.deepEqual(readStoredLibrary(serialized, now), { items: [legacy, imported], needsMigration: false });
  assert.deepEqual(parseStoredContent(serialized, now), [legacy, imported]);
  assert.deepEqual(readStoredLibrary(null, now), { items: [], needsMigration: false });
});

test('unknown versions, malformed envelopes and invalid remote origins fail the whole read', () => {
  const badItem = { ...manual(), importedFrom: { provider: 'naver', method: 'account-playlist', fetchedAt: now } };
  for (const raw of [JSON.stringify({ version: 3, items: [manual()] }), JSON.stringify({ version: 2, items: {} }), JSON.stringify({ version: '2', items: [] }), JSON.stringify({ version: 2, items: [manual(), badItem] })]) {
    assert.throws(() => readStoredLibrary(raw, now), DomainError);
  }
});

test('batch import validates all entries and preserves existing records while skipping normalized duplicates', () => {
  const existing = [manual()];
  const snapshot = JSON.stringify(existing);
  const drafts = [importedDraft('new-video'), { ...importedDraft('new-video'), url: 'https://youtu.be/new-video?si=tracking' }, importedDraft('manual')];
  const batch = buildContentImport(drafts, existing, now);
  assert.equal(batch.added, 1);
  assert.equal(batch.duplicates, 2);
  assert.equal(batch.items[0].external?.title, 'new-video 영상 제목');
  assert.equal(batch.items[1], existing[0]);
  assert.equal(JSON.stringify(existing), snapshot);
  assert.throws(() => buildContentImport([importedDraft('valid-first'), { ...importedDraft('bad-second'), url: 'javascript:alert(1)' }], existing, now), DomainError);
  assert.throws(() => buildContentImport(Array.from({ length: 201 }, (_, index) => importedDraft(String(index))), existing, now), DomainError);
  const userBatch = buildContentImport([{ title: '사용자가 확인한 링크', url: 'https://youtube.com/watch?v=x', category: 'other' }], [], now);
  assert.equal(userBatch.added, 1);
  assert.equal(userBatch.items[0].importedFrom, undefined);
  assert.equal(pruneExpiredContent(userBatch.items, at(API_RETENTION_MS)).removed, 0);
  assert.equal(JSON.stringify(existing), snapshot);
});

test('API title presentation and search fall back to user text when metadata expires', () => {
  const cached = { ...manual(), title: '저장한 YouTube 영상', titleMode: 'external' as const, external: { provider: 'youtube' as const, title: '노들섬의 저녁', fetchedAt: now } };
  assert.equal(displayContentTitle(cached, at(API_RETENTION_MS - 1)), '노들섬의 저녁');
  assert.equal(searchContent([cached], { query: '노들섬' }, now).length, 1);
  assert.equal(displayContentTitle(cached, at(API_RETENTION_MS)), '저장한 YouTube 영상');
  assert.equal(searchContent([cached], { query: '노들섬' }, at(API_RETENTION_MS)).length, 0);
  const cleaned = pruneExpiredContent([cached], at(API_RETENTION_MS));
  assert.equal(cleaned.changed, true);
  assert.equal(cleaned.removed, 0);
  assert.equal(cleaned.items[0].external, undefined);
  assert.equal(cleaned.items[0].titleMode, 'manual');
  assert.equal(cleaned.items[0].note, cached.note);
  assert.equal(cleaned.items[0].visited, true);
  assert.equal(cleaned.items[0].url, cached.url);
  assert.equal(displayContentTitle({ ...cached, title: '내가 고친 제목', titleMode: 'manual' }, now), '내가 고친 제목');
});

test('30 day retention removes entire API imports including edits but keeps manual links', () => {
  const apiItem = createContent({ ...importedDraft('private-video', 'grant-1'), note: '사용자가 수정한 메모' }, [], now);
  const legacy = manual();
  assert.equal(pruneExpiredContent([apiItem, legacy], at(API_RETENTION_MS - 1)).removed, 0);
  const expired = pruneExpiredContent([apiItem, legacy], at(API_RETENTION_MS));
  assert.deepEqual(expired.items, [legacy]);
  assert.equal(expired.removed, 1);
  assert.equal(apiItem.note, '사용자가 수정한 메모');
  assert.throws(() => createContent(importedDraft('stale'), [], at(API_RETENTION_MS)), DomainError);
});

test('account disconnection removes only the explicitly selected account imports', () => {
  const accountA = createContent(importedDraft('a', 'grant-A'), [], now);
  const accountB = createContent(importedDraft('b', 'grant-B'), [], now);
  const publiclyImported = createContent(importedDraft('public'), [], now);
  const items = [accountA, accountB, publiclyImported, manual()];
  assert.deepEqual(removeAccountImportedContent(items, 'grant-A').items, [accountB, publiclyImported, items[3]]);
  assert.equal(removeAccountImportedContent(items, 'unknown-grant').removed, 0);
  assert.deepEqual(removeAccountImportedContent(items).items, [publiclyImported, items[3]]);
});

test('metadata and private provenance require matching official source, method and grant id', () => {
  for (const draft of [
    { ...importedDraft('x'), url: 'https://youtube.com.evil.example/watch?v=x' },
    { ...importedDraft('x'), importedFrom: { provider: 'youtube', method: 'place-search', fetchedAt: now } },
    { ...importedDraft('x'), importedFrom: { provider: 'youtube', method: 'account-playlist', fetchedAt: now } },
    { ...importedDraft('x'), importedFrom: { provider: 'youtube', method: 'public-playlist', fetchedAt: now, connectionId: 'unsolicited' } },
    { ...importedDraft('x'), external: { provider: 'youtube', title: 'future', fetchedAt: at(5 * 60 * 1000 + 1) } },
    { ...importedDraft('x'), external: { provider: 'youtube', title: 'invalid', fetchedAt: '2026-02-30T03:00:00.000Z' } },
    { ...importedDraft('x'), external: null },
  ]) assert.throws(() => createContent(draft as DraftInput, [], now), DomainError);
  const invalidCache = { ...manual(), external: { provider: 'youtube' as const, title: 'invalid date', fetchedAt: 'not-a-date' } };
  assert.throws(() => pruneExpiredContent([invalidCache], now), DomainError);
  assert.throws(() => pruneExpiredContent([{ ...invalidCache, external: { ...invalidCache.external, fetchedAt: at(5 * 60 * 1000 + 1) } }], now), DomainError);
});

test('Naver coordinates include zero and valid boundaries, and require a Naver API origin', () => {
  const base: DraftInput = {
    title: '선택한 장소', url: 'https://map.naver.com/p/search/place', category: 'food', placeName: '선택한 장소',
    importedFrom: { provider: 'naver', method: 'place-search', fetchedAt: now },
    place: { provider: 'naver', name: '선택한 장소', address: '주소', latitude: 0, longitude: 0, fetchedAt: now },
  };
  const saved = createContent(base, [], now);
  assert.equal(saved.place?.latitude, 0);
  assert.equal(saved.place?.longitude, 0);
  assert.deepEqual(readStoredLibrary(serializeStoredLibrary([saved], now), now).items, [saved]);
  assert.ok(createContent({ ...base, place: { ...base.place!, latitude: -90, longitude: 180 } }, [], now));
  for (const place of [{ ...base.place!, latitude: 90.1 }, { ...base.place!, longitude: -180.1 }, { ...base.place!, latitude: Number.NaN }, { ...base.place!, longitude: Number.POSITIVE_INFINITY }, { ...base.place!, provider: 'youtube' }]) {
    assert.throws(() => createContent({ ...base, place } as DraftInput, [], now), DomainError);
  }
  assert.throws(() => createContent({ ...base, importedFrom: undefined }, [], now), DomainError);
  assert.throws(() => createContent({ ...base, url: 'https://example.com/place' }, [], now), DomainError);
});

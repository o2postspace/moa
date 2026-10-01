import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createContent,
  detectSource,
  DomainError,
  normalizeUrl,
  parseStoredContent,
  searchContent,
  validateDraft,
} from '../src/domain/content.ts';
import type { SavedContent } from '../src/domain/content.ts';

const now = '2026-10-01T03:00:00.000Z';

function content(overrides: Partial<SavedContent> = {}): SavedContent {
  return {
    id: 'existing',
    title: '성수 맛집',
    url: 'https://www.instagram.com/p/food/',
    source: 'instagram',
    category: 'food',
    placeName: '성수 식당',
    note: '친구와 주말에 방문',
    visited: false,
    createdAt: now,
    ...overrides,
  };
}

test('shared links accept a missing scheme but reject unsafe and insecure protocols', () => {
  assert.equal(normalizeUrl('  naver.me/abcd  '), 'https://naver.me/abcd');
  assert.equal(normalizeUrl('example.com:443/place'), 'https://example.com/place');
  for (const url of ['javascript:alert(1)', 'data:text/html,hello', 'file:///etc/passwd', 'http://naver.com', '//naver.com', 'https://', 'hello']) {
    assert.throws(() => normalizeUrl(url), (error: unknown) => error instanceof DomainError && error.code === 'validation');
  }
  assert.throws(() => normalizeUrl('https://naver.com@evil.example/path'));
});

test('source labels require official hostname boundaries', () => {
  assert.equal(detectSource('https://m.youtube.com/watch?v=abc123'), 'youtube');
  assert.equal(detectSource('https://map.naver.com/p/entry/place/123'), 'naver');
  assert.equal(detectSource('https://naver.me/abc'), 'naver');
  assert.equal(detectSource('https://www.instagram.com/p/abc'), 'instagram');
  for (const url of ['https://naver.com.evil.example', 'https://fakeinstagram.com/p/1', 'https://youtube.evil.example/watch?v=1', 'https://evil.example/naver.com', 'https://naver-food.example']) {
    assert.equal(detectSource(url), 'web');
  }
});

test('YouTube share/watch/shorts links identify the same saved video', () => {
  const urls = [
    'https://youtu.be/dQw4w9WgXc?si=tracking',
    'https://m.youtube.com/shorts/dQw4w9WgXc?feature=share',
    'https://www.youtube.com/watch?v=dQw4w9WgXc&utm_source=share',
  ];
  assert.equal(new Set(urls.map(normalizeUrl)).size, 1);
  const saved = createContent({ title: '한강 산책 영상', url: urls[0], category: 'other' }, [], now);
  assert.throws(
    () => createContent({ title: '다른 제목', url: urls[1], category: 'other' }, [saved], now),
    (error: unknown) => error instanceof DomainError && error.code === 'duplicate' && error.duplicateId === saved.id,
  );
});

test('normalization retains playback, playlist, location and other meaningful query values', () => {
  const video = new URL(normalizeUrl('https://youtu.be/dQw4w9WgXc?t=45&list=PLtest&si=tracking'));
  assert.equal(video.searchParams.get('t'), '45');
  assert.equal(video.searchParams.get('list'), 'PLtest');
  assert.equal(video.searchParams.has('si'), false);
  const website = new URL(normalizeUrl('https://example.com/place?id=42&lat=37.5&si=business-value&utm_campaign=test&fbclid=tracking#menu'));
  assert.equal(website.searchParams.get('id'), '42');
  assert.equal(website.searchParams.get('lat'), '37.5');
  assert.equal(website.searchParams.get('si'), 'business-value');
  assert.equal(website.searchParams.has('utm_campaign'), false);
  assert.equal(website.hash, '#menu');
});

test('validation returns field errors and successful saves trim user text', () => {
  assert.deepEqual(Object.keys(validateDraft({ title: ' ', url: 'javascript:alert(1)', category: 'food' })).sort(), ['title', 'url']);
  const saved = createContent({ title: '  노들섬  ', url: 'naver.me/event', category: 'event', placeName: '  노들섬  ', note: '  일정 확인  ' }, [], now);
  assert.equal(saved.title, '노들섬');
  assert.equal(saved.placeName, '노들섬');
  assert.equal(saved.note, '일정 확인');
  assert.equal(saved.source, 'naver');
  assert.equal(saved.visited, false);
  assert.equal(saved.createdAt, now);
  assert.ok(saved.id);
});

test('search combines text, category and source without changing the original list', () => {
  const items = [
    content(),
    content({ id: 'event', title: '빛 축제', placeName: '노들섬', note: '친구와 야경', category: 'event', source: 'naver', url: 'https://naver.me/event' }),
    content({ id: 'cafe', title: 'Seoul Coffee', placeName: '성수', note: '조용한 자리', category: 'cafe', source: 'youtube', url: 'https://www.youtube.com/watch?v=abc' }),
  ];
  assert.deepEqual(searchContent(items, { query: '  성수 친구  ', category: 'food', source: 'instagram' }).map((item) => item.id), ['existing']);
  assert.deepEqual(searchContent(items, { query: '노들섬' }).map((item) => item.id), ['event']);
  assert.deepEqual(searchContent(items, { query: 'SEOUL', category: 'cafe' }).map((item) => item.id), ['cafe']);
  assert.deepEqual(searchContent(items, { source: 'all', category: 'all' }), items);
  assert.equal(items.length, 3);
});

test('storage round trips valid content and distinguishes missing storage from corruption', () => {
  const saved = content();
  assert.deepEqual(parseStoredContent(null), []);
  assert.deepEqual(parseStoredContent('[]'), []);
  assert.deepEqual(parseStoredContent(JSON.stringify([saved])), [saved]);
  for (const raw of ['', '{broken', '{}', '[null]', JSON.stringify([{ ...saved, visited: 'false' }]), JSON.stringify([{ ...saved, category: 'invalid' }]), JSON.stringify([{ ...saved, createdAt: 'yesterday' }]), JSON.stringify([saved, saved])]) {
    assert.throws(() => parseStoredContent(raw), DomainError);
  }
});

test('persisted links cannot bypass protocol or source validation', () => {
  assert.throws(() => parseStoredContent(JSON.stringify([content({ url: 'javascript:alert(1)' })])), DomainError);
  assert.throws(() => parseStoredContent(JSON.stringify([content({ url: 'https://instagram.com.evil.example/p/1' })])), DomainError);
  assert.throws(() => parseStoredContent(JSON.stringify([content({ url: 'http://instagram.com/p/1' })])), DomainError);
});

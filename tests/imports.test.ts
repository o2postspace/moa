import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ImportParseError,
  MAX_IMPORT_BYTES,
  parseImportCandidates,
} from '../src/domain/imports.ts';

test('TXT normalizes shared YouTube URLs, skips duplicates, and keeps meaningful parameters', () => {
  const result = parseImportCandidates([
    'https://youtu.be/example123?si=tracking',
    'https://www.youtube.com/watch?v=example123&utm_source=share',
    'https://youtu.be/example123?t=20',
    'https://naver.me/example',
    '',
  ].join('\r\n'), 'txt');
  assert.equal(result.items.length, 3);
  assert.equal(result.duplicates, 1);
  assert.equal(result.unsupported, 0);
  assert.equal(result.items[0].url, 'https://www.youtube.com/watch?v=example123');
  assert.equal(result.items[0].title, 'YouTube 링크');
  assert.equal(new URL(result.items[1].url).searchParams.get('t'), '20');
});

test('unsafe URLs, non-HTTPS URLs, hostname impersonation and nonstandard ports are excluded', () => {
  const urls = [
    'http://www.instagram.com/p/example/',
    'instagram.com/p/example/',
    'javascript:alert(1)',
    'https://www.instagram.com@evil.example/p/example/',
    'https://www.instagram.com.evil.example/p/example/',
    'https://fakeinstagram.com/p/example/',
    'https://evil.example/?site=youtube.com',
    'https://instagram.com:8443/p/example/',
    'https://instagram.com\\@evil.example/path',
    'https://www.instagram.com/p/unsafe\u0000/',
    'https://127.0.0.1/youtube.com',
    'https://you\u0442ube.com/watch?v=example',
  ];
  const result = parseImportCandidates(JSON.stringify(urls.map(url => ({ url }))), 'json');
  assert.deepEqual(result, { items: [], duplicates: 0, unsupported: urls.length });
  assert.equal(parseImportCandidates('https://www.instagram.com:443/p/example/', 'txt').items.length, 1);
});

test('generic JSON trims titles, limits their length and reports malformed records separately', () => {
  const result = parseImportCandidates(JSON.stringify([
    { url: 'https://www.instagram.com/p/example/?igsh=tracking', title: '  직접 준비한 제목  ' },
    { url: 'https://map.naver.com/p/entry/place/123', title: '😀'.repeat(80) },
    { url: 'https://m.youtube.com/watch?v=example', title: '' },
    null,
    { url: 1 },
    { url: 'https://naver.me/bad-title', title: 42 },
  ]), 'json');
  assert.equal(result.items[0].title, '직접 준비한 제목');
  assert.equal(result.items[0].url, 'https://www.instagram.com/p/example/');
  assert.equal(result.items[1].title, '😀'.repeat(60));
  assert.equal(result.items[2].title, 'YouTube 링크');
  assert.equal(result.unsupported, 3);
});

test('saved_saved_media reads only direct string_map_data href fields and does not sweep personal data', () => {
  const result = parseImportCandidates(JSON.stringify({
    saved_saved_media: [
      { title: '사용자가 확인할 예시', string_map_data: { 'Saved on': { href: 'https://www.instagram.com/reel/example/' } } },
      { string_map_data: { 'Saved on': { href: 'https://www.instagram.com/reel/example/?igsh=duplicate' } } },
      { string_map_data: { 'Other data': { nested: { href: 'https://www.instagram.com/p/do-not-read/' } } } },
      { string_map_data: { field: { href: 'https://evil.example/' } } },
    ],
    private_messages: [{ url: 'https://www.instagram.com/p/private-message/' }],
  }), 'json');
  assert.deepEqual(result, {
    items: [{ url: 'https://www.instagram.com/reel/example/', title: '사용자가 확인할 예시' }],
    duplicates: 1,
    unsupported: 2,
  });
});

test('unknown JSON structures and broken JSON return format errors instead of a false success', () => {
  for (const text of ['{broken', '{}', '{"messages":[{"url":"https://naver.me/example"}]}', '{"saved_saved_media":{}}', 'null']) {
    assert.throws(() => parseImportCandidates(text, 'json'), (error: unknown) => error instanceof ImportParseError && error.code === 'format');
  }
  assert.deepEqual(parseImportCandidates('[]', 'json'), { items: [], duplicates: 0, unsupported: 0 });
  assert.deepEqual(parseImportCandidates('\uFEFF[ {"url":"https://naver.me/example"} ]', 'json').items, [{ url: 'https://naver.me/example', title: '네이버 링크' }]);
  assert.deepEqual(parseImportCandidates(' \r\n ', 'txt'), { items: [], duplicates: 0, unsupported: 0 });
});

test('200-record limit fails the whole input and never silently imports only a prefix', () => {
  const links = Array.from({ length: 201 }, (_, index) => `https://naver.me/example${index}`);
  assert.equal(parseImportCandidates(links.slice(0, 200).join('\n'), 'txt').items.length, 200);
  for (const text of [links.join('\n'), Array(201).fill('https://naver.me/same').join('\n')]) {
    assert.throws(() => parseImportCandidates(text, 'txt'), (error: unknown) => error instanceof ImportParseError && error.code === 'limit');
  }
  assert.throws(() => parseImportCandidates(JSON.stringify(links.map(url => ({ url }))), 'json'), ImportParseError);
  const manyFields = Object.fromEntries(links.map((href, index) => [`field${index}`, { href }]));
  assert.throws(() => parseImportCandidates(JSON.stringify({ saved_saved_media: [{ string_map_data: manyFields }] }), 'json'), (error: unknown) => error instanceof ImportParseError && error.code === 'limit');
});

test('2MiB limit measures UTF-8 bytes including Korean and surrogate pairs before parsing', () => {
  assert.deepEqual(parseImportCandidates(' '.repeat(MAX_IMPORT_BYTES), 'txt'), { items: [], duplicates: 0, unsupported: 0 });
  for (const text of [' '.repeat(MAX_IMPORT_BYTES + 1), '가'.repeat(Math.floor(MAX_IMPORT_BYTES / 3) + 1), '😀'.repeat(MAX_IMPORT_BYTES / 4 + 1)]) {
    assert.throws(() => parseImportCandidates(text, 'txt'), (error: unknown) => error instanceof ImportParseError && error.code === 'size');
  }
  // Lone surrogates become replacement characters when UTF-8 encoded.
  assert.throws(() => parseImportCandidates('\uD800'.repeat(Math.floor(MAX_IMPORT_BYTES / 3) + 1), 'txt'), (error: unknown) => error instanceof ImportParseError && error.code === 'size');
});

test('parser does not mutate supplied input or consume arbitrary JSON url properties', () => {
  const text = JSON.stringify([{ url: 'https://naver.me/example', title: '예시', nested: { url: 'https://naver.me/ignore' } }]);
  const before = text;
  assert.equal(parseImportCandidates(text, 'json').items.length, 1);
  assert.equal(text, before);
});

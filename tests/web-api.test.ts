import assert from 'node:assert/strict';
import test from 'node:test';
import { IntegrationError, integrationsApi, youtubeAuthorizationUrl } from '../src/web/lib/api.ts';

async function withFetch(mock: typeof fetch, check: () => Promise<void>) {
  const original = globalThis.fetch;
  globalThis.fetch = mock;
  try { await check(); }
  finally { globalThis.fetch = original; }
}

test('browser API uses relative paths, cookies and no redirects for both query and JSON requests', { concurrency: false }, async () => {
  const calls: { path: string; init?: RequestInit }[] = [];
  await withFetch(async (input, init) => {
    assert.equal(typeof input, 'string');
    calls.push({ path: String(input), init });
    return new Response('{}', { status: 200 });
  }, async () => {
    const playlistUrl = 'https://www.youtube.com/playlist?list=PLexample&feature=shared';
    await integrationsApi.publicPlaylist(playlistUrl, 'next+page/token');
    await integrationsApi.metadata('https://youtu.be/example');
    for (const call of calls) {
      assert.match(call.path, /^\/api\//);
      assert.equal(new URL(call.path, 'https://moa.example').origin, 'https://moa.example');
      assert.equal(call.init?.credentials, 'include');
      assert.equal(call.init?.cache, 'no-store');
      assert.equal(call.init?.redirect, 'error');
      assert.ok(call.init?.signal instanceof AbortSignal);
    }
    const query = new URL(calls[0].path, 'https://moa.example').searchParams;
    assert.equal(query.get('url'), playlistUrl);
    assert.equal(query.get('pageToken'), 'next+page/token');
    assert.equal(query.has('feature'), false);
    assert.equal(calls[0].init?.method, 'GET');
    assert.equal(calls[0].init?.body, undefined);
    assert.equal(calls[1].init?.method, 'POST');
    assert.equal(new Headers(calls[1].init?.headers).get('Content-Type'), 'application/json');
    assert.deepEqual(JSON.parse(String(calls[1].init?.body)), { url: 'https://youtu.be/example' });
  });
});

test('OAuth accepts the fixed Google authorization endpoint and rejects impersonation or alternate destinations', () => {
  const valid = 'https://accounts.google.com/o/oauth2/v2/auth?state=example&code_challenge=example';
  assert.equal(youtubeAuthorizationUrl(valid), valid);
  const invalid = [
    'https://accounts.google.com.evil.example/o/oauth2/v2/auth',
    'https://accounts.google.com@evil.example/o/oauth2/v2/auth',
    'https://user:secret@accounts.google.com/o/oauth2/v2/auth',
    'https://accounts.google.com:444/o/oauth2/v2/auth',
    'http://accounts.google.com/o/oauth2/v2/auth',
    'https://accounts.google.com/other',
    'https://accounts.google.com/o/oauth2/v2/auth#other',
    '//accounts.google.com/o/oauth2/v2/auth',
    'javascript:alert(1)',
  ];
  for (const value of invalid) assert.throws(() => youtubeAuthorizationUrl(value), /Google 연결 주소/);
});

test('browser API retains actionable auth errors and sanitizes malformed or network responses', { concurrency: false }, async () => {
  await withFetch(async () => new Response(JSON.stringify({ error: { code: 'auth_required', message: '다시 연결해 주세요.' } }), { status: 401 }), async () => {
    await assert.rejects(integrationsApi.playlists(), error => error instanceof IntegrationError && error.status === 401 && error.code === 'auth_required' && error.message === '다시 연결해 주세요.');
  });
  await withFetch(async () => new Response('private upstream body', { status: 502 }), async () => {
    await assert.rejects(integrationsApi.status(), error => error instanceof IntegrationError && error.code === 'invalid_response' && !error.message.includes('private upstream body'));
  });
  await withFetch(async () => { throw new TypeError('private network details'); }, async () => {
    await assert.rejects(integrationsApi.status(), error => error instanceof Error && error.message.includes('연동 서버에 연결하지 못') && !error.message.includes('private network details'));
  });
});

test('browser API aborts a stalled request at its deadline with a retryable message', { concurrency: false }, async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  try {
    await withFetch((_input, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('private timeout detail', 'AbortError')), { once: true });
    }), async () => {
      const pending = integrationsApi.status();
      context.mock.timers.tick(15_000);
      await assert.rejects(pending, error => error instanceof Error && error.message.includes('응답이 늦어지고') && !error.message.includes('private timeout detail'));
    });
  } finally { context.mock.timers.reset(); }
});

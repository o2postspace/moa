import assert from 'node:assert/strict';
import test from 'node:test';
import { IntegrationError } from '../src/web/lib/api.ts';
import { instagramAnalysisApi } from '../src/web/lib/instagramAnalysisApi.ts';

const instagramUrl = 'https://www.instagram.com/reel/PublicExample/';
const result = () => ({
  provider: 'anyjev',
  category: { value: 'cafe', scores: { food: 0.05, cafe: 0.8, event: 0.1, other: 0.05 }, route: 'one_forward', reasoningTokens: 0 },
  evidence: { value: 'enough', scores: { enough: 0.9, needs_more: 0.1 }, route: 'one_forward', reasoningTokens: 0 },
  reviewRequired: false,
  metrics: { inputCharacters: 24, preparedCharacters: 28, truncated: false, sources: ['caption'], decisions: 2, reasoningTokens: 0, elapsedMs: 500 },
  cached: false,
});

async function withFetch(mock: typeof fetch, check: () => Promise<void>) {
  const original = globalThis.fetch;
  globalThis.fetch = mock;
  try { await check(); }
  finally { globalThis.fetch = original; }
}

test('Instagram analysis posts only user supplied text to same-origin fixed endpoints with cookies and bounded requests', { concurrency: false }, async () => {
  const calls: { path: string; init?: RequestInit }[] = [];
  await withFetch(async (input, init) => {
    calls.push({ path: String(input), init });
    return new Response(JSON.stringify(init?.method === 'POST' ? result() : { configured: false, reachable: false, provider: 'anyjev' }));
  }, async () => {
    const status = await instagramAnalysisApi.status();
    assert.equal(status.configured, false);
    const text = { url: instagramUrl, caption: '성수 카페의 핸드드립', ocr: 'COFFEE', transcript: '커피를 마셔요' };
    assert.deepEqual(await instagramAnalysisApi.analyze(text), result());
    assert.deepEqual(calls.map(call => call.path), ['/api/instagram/analysis/status', '/api/instagram/analysis']);
    for (const call of calls) {
      assert.equal(call.init?.credentials, 'include');
      assert.equal(call.init?.cache, 'no-store');
      assert.equal(call.init?.redirect, 'error');
      assert.ok(call.init?.signal instanceof AbortSignal);
    }
    assert.equal(calls[0].init?.method, 'GET');
    assert.equal(calls[0].init?.body, undefined);
    assert.equal(calls[1].init?.method, 'POST');
    assert.equal(new Headers(calls[1].init?.headers).get('Content-Type'), 'application/json');
    assert.deepEqual(JSON.parse(String(calls[1].init?.body)), text);
  });
});

test('Instagram analysis rejects non-post URLs before network access', { concurrency: false }, async () => {
  let calls = 0;
  await withFetch(async () => { calls += 1; return new Response('{}'); }, async () => {
    for (const url of [
      'https://www.instagram.com.evil.example/reel/example/',
      'https://www.instagram.com/someprofile/',
      'https://www.instagram.com/tv/example/',
      'https://www.youtube.com/watch?v=example',
    ]) await assert.rejects(instagramAnalysisApi.analyze({ url, caption: '카페' }));
    assert.equal(calls, 0);
  });
});

test('Instagram analysis distinguishes missing setup and rejects malformed status or result without rendering false recommendations', { concurrency: false }, async () => {
  await withFetch(async () => new Response(JSON.stringify({ error: { code: 'setup_required', message: 'AnyJev 모델 연결이 필요해요.' } }), { status: 503 }), async () => {
    await assert.rejects(instagramAnalysisApi.analyze({ url: instagramUrl, caption: '카페' }), error => error instanceof IntegrationError && error.code === 'setup_required' && error.status === 503);
  });
  for (const invalid of [
    { configured: false, reachable: true, provider: 'anyjev' },
    { configured: 'yes', reachable: true, provider: 'anyjev' },
    { configured: true, reachable: true, provider: 'other-model' },
  ]) await withFetch(async () => new Response(JSON.stringify(invalid)), async () => {
    await assert.rejects(instagramAnalysisApi.status(), error => error instanceof IntegrationError && error.code === 'invalid_response');
  });
  const malformed = [
    { ...result(), provider: 'fake-provider' },
    { ...result(), category: { ...result().category, value: 'made-up-category' } },
    { ...result(), category: { ...result().category, scores: { food: 0.2, cafe: 0.8, event: 0.1, other: 0.05 } } },
    { ...result(), category: { ...result().category, value: 'food' } },
    { ...result(), category: { ...result().category, reasoningTokens: 10 } },
    { ...result(), evidence: { ...result().evidence, route: 'imaginary' } },
    { ...result(), metrics: { ...result().metrics, preparedCharacters: 2401 } },
    { ...result(), metrics: { ...result().metrics, inputCharacters: 8001 } },
    { ...result(), metrics: { ...result().metrics, sources: ['caption', 'caption'] } },
    { ...result(), metrics: { ...result().metrics, sources: ['scraped-html'] } },
    { ...result(), cached: 'yes' },
  ];
  for (const invalid of malformed) await withFetch(async () => new Response(JSON.stringify(invalid)), async () => {
    await assert.rejects(instagramAnalysisApi.analyze({ url: instagramUrl, caption: '카페' }), error => error instanceof IntegrationError && error.code === 'invalid_response');
  });
});

test('Instagram analysis accepts nullable measured tokens and repeated result markers without inventing a savings percentage', { concurrency: false }, async () => {
  const payload = {
    ...result(), cached: true,
    category: { ...result().category, route: 'cot', reasoningTokens: null },
    evidence: { ...result().evidence, reasoningTokens: null },
    metrics: { ...result().metrics, reasoningTokens: null },
  };
  await withFetch(async () => new Response(JSON.stringify(payload)), async () => {
    assert.deepEqual(await instagramAnalysisApi.analyze({ url: instagramUrl, caption: '카페' }), payload);
  });
});

test('Instagram analysis sanitizes malformed, oversized and network errors while retaining retry messages', { concurrency: false }, async () => {
  for (const response of [
    () => new Response('private upstream body', { status: 502 }),
    () => new Response(' '.repeat(32_001), { status: 200 }),
    () => new Response(JSON.stringify({ error: { code: 'private/code', message: 'private\u0000control details' } }), { status: 502 }),
  ]) await withFetch(async () => response(), async () => {
    await assert.rejects(instagramAnalysisApi.status(), error => error instanceof IntegrationError && !error.message.includes('private') && !error.code.includes('/'));
  });
  await withFetch(async () => { throw new TypeError('private network endpoint'); }, async () => {
    await assert.rejects(instagramAnalysisApi.status(), error => error instanceof Error && error.message.includes('연결하지 못') && !error.message.includes('private'));
  });
});

test('Instagram analysis waits at most 65 seconds and returns a safe retryable timeout', { concurrency: false }, async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  try {
    await withFetch((_input, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('private timeout', 'AbortError')), { once: true });
    }), async () => {
      const pending = instagramAnalysisApi.analyze({ url: instagramUrl, caption: '카페' });
      context.mock.timers.tick(65_000);
      await assert.rejects(pending, error => error instanceof Error && error.message.includes('지연되고') && !error.message.includes('private'));
    });
  } finally { context.mock.timers.reset(); }
});

test('Instagram analysis respects pre-cancelled signals and discards late responses after input cancellation', { concurrency: false }, async () => {
  const preCancelled = new AbortController();
  preCancelled.abort();
  let calls = 0;
  await withFetch(async () => { calls += 1; return new Response('{}'); }, async () => {
    await assert.rejects(instagramAnalysisApi.status(preCancelled.signal), error => error instanceof DOMException && error.name === 'AbortError');
    assert.equal(calls, 0);
  });
  const active = new AbortController();
  let respond: (value: Response) => void = () => { throw new Error('Fetch has not started'); };
  await withFetch(() => new Promise<Response>(resolve => { respond = resolve; }), async () => {
    const pending = instagramAnalysisApi.analyze({ url: instagramUrl, caption: '카페' }, active.signal);
    active.abort();
    respond(new Response(JSON.stringify(result())));
    await assert.rejects(pending, error => error instanceof DOMException && error.name === 'AbortError');
  });
});

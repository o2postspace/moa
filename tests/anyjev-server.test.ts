import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import type { TestContext } from 'node:test';
import type { AddressInfo } from 'node:net';
import { configFromEnv, createApiServer } from '../server/api.ts';
import { AnyJevError, anyJevConfigFromEnv, createAnyJevGateway } from '../server/anyjev.ts';

const origin = 'http://localhost:8081';
const postUrl = 'https://www.instagram.com/reel/review_123/';
const evidence = { url: postUrl, caption: '성수동 카페에서 라테와 디저트를 먹었어요.' };
type FetchCall = { url: URL; init: RequestInit };

function mockFetch(respond: (call: FetchCall) => Response | Promise<Response>, calls: FetchCall[] = []): typeof fetch {
  return (async (input: URL | RequestInfo, init?: RequestInit) => {
    const call = { url: new URL(String(input)), init: init || {} };
    calls.push(call);
    return respond(call);
  }) as typeof fetch;
}

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
}

function decisions(): { decisions: { answer: string; index: number; probs: unknown; margin: number; route: string; reasoning_tokens: number }[] } {
  return { decisions: [
    { answer: 'cafe', index: 1, probs: { food: 0.05, cafe: 0.85, event: 0.05, other: 0.05 }, margin: 0.8, route: 'one_forward', reasoning_tokens: 0 },
    { answer: 'enough', index: 0, probs: { enough: 0.9, needs_more: 0.1 }, margin: 0.8, route: 'one_forward', reasoning_tokens: 0 },
  ] };
}

async function fixture(t: TestContext, options: Parameters<typeof createApiServer>[0] = {}) {
  const server = createApiServer({ config: { ...configFromEnv({}), anyjevBaseUrl: 'http://127.0.0.1:8000' }, ...options });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise<void>((resolve) => { server.closeAllConnections(); server.close(() => resolve()); }));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return {
    get: (path: string) => fetch(base + path),
    post: (value: unknown, path = '/api/instagram/analysis', requestOrigin = origin) => fetch(base + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: requestOrigin }, body: JSON.stringify(value),
    }),
  };
}

test('AnyJev config is opt-in, loopback only and timeout bounded', () => {
  assert.deepEqual(anyJevConfigFromEnv({}), { baseUrl: '', timeoutMs: 45_000 });
  assert.equal(anyJevConfigFromEnv({ ANYJEV_BASE_URL: ' http://localhost:8000/ ' }).baseUrl, 'http://localhost:8000');
  assert.equal(configFromEnv({ ANYJEV_BASE_URL: 'http://127.0.0.1:8000' }).anyjevBaseUrl, 'http://127.0.0.1:8000');
  for (const value of ['https://127.0.0.1:8000', 'http://example.test', 'http://localhost.evil.test', 'http://0.0.0.0', 'http://user:secret@localhost:8000', 'http://localhost:8000/v1', 'http://localhost:8000/?key=secret', 'http://localhost:8000/#fragment']) {
    assert.throws(() => anyJevConfigFromEnv({ ANYJEV_BASE_URL: value }));
  }
  for (const value of ['999', '60001', '1.5', 'wrong']) assert.throws(() => anyJevConfigFromEnv({ ANYJEV_TIMEOUT_MS: value }));
});

test('unconfigured status and analysis never make outbound requests', async (t) => {
  let calls = 0;
  const api = await fixture(t, { config: configFromEnv({}), fetchImpl: mockFetch(() => { calls++; throw new Error('must not fetch'); }) });
  assert.deepEqual(await (await api.get('/api/instagram/analysis/status')).json(), { provider: 'anyjev', configured: false, reachable: false });
  const response = await api.post(evidence);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, 'setup_required');
  assert.equal(calls, 0);
});

test('normal API status does not invoke AnyJev and explicit status checks only its fixed health endpoint', async (t) => {
  const calls: FetchCall[] = [];
  const api = await fixture(t, { fetchImpl: mockFetch(() => json({ ok: true }), calls) });
  await api.get('/api/status');
  assert.equal(calls.length, 0);
  const status = await api.get('/api/instagram/analysis/status');
  assert.deepEqual(await status.json(), { provider: 'anyjev', configured: true, reachable: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url.href, 'http://127.0.0.1:8000/health');
  assert.equal(calls[0].init.redirect, 'error');
  assert.ok(calls[0].init.signal);
});

test('health failure reports configured but unreachable without forwarding private upstream details', async (t) => {
  const api = await fixture(t, { fetchImpl: mockFetch(() => { throw new Error('private traceback secret'); }) });
  const value = await (await api.get('/api/instagram/analysis/status')).json();
  assert.deepEqual(value, { provider: 'anyjev', configured: true, reachable: false });
});

test('health requires HTTP 200 and a JSON object with literal ok true', async (t) => {
  const responses = [json({ unrelated: 'private health body' }), json({ ok: false }), json({ ok: 'true' }),
    json([{ ok: true }]), new Response('private non-JSON health body'), json({ ok: true }, 201), json({ ok: true }, 503)];
  const api = await fixture(t, { fetchImpl: mockFetch(() => responses.shift() || json({ ok: true })) });
  for (let index = 0; index < 7; index++) {
    const response = await api.get('/api/instagram/analysis/status');
    assert.equal(response.status, 200);
    const value = await response.json();
    assert.deepEqual(value, { provider: 'anyjev', configured: true, reachable: false });
    assert.equal(JSON.stringify(value).includes('private'), false);
  }
  assert.equal((await (await api.get('/api/instagram/analysis/status')).json()).reachable, true);
});

test('health rejects both declared and streamed responses above 4KiB', async (t) => {
  let canceled = false;
  const responses = [
    new Response('small', { headers: { 'Content-Length': '4097' } }),
    new Response(new ReadableStream<Uint8Array>({
      pull(controller) { controller.enqueue(new Uint8Array(1024).fill(32)); },
      cancel() { canceled = true; },
    })),
  ];
  const api = await fixture(t, { fetchImpl: mockFetch(() => responses.shift()!) });
  for (let index = 0; index < 2; index++) assert.equal((await (await api.get('/api/instagram/analysis/status')).json()).reachable, false);
  assert.equal(canceled, true);
});

test('health deadline cancels an unfinished stream even when the injected response ignores the fetch signal', async () => {
  let canceled = false;
  const gateway = createAnyJevGateway({ config: { baseUrl: 'http://localhost:8000', timeoutMs: 1000 }, fetchImpl: mockFetch(() =>
    new Response(new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new TextEncoder().encode('{"ok":true')); },
      cancel() { canceled = true; },
    }))) });
  const keepAlive = setTimeout(() => undefined, 1100);
  try { assert.deepEqual(await gateway.status(), { provider: 'anyjev', configured: true, reachable: false }); }
  finally { clearTimeout(keepAlive); }
  assert.equal(canceled, true);
});

test('decision response deadline releases the slot if the stream never finishes', async () => {
  let calls = 0;
  const gateway = createAnyJevGateway({ config: { baseUrl: 'http://localhost:8000', timeoutMs: 1000 }, fetchImpl: mockFetch(() => {
    calls++;
    return calls === 1 ? new Response(new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new TextEncoder().encode('{"decisions":')); } })) : json(decisions());
  }) });
  const keepAlive = setTimeout(() => undefined, 1100);
  try { await assert.rejects(gateway.analyze(evidence, postUrl), (error) => error instanceof AnyJevError && error.code === 'analysis_unavailable'); }
  finally { clearTimeout(keepAlive); }
  assert.equal((await gateway.analyze(evidence, postUrl)).cached, false);
});

test('analysis validates official post/reel URL, text and origin before any inference', async (t) => {
  const calls: FetchCall[] = [];
  const api = await fixture(t, { fetchImpl: mockFetch(() => json(decisions()), calls) });
  for (const value of [
    { ...evidence, url: 'https://instagram.com.evil.test/reel/a/' },
    { ...evidence, url: 'https://www.instagram.com/user/' },
    { ...evidence, url: 'http://www.instagram.com/p/a/' },
    { ...evidence, url: 'https://user:secret@www.instagram.com/p/a/' },
    { url: postUrl }, { url: postUrl, caption: 1 }, { url: postUrl, caption: 'x'.repeat(8001) },
  ]) assert.equal((await api.post(value)).status, 400);
  assert.equal((await api.post(evidence, undefined, 'https://evil.test')).status, 403);
  assert.equal(calls.length, 0);
});

test('analysis sends only compact evidence and two choice questions to a fixed local endpoint', async (t) => {
  const calls: FetchCall[] = [];
  const api = await fixture(t, { fetchImpl: mockFetch(() => json(decisions()), calls) });
  const response = await api.post(evidence);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const result = await response.json();
  assert.equal(result.category.value, 'cafe');
  assert.equal(result.evidence.value, 'enough');
  assert.equal(result.cached, false);
  assert.equal(result.metrics.decisions, 2);
  assert.equal(result.metrics.reasoningTokens, 0);
  assert.equal(result.metrics.inputCharacters, evidence.caption.length);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url.href, 'http://127.0.0.1:8000/v1/decide');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.redirect, 'error');
  const payload = JSON.parse(String(calls[0].init.body));
  assert.equal(payload.items.length, 2);
  assert.ok(payload.items.every((item: { kind: string; state: string }) => item.kind === 'choice' && item.state.includes('성수동')));
  assert.equal(JSON.stringify(payload).includes(postUrl), false);
  assert.equal(JSON.stringify(result).includes(evidence.caption), false);
});

test('analysis body allows Korean evidence above 8KiB but retains old route and 40KiB limits', async (t) => {
  const api = await fixture(t, { fetchImpl: mockFetch(() => json(decisions())) });
  const largeEvidence = { url: postUrl, caption: '한글'.repeat(1500) };
  assert.ok(Buffer.byteLength(JSON.stringify(largeEvidence)) > 8192);
  const response = await api.post(largeEvidence);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).metrics.truncated, true);
  assert.equal((await api.post(largeEvidence, '/api/metadata')).status, 413);
  assert.equal((await api.post({ url: postUrl, caption: '가'.repeat(15_000) })).status, 413);
});

test('identical canonical URL and evidence reuse cached decisions while changed evidence reruns', async (t) => {
  const calls: FetchCall[] = [];
  const api = await fixture(t, { fetchImpl: mockFetch(() => json(decisions()), calls) });
  assert.equal((await (await api.post(evidence)).json()).cached, false);
  assert.equal((await (await api.post({ ...evidence, url: 'https://instagram.com/reel/review_123/?igsh=track' })).json()).cached, true);
  assert.equal(calls.length, 1);
  assert.equal((await (await api.post({ ...evidence, caption: evidence.caption + ' 새로 방문했어요.' })).json()).cached, false);
  assert.equal(calls.length, 2);
});

test('cached result is immutable to callers and cache expires after 15 minutes', async () => {
  let time = 1000;
  let calls = 0;
  const gateway = createAnyJevGateway({ config: { baseUrl: 'http://127.0.0.1:8000', timeoutMs: 1000 }, now: () => time, fetchImpl: mockFetch(() => { calls++; return json(decisions()); }) });
  const first = await gateway.analyze(evidence, postUrl);
  first.category.value = 'food';
  const second = await gateway.analyze(evidence, postUrl);
  assert.equal(second.category.value, 'cafe');
  assert.equal(second.cached, true);
  time += 15 * 60_000;
  assert.equal((await gateway.analyze(evidence, postUrl)).cached, false);
  assert.equal(calls, 2);
});

test('concurrent identical analyses coalesce and distinct analysis is limited until completion', async () => {
  let resolve!: (value: Response) => void;
  let calls = 0;
  const response = new Promise<Response>((done) => { resolve = done; });
  const gateway = createAnyJevGateway({ config: { baseUrl: 'http://localhost:8000', timeoutMs: 1000 }, fetchImpl: mockFetch(() => { calls++; return response; }) });
  const first = gateway.analyze(evidence, postUrl);
  const second = gateway.analyze(evidence, postUrl);
  await assert.rejects(gateway.analyze({ ...evidence, caption: '다른 카페' }, postUrl), (error) => error instanceof AnyJevError && error.status === 429);
  resolve(json(decisions()));
  assert.equal((await first).category.value, 'cafe');
  assert.equal((await second).category.value, 'cafe');
  assert.equal(calls, 1);
});

test('upstream timeout releases inference slot and a later explicit retry can succeed', async () => {
  let calls = 0;
  const gateway = createAnyJevGateway({ config: { baseUrl: 'http://localhost:8000', timeoutMs: 1000 }, fetchImpl: mockFetch((call) => {
    calls++;
    if (calls > 1) return json(decisions());
    return new Promise<Response>((_resolve, reject) => { call.init.signal!.addEventListener('abort', () => reject(new Error('private timeout')), { once: true }); });
  }) });
  // AbortSignal.timeout is unref'ed; keep the isolated test alive until it fires.
  const keepAlive = setTimeout(() => undefined, 1100);
  try { await assert.rejects(gateway.analyze(evidence, postUrl), (error) => error instanceof AnyJevError && error.code === 'analysis_unavailable'); } finally { clearTimeout(keepAlive); }
  assert.equal((await gateway.analyze(evidence, postUrl)).cached, false);
  assert.equal(calls, 2);
});

test('malformed, oversized and non-success upstream responses never leak provider bodies or cache failures', async (t) => {
  const responses = [
    json({ private: 'private traceback secret' }, 500),
    new Response('{broken private traceback secret'),
    json({ decisions: [] }),
    new Response('x'.repeat(65_537)),
    new Response('small', { headers: { 'Content-Length': '65537' } }),
    json({ private: 'private traceback secret' }, 429),
  ];
  let calls = 0;
  const api = await fixture(t, { fetchImpl: mockFetch(() => { calls++; return responses.shift() || json(decisions()); }) });
  for (let index = 0; index < 6; index++) {
    const response = await api.post(evidence);
    assert.equal(response.status, index === 5 ? 429 : 502);
    const body = await response.text();
    assert.equal(body.includes('private'), false);
    assert.equal(body.includes('traceback'), false);
  }
  assert.equal((await api.post(evidence)).status, 200);
  assert.equal(calls, 7);
});

test('invalid choice/probability and CoT decisions are refused rather than applied or cached', async (t) => {
  const variants = [decisions(), decisions(), decisions(), decisions(), decisions()];
  variants[0].decisions[0].probs = [0.1, 0.1];
  variants[1].decisions[0].answer = 'unrecognized';
  variants[2].decisions[0].probs = { food: 0.05, cafe: -0.85, event: 0.05, other: 0.05 };
  variants[3].decisions[0].route = 'cot';
  variants[4].decisions[0].index = 0;
  const api = await fixture(t, { fetchImpl: mockFetch(() => json(variants.shift() || decisions())) });
  for (let index = 0; index < 5; index++) {
    const response = await api.post(evidence);
    assert.equal(response.status, 502);
    if (index === 3) assert.equal((await response.json()).error.code, 'analysis_budget');
  }
  assert.equal((await (await api.post(evidence)).json()).cached, false);
});

test('cache holds at most 100 recent decisions and evicts its oldest result', async () => {
  let calls = 0;
  const gateway = createAnyJevGateway({ config: { baseUrl: 'http://localhost:8000', timeoutMs: 1000 }, fetchImpl: mockFetch(() => { calls++; return json(decisions()); }) });
  for (let index = 0; index < 101; index++) await gateway.analyze({ caption: `카페 리뷰 ${index}` }, `https://www.instagram.com/p/review_${index}/`);
  assert.equal((await gateway.analyze({ caption: '카페 리뷰 100' }, 'https://www.instagram.com/p/review_100/')).cached, true);
  assert.equal((await gateway.analyze({ caption: '카페 리뷰 0' }, 'https://www.instagram.com/p/review_0/')).cached, false);
  assert.equal(calls, 102);
});

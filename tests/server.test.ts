import assert from 'node:assert/strict';
import { once } from 'node:events';
import { request } from 'node:http';
import test from 'node:test';
import type { TestContext } from 'node:test';
import type { AddressInfo } from 'node:net';
import { configFromEnv, createApiServer, instagramUrl, youtubePlaylistId, youtubeVideoId } from '../server/api.ts';
import type { ApiConfig } from '../server/api.ts';

const appOrigin = 'http://localhost:8081';
const videoId = 'dQw4w9WgXcQ';
const listId = 'PL12345678901234567890';
const scope = 'https://www.googleapis.com/auth/youtube.readonly';

function config(extra: Partial<ApiConfig> = {}): ApiConfig {
  return { ...configFromEnv({}), ...extra };
}

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

async function fixture(t: TestContext, options: Parameters<typeof createApiServer>[0] = {}) {
  const server = createApiServer({ config: config(), ...options });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise<void>((resolve) => { server.closeAllConnections(); server.close(() => resolve()); }));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return {
    get: (path: string, cookie?: string, origin?: string) => fetch(base + path, { redirect: 'manual', headers: { ...(cookie ? { Cookie: cookie } : {}), ...(origin ? { Origin: origin } : {}) } }),
    post: (path: string, value: unknown, cookie?: string, origin = appOrigin) => fetch(base + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(value), redirect: 'manual',
    }),
    base,
  };
}

async function startOAuth(api: Awaited<ReturnType<typeof fixture>>) {
  const response = await api.post('/api/youtube/connect', {});
  assert.equal(response.status, 200);
  const cookie = response.headers.get('set-cookie')!.split(';')[0];
  const authorization = new URL((await response.json()).authorizationUrl);
  return { cookie, authorization, callback: `/api/youtube/callback?state=${authorization.searchParams.get('state')}&code=review-code` };
}

test('official link validation never allows arbitrary fetch destinations or special playlists', () => {
  assert.equal(youtubeVideoId(`https://youtu.be/${videoId}?t=20`), videoId);
  assert.equal(youtubeVideoId(`https://www.youtube.com/shorts/${videoId}`), videoId);
  assert.equal(youtubePlaylistId(`https://www.youtube.com/playlist?list=${listId}`), listId);
  assert.equal(instagramUrl('https://instagram.com/reel/abc_123/?igsh=track'), 'https://www.instagram.com/reel/abc_123/');
  for (const url of [`http://youtube.com/watch?v=${videoId}`, `https://youtube.com.evil.test/watch?v=${videoId}`, `https://user@youtube.com/watch?v=${videoId}`, 'https://127.0.0.1/', `https://youtu.be/${videoId}/extra`, `https://youtube.com:999/watch?v=${videoId}`]) assert.throws(() => youtubeVideoId(url));
  for (const id of ['WL', 'LL', 'a', 'PL123/evil']) assert.throws(() => youtubePlaylistId(`https://youtube.com/playlist?list=${id}`));
  for (const url of ['https://instagram.com/user/', 'https://instagram.com/stories/user/123/', 'https://instagram.com.evil.test/p/abc/', 'https://www.instagram.com/p/abc/extra']) assert.throws(() => instagramUrl(url));
  assert.throws(() => configFromEnv({ API_HOST: '0.0.0.0' }));
  assert.throws(() => configFromEnv({ APP_ORIGIN: 'https://evil.test' }));
  assert.throws(() => configFromEnv({ GOOGLE_REDIRECT_URI: 'http://localhost:8787/evil' }));
  assert.throws(() => configFromEnv({ GOOGLE_REDIRECT_URI: 'http://127.0.0.1:8787/api/youtube/callback' }));
});

test('status distinguishes credentials from a connected account and rejects untrusted origins', async (t) => {
  const api = await fixture(t, { config: config({ googleClientId: 'client-id', googleClientSecret: 'server-secret', naverClientId: 'naver-id', naverClientSecret: 'naver-secret' }) });
  const response = await api.get('/api/status', undefined, appOrigin);
  const data = await response.json();
  assert.equal(data.youtube.oauthConfigured, true);
  assert.equal(data.youtube.connected, false);
  assert.equal(data.youtube.playlistConfigured, false);
  assert.equal(data.naver.searchConfigured, true);
  assert.equal(data.instagram.metadata, false);
  assert.equal(data.instagram.embed, true);
  assert.equal(JSON.stringify(data).includes('server-secret'), false);
  assert.equal(response.headers.get('access-control-allow-origin'), appOrigin);
  const denied = await api.post('/api/metadata', { url: `https://youtu.be/${videoId}` }, undefined, 'https://evil.test');
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
  assert.equal((await api.get('/api/status', undefined, 'https://evil.test')).status, 403);
  const untrustedHostStatus = await new Promise<number | undefined>((resolve, reject) => {
    const req = request(api.base + '/api/status', { headers: { Host: 'evil.test' } }, (res) => { res.resume(); resolve(res.statusCode); });
    req.on('error', reject);
    req.end();
  });
  assert.equal(untrustedHostStatus, 403);
});

test('YouTube title fetch uses a canonical video only and Instagram metadata remains manual', async (t) => {
  const calls: FetchCall[] = [];
  const api = await fixture(t, { fetchImpl: mockFetch(() => json({ title: '  실제 영상 제목  ', author_name: '영상 채널', html: '<iframe>ignored</iframe>' }), calls) });
  const response = await api.post('/api/metadata', { url: `https://youtu.be/${videoId}?t=20&list=${listId}` });
  assert.equal(response.status, 200);
  assert.deepEqual(Object.keys(await response.json()).sort(), ['authorName', 'fetchedAt', 'provider', 'title']);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url.origin + calls[0].url.pathname, 'https://www.youtube.com/oembed');
  assert.equal(calls[0].url.searchParams.get('url'), `https://www.youtube.com/watch?v=${videoId}`);
  assert.equal(calls[0].init.redirect, 'error');
  assert.ok(calls[0].init.signal);
  assert.equal((await api.post('/api/metadata', { url: 'https://www.instagram.com/p/abc123/' })).status, 400);
  assert.equal((await api.post('/api/metadata', { url: 'https://127.0.0.1/secret' })).status, 400);
  assert.equal(calls.length, 1);
});

test('Instagram official embed forwards display HTML without extracting title or sending credentials', async (t) => {
  const calls: FetchCall[] = [];
  const api = await fixture(t, { fetchImpl: mockFetch(() => json({ html: '<blockquote class="instagram-media">Public embed</blockquote>', author_name: 'must-not-extract', title: 'must-not-extract' }), calls) });
  const response = await api.post('/api/instagram/embed', { url: 'https://www.instagram.com/p/abc123/?igsh=tracking' });
  const data = await response.json();
  assert.equal(data.provider, 'instagram');
  assert.equal(typeof data.html, 'string');
  assert.equal(data.title, undefined);
  assert.equal(data.authorName, undefined);
  assert.equal(calls[0].url.origin + calls[0].url.pathname, 'https://graph.facebook.com/v26.0/instagram_oembed');
  assert.equal(calls[0].url.searchParams.get('url'), 'https://www.instagram.com/p/abc123/');
  assert.equal(calls[0].url.searchParams.has('access_token'), false);
});

test('public playlist pages stay bounded, filter inaccessible items and never leak the API key', async (t) => {
  const calls: FetchCall[] = [];
  const api = await fixture(t, { config: config({ youtubeApiKey: 'private-api-key' }), fetchImpl: mockFetch(() => json({ items: [
    { id: 'item1', snippet: { title: '저장한 영상', resourceId: { videoId }, videoOwnerChannelTitle: '채널' } },
    { id: 'item2', snippet: { title: 'Private video', resourceId: { videoId: 'aaaaaaaaaaa' } } },
    { id: 'item3', snippet: { title: 'Invalid id', resourceId: { videoId: `${videoId}extra` } } },
  ], nextPageToken: 'CAUQAA' }), calls) });
  const response = await api.get(`/api/youtube/playlist?url=${encodeURIComponent(`https://youtube.com/playlist?list=${listId}`)}&pageToken=CAQQAA`);
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.items.length, 1);
  assert.equal(data.items[0].url, `https://www.youtube.com/watch?v=${videoId}`);
  assert.equal(data.nextPageToken, 'CAUQAA');
  assert.equal(calls[0].url.searchParams.get('maxResults'), '50');
  assert.equal(calls[0].url.searchParams.get('pageToken'), 'CAQQAA');
  assert.equal(JSON.stringify(data).includes('private-api-key'), false);
  assert.equal((await api.get(`/api/youtube/playlist?url=${encodeURIComponent(`https://youtube.com/playlist?list=${listId}`)}&pageToken=bad%20token`)).status, 400);
  assert.equal(calls.length, 1);
});

test('unconfigured services and quota/upstream errors give actionable sanitized errors', async (t) => {
  const api = await fixture(t, { fetchImpl: mockFetch(() => { throw new Error('sensitive-upstream-details'); }) });
  assert.equal((await api.get(`/api/youtube/playlist?url=${encodeURIComponent(`https://youtube.com/playlist?list=${listId}`)}`)).status, 503);
  assert.equal((await api.get('/api/naver/search?q=성수카페')).status, 503);
  assert.equal((await api.post('/api/youtube/connect', {})).status, 503);
  assert.equal((await api.get('/api/youtube/playlists')).status, 401);
  const unavailable = await api.post('/api/metadata', { url: `https://youtu.be/${videoId}` });
  assert.equal(unavailable.status, 502);
  assert.equal((await unavailable.text()).includes('sensitive'), false);
  const quotaApi = await fixture(t, { config: config({ youtubeApiKey: 'key' }), fetchImpl: mockFetch(() => json({ error: { errors: [{ reason: 'quotaExceeded' }], message: 'secret=private' } }, 403)) });
  const limited = await quotaApi.get(`/api/youtube/playlist?url=${encodeURIComponent(`https://youtube.com/playlist?list=${listId}`)}`);
  assert.equal(limited.status, 429);
  assert.equal((await limited.text()).includes('secret'), false);
});

test('Naver results use official WGS84 example coordinates and expose only plain text', async (t) => {
  const calls: FetchCall[] = [];
  const api = await fixture(t, { config: config({ naverClientId: 'naver-id', naverClientSecret: 'private-naver-secret' }), fetchImpl: mockFetch(() => json({ items: [
    { title: '<b>서울</b>시청 &amp; 주변', category: '공공&gt;기관', address: '서울', roadAddress: '세종대로', link: 'https://www.seoul.go.kr/', mapx: '1269873882', mapy: '375666103' },
    { title: '잘못된 좌표', mapx: '311277', mapy: '552097', link: 'javascript:alert(1)' },
  ] }), calls) });
  const response = await api.get('/api/naver/search?q=서울시청');
  const data = await response.json();
  assert.equal(data.items[0].title, '서울시청 & 주변');
  assert.equal(data.items[0].category, '공공>기관');
  assert.equal(data.items[0].longitude, 126.9873882);
  assert.equal(data.items[0].latitude, 37.5666103);
  assert.equal(data.items[1].latitude, undefined);
  assert.equal(data.items[1].url, '');
  assert.equal(calls[0].url.origin + calls[0].url.pathname, 'https://openapi.naver.com/v1/search/local.json');
  assert.equal(calls[0].url.searchParams.get('display'), '5');
  assert.equal(calls[0].url.searchParams.get('start'), '1');
  assert.equal((calls[0].init.headers as Record<string, string>)['X-Naver-Client-Secret'], 'private-naver-secret');
  assert.equal(JSON.stringify(data).includes('private-naver-secret'), false);
});

test('OAuth state is tied to a HttpOnly cookie, uses PKCE and is single use', async (t) => {
  const calls: FetchCall[] = [];
  const api = await fixture(t, { config: config({ googleClientId: 'oauth-client', googleClientSecret: 'private-oauth-secret' }), fetchImpl: mockFetch(({ url }) => url.pathname === '/token' ? json({ access_token: 'private-access-token', refresh_token: 'private-refresh-token', expires_in: 3600, token_type: 'Bearer', scope }) : json({ items: [{ id: listId, snippet: { title: '나의 맛집' }, contentDetails: { itemCount: 3 } }] }), calls) });
  const flow = await startOAuth(api);
  assert.equal(flow.authorization.origin, 'https://accounts.google.com');
  assert.equal(flow.authorization.searchParams.get('scope'), scope);
  assert.equal(flow.authorization.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(flow.authorization.searchParams.get('redirect_uri'), 'http://localhost:8787/api/youtube/callback');
  assert.equal(flow.authorization.href.includes('private-oauth-secret'), false);
  assert.equal((await api.get(flow.callback)).status, 400);
  assert.equal((await api.get(flow.callback, 'moa_api_session=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')).status, 400);
  assert.equal((await api.get('/api/youtube/callback?state=' + '한'.repeat(43) + '&code=code', flow.cookie)).status, 400);
  assert.equal(calls.length, 0);
  const complete = await api.get(flow.callback, flow.cookie);
  assert.equal(complete.status, 302);
  assert.equal(complete.headers.get('location'), appOrigin + '/integrations?youtube=connected');
  assert.equal((await api.get(flow.callback, flow.cookie)).status, 400);
  assert.equal(calls.length, 1);
  const tokenBody = calls[0].init.body as URLSearchParams;
  assert.equal(tokenBody.get('client_secret'), 'private-oauth-secret');
  assert.ok(tokenBody.get('code_verifier'));
  const status = await (await api.get('/api/status', flow.cookie)).json();
  assert.equal(status.youtube.connected, true);
  assert.match(status.youtube.connectionId, /^[0-9a-f-]{36}$/);
  assert.equal(JSON.stringify(status).includes('private-'), false);
  const lists = await (await api.get('/api/youtube/playlists', flow.cookie)).json();
  assert.equal(lists.items[0].title, '나의 맛집');
  assert.equal(calls[1].url.searchParams.get('mine'), 'true');
  assert.equal((calls[1].init.headers as Record<string, string>).Authorization, 'Bearer private-access-token');
});

test('expired OAuth state and canceled authorization cannot create a connected session', async (t) => {
  let clock = Date.now();
  const calls: FetchCall[] = [];
  const api = await fixture(t, { now: () => clock, config: config({ googleClientId: 'client', googleClientSecret: 'secret' }), fetchImpl: mockFetch(() => json({}), calls) });
  const expired = await startOAuth(api);
  clock += 10 * 60_000 + 1;
  assert.equal((await api.get(expired.callback, expired.cookie)).status, 400);
  const canceled = await startOAuth(api);
  const response = await api.get(`/api/youtube/callback?state=${canceled.authorization.searchParams.get('state')}&error=access_denied&redirect=https://evil.test`, canceled.cookie);
  assert.equal(response.headers.get('location'), appOrigin + '/integrations?youtube=error');
  assert.equal((await (await api.get('/api/status', canceled.cookie)).json()).youtube.connected, false);
  assert.equal(calls.length, 0);
});

test('OAuth refresh and remote revocation never expose tokens and revoke failures remain retryable', async (t) => {
  let clock = Date.now();
  let revokeFailure = true;
  const calls: FetchCall[] = [];
  const api = await fixture(t, { now: () => clock, config: config({ googleClientId: 'client', googleClientSecret: 'secret' }), fetchImpl: mockFetch(({ url, init }) => {
    if (url.pathname === '/token') return json({ access_token: (init.body as URLSearchParams).get('grant_type') === 'refresh_token' ? 'fresh-token' : 'first-token', refresh_token: 'refresh-token', expires_in: 60, token_type: 'Bearer', scope });
    if (url.pathname === '/revoke') return new Response('', { status: revokeFailure ? 503 : 200 });
    return json({ items: [{ id: 'saved-item', snippet: { title: '저장 영상', resourceId: { videoId } } }] });
  }, calls) });
  const flow = await startOAuth(api);
  await api.get(flow.callback, flow.cookie);
  clock += 61_000;
  const items = await api.get(`/api/youtube/items?playlistId=${listId}`, flow.cookie);
  assert.equal(items.status, 200);
  assert.equal(calls[1].url.href, 'https://oauth2.googleapis.com/token');
  assert.equal((calls[1].init.body as URLSearchParams).get('grant_type'), 'refresh_token');
  assert.equal((calls[2].init.headers as Record<string, string>).Authorization, 'Bearer fresh-token');
  assert.equal((await api.post('/api/youtube/disconnect', {}, flow.cookie)).status, 502);
  assert.equal((await (await api.get('/api/status', flow.cookie)).json()).youtube.connected, true);
  revokeFailure = false;
  const disconnected = await api.post('/api/youtube/disconnect', {}, flow.cookie);
  assert.equal(disconnected.status, 200);
  assert.match(disconnected.headers.get('set-cookie')!, /Max-Age=0/);
  assert.equal((await (await api.get('/api/status', flow.cookie)).json()).youtube.connected, false);
  assert.equal((await api.get('/api/youtube/playlists', flow.cookie)).status, 401);
});

test('bounded request bodies and per-minute requests reject overload', async (t) => {
  const api = await fixture(t, { rateLimit: 2 });
  assert.equal((await api.post('/api/metadata', { url: 'x'.repeat(9000) })).status, 413);
  assert.equal((await api.get('/api/status')).status, 200);
  assert.equal((await api.get('/api/status')).status, 429);
});

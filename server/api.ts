import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';

const SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';
const COOKIE = 'moa_api_session';
const STATE_TTL = 10 * 60_000;
const SESSION_TTL = 8 * 60 * 60_000;
const MAX_SESSIONS = 100;
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const PLAYLIST_ID = /^[A-Za-z0-9_-]{10,100}$/;
const PAGE_TOKEN = /^[A-Za-z0-9_=-]{1,512}$/;

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export type ApiConfig = {
  host: string;
  port: number;
  appOrigin: string;
  callbackUrl: string;
  googleClientId: string;
  googleClientSecret: string;
  youtubeApiKey: string;
  naverClientId: string;
  naverClientSecret: string;
};

function loopbackUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(url.hostname) || url.username || url.password) {
    throw new Error('API 설정에는 localhost 또는 127.0.0.1의 HTTP 주소만 사용할 수 있습니다.');
  }
  return url;
}

export function configFromEnv(env: Record<string, string | undefined>): ApiConfig {
  const host = env.API_HOST || '127.0.0.1';
  if (!['127.0.0.1', 'localhost'].includes(host)) throw new Error('API_HOST는 로컬 loopback 주소만 허용합니다.');
  const port = Number(env.API_PORT || 8787);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('API_PORT가 올바르지 않습니다.');
  const app = loopbackUrl(env.APP_ORIGIN || 'http://localhost:8081');
  if (app.pathname !== '/' || app.search || app.hash) throw new Error('APP_ORIGIN은 경로 없는 origin이어야 합니다.');
  const callback = loopbackUrl(env.GOOGLE_REDIRECT_URI || `http://localhost:${port}/api/youtube/callback`);
  if (callback.hostname !== app.hostname || callback.port !== String(port) || callback.pathname !== '/api/youtube/callback' || callback.search || callback.hash) {
    throw new Error('Google callback은 앱과 같은 localhost 호스트, API_PORT, /api/youtube/callback 경로를 사용해야 합니다.');
  }
  return {
    host, port, appOrigin: app.origin, callbackUrl: callback.href,
    googleClientId: env.GOOGLE_CLIENT_ID?.trim() || '',
    googleClientSecret: env.GOOGLE_CLIENT_SECRET?.trim() || '',
    youtubeApiKey: env.YOUTUBE_API_KEY?.trim() || '',
    naverClientId: env.NAVER_CLIENT_ID?.trim() || '',
    naverClientSecret: env.NAVER_CLIENT_SECRET?.trim() || '',
  };
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown, max = 500): string {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

function cleanText(value: unknown, max = 500): string {
  return text(value, max * 2).replace(/<[^>]*>/g, '').replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (entity, name: string) => {
    const names: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
    if (name[0] !== '#') return names[name.toLowerCase()] || entity;
    const point = name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : Number(name.slice(1));
    return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : '';
  }).slice(0, max).trim();
}

function validateHttpsUrl(value: unknown): URL {
  if (typeof value !== 'string' || value.length > 2048 || /\s/.test(value)) throw new ApiError(400, 'invalid_url', '올바른 HTTPS 링크를 입력해 주세요.');
  let url: URL;
  try { url = new URL(value); } catch { throw new ApiError(400, 'invalid_url', '올바른 HTTPS 링크를 입력해 주세요.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) throw new ApiError(400, 'invalid_url', '올바른 HTTPS 링크를 입력해 주세요.');
  return url;
}

function youtubeUrl(value: unknown): URL {
  const url = validateHttpsUrl(value);
  if (!['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname)) throw new ApiError(400, 'unsupported', '유튜브 공식 링크를 입력해 주세요.');
  return url;
}

export function youtubeVideoId(value: unknown): string {
  const url = youtubeUrl(value);
  let id = '';
  if (url.hostname === 'youtu.be') id = url.pathname.slice(1);
  else if (url.pathname === '/watch') id = url.searchParams.get('v') || '';
  else if (/^\/(shorts|embed|live)\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)) id = url.pathname.split('/')[2];
  if (!VIDEO_ID.test(id)) throw new ApiError(400, 'invalid_url', '유튜브 영상 링크를 입력해 주세요.');
  return id;
}

function playlistId(value: unknown): string {
  if (value === 'WL' || value === 'LL') throw new ApiError(400, 'unsupported', '나중에 볼 동영상과 좋아요 목록은 이 재생목록 가져오기에서 지원하지 않아요. 직접 만든 재생목록을 선택해 주세요.');
  if (typeof value !== 'string' || !PLAYLIST_ID.test(value)) throw new ApiError(400, 'invalid_playlist', '올바른 재생목록을 선택해 주세요.');
  return value;
}

export function youtubePlaylistId(value: unknown): string {
  const url = youtubeUrl(value);
  if (!['/playlist', '/watch'].includes(url.pathname) && url.hostname !== 'youtu.be') throw new ApiError(400, 'invalid_url', '유튜브 재생목록 링크를 입력해 주세요.');
  return playlistId(url.searchParams.get('list'));
}

export function instagramUrl(value: unknown): string {
  const url = validateHttpsUrl(value);
  if (!['instagram.com', 'www.instagram.com'].includes(url.hostname) || !/^\/(p|reel)\/[A-Za-z0-9_-]{1,100}\/?$/.test(url.pathname)) {
    throw new ApiError(400, 'invalid_url', '공개 인스타그램 게시물 또는 릴스 링크를 입력해 주세요.');
  }
  return `https://www.instagram.com${url.pathname.replace(/\/?$/, '/')}`;
}

function pageToken(url: URL): string | undefined {
  const value = url.searchParams.get('pageToken');
  if (value === null) return undefined;
  if (!PAGE_TOKEN.test(value)) throw new ApiError(400, 'invalid_page', '다음 페이지 정보가 올바르지 않아요. 처음부터 다시 불러와 주세요.');
  return value;
}

function safeLink(value: unknown): string {
  try {
    const url = validateHttpsUrl(value);
    return url.href;
  } catch { return ''; }
}

type Tokens = { accessToken: string; refreshToken?: string; expiresAt: number };
type Session = { expiresAt: number; connectionId?: string; state?: string; stateExpiresAt?: number; verifier?: string; tokens?: Tokens; refreshing?: Promise<Tokens> };
type ApiOptions = { config?: ApiConfig; fetchImpl?: typeof fetch; now?: () => number; fetchTimeoutMs?: number; rateLimit?: number };

export function createApiServer(options: ApiOptions = {}) {
  const config = options.config || configFromEnv(process.env);
  const fetchImpl = options.fetchImpl || fetch;
  const now = options.now || Date.now;
  const sessions = new Map<string, Session>();
  const rates = new Map<string, { count: number; expiresAt: number }>();
  const oauthConfigured = Boolean(config.googleClientId && config.googleClientSecret);

  function setup(ready: boolean, message: string) {
    if (!ready) throw new ApiError(503, 'setup_required', message);
  }

  async function upstream(url: URL | string, init: RequestInit = {}): Promise<Response> {
    try {
      return await fetchImpl(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(options.fetchTimeoutMs || 8000) });
    } catch {
      throw new ApiError(502, 'upstream_unavailable', '연결한 서비스에서 응답하지 않아요. 잠시 후 다시 시도해 주세요.');
    }
  }

  async function jsonResponse(response: Response): Promise<Record<string, unknown>> {
    if (Number(response.headers.get('content-length')) > 1_000_000) throw new ApiError(502, 'upstream_invalid', '서비스 응답을 읽을 수 없어요.');
    let size = 0;
    const chunks: Uint8Array[] = [];
    if (!response.body) throw new ApiError(502, 'upstream_invalid', '서비스 응답을 읽을 수 없어요.');
    try {
      for await (const chunk of response.body) {
        size += chunk.length;
        if (size > 1_000_000) throw new ApiError(502, 'upstream_invalid', '서비스 응답이 너무 커요.');
        chunks.push(chunk);
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(502, 'upstream_unavailable', '서비스 응답을 읽는 중 연결이 끊겼어요. 다시 시도해 주세요.');
    }
    let value: unknown;
    try { value = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new ApiError(502, 'upstream_invalid', '서비스 응답을 읽을 수 없어요.'); }
    if (!record(value)) throw new ApiError(502, 'upstream_invalid', '서비스 응답을 읽을 수 없어요.');
    return value;
  }

  async function upstreamData(url: URL | string, init: RequestInit = {}): Promise<Record<string, unknown>> {
    const response = await upstream(url, init);
    if (!response.ok) {
      if (response.status === 429) throw new ApiError(429, 'limited', '서비스 요청 한도에 도달했어요. 잠시 후 다시 시도해 주세요.');
      if (response.status === 404) throw new ApiError(404, 'not_found', '공개되어 있거나 접근할 수 있는 콘텐츠인지 확인해 주세요.');
      throw new ApiError(502, 'upstream_unavailable', '서비스에서 콘텐츠를 불러오지 못했어요. 연결 설정과 공개 여부를 확인해 주세요.');
    }
    return jsonResponse(response);
  }

  function expireSessions() {
    for (const [id, session] of sessions) if (session.expiresAt <= now()) sessions.delete(id);
  }

  function getSession(req: IncomingMessage): { id: string; session: Session } | undefined {
    expireSessions();
    const id = (req.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
    if (!id || !/^[A-Za-z0-9_-]{43}$/.test(id)) return undefined;
    const session = sessions.get(id);
    return session ? { id, session } : undefined;
  }

  function setCookie(res: ServerResponse, id: string) {
    res.setHeader('Set-Cookie', `${COOKIE}=${id}; HttpOnly; SameSite=Lax; Path=/api; Max-Age=${SESSION_TTL / 1000}`);
  }

  function clearCookie(res: ServerResponse) {
    res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/api; Max-Age=0`);
  }

  function requireSession(req: IncomingMessage): { id: string; session: Session } {
    const result = getSession(req);
    if (!result?.session.tokens) throw new ApiError(401, 'auth_required', '유튜브 계정을 먼저 연결해 주세요.');
    return result;
  }

  function parseTokens(value: Record<string, unknown>, existingRefresh?: string): Tokens {
    if (typeof value.access_token !== 'string' || value.access_token.length > 8192 || !value.access_token || value.token_type !== 'Bearer' ||
      typeof value.expires_in !== 'number' || value.expires_in < 1 || value.expires_in > 86400 ||
      (typeof value.scope === 'string' && !value.scope.split(' ').includes(SCOPE))) {
      throw new ApiError(401, 'auth_required', '유튜브 읽기 권한을 확인하고 다시 연결해 주세요.');
    }
    return { accessToken: value.access_token, refreshToken: text(value.refresh_token, 8192) || existingRefresh, expiresAt: now() + value.expires_in * 1000 };
  }

  async function accessToken(id: string, session: Session): Promise<string> {
    if (session.tokens && session.tokens.expiresAt > now() + 30_000) return session.tokens.accessToken;
    if (!session.tokens?.refreshToken) {
      sessions.delete(id);
      throw new ApiError(401, 'auth_required', '유튜브 연결이 만료됐어요. 다시 연결해 주세요.');
    }
    if (!session.refreshing) {
      const refreshToken = session.tokens.refreshToken;
      session.refreshing = (async () => {
        const response = await upstream('https://oauth2.googleapis.com/token', {
          method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ client_id: config.googleClientId, client_secret: config.googleClientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }),
        });
        if (!response.ok) {
          if (response.status === 400 || response.status === 401) {
            sessions.delete(id);
            throw new ApiError(401, 'auth_required', '유튜브 연결이 해제됐어요. 다시 연결해 주세요.');
          }
          throw new ApiError(502, 'upstream_unavailable', '유튜브 연결 갱신을 잠시 후 다시 시도해 주세요.');
        }
        let tokens: Tokens;
        try { tokens = parseTokens(await jsonResponse(response), refreshToken); } catch (error) {
          if (error instanceof ApiError && error.code === 'auth_required') sessions.delete(id);
          throw error;
        }
        session.tokens = tokens;
        return tokens;
      })();
    }
    try { return (await session.refreshing).accessToken; } finally { session.refreshing = undefined; }
  }

  async function youtubeData(req: IncomingMessage, url: URL, privateAccess: boolean) {
    const init: RequestInit = {};
    let connected: { id: string; session: Session } | undefined;
    if (privateAccess) {
      connected = requireSession(req);
      init.headers = { Authorization: `Bearer ${await accessToken(connected.id, connected.session)}` };
    } else {
      setup(Boolean(config.youtubeApiKey), '공개 재생목록을 가져오려면 서버에 YouTube API 키를 설정해 주세요.');
      url.searchParams.set('key', config.youtubeApiKey);
    }
    const response = await upstream(url, init);
    if (response.status === 401 && connected) {
      sessions.delete(connected.id);
      throw new ApiError(401, 'auth_required', '유튜브 계정 연결이 해제됐어요. 다시 연결해 주세요.');
    }
    if (!response.ok) {
      let reason = '';
      try {
        const value = await jsonResponse(response);
        if (record(value.error) && Array.isArray(value.error.errors) && record(value.error.errors[0])) reason = text(value.error.errors[0].reason);
      } catch { /* Only inspect bounded official error reasons; never return provider bodies. */ }
      if (['quotaExceeded', 'dailyLimitExceeded', 'rateLimitExceeded', 'userRateLimitExceeded'].includes(reason) || response.status === 429) throw new ApiError(429, 'limited', '유튜브 요청 한도에 도달했어요. 잠시 후 다시 시도해 주세요.');
      if (['watchLaterNotAccessible', 'watchHistoryNotAccessible', 'playlistOperationUnsupported'].includes(reason)) throw new ApiError(400, 'unsupported', '유튜브에서 이 목록의 가져오기를 지원하지 않아요. 직접 만든 재생목록을 사용해 주세요.');
      if (response.status === 403) throw new ApiError(403, 'access_denied', '재생목록 접근 권한 또는 API 설정을 확인해 주세요.');
      if (response.status === 404) throw new ApiError(404, 'not_found', '재생목록을 찾지 못했어요. 공개 여부와 링크를 확인해 주세요.');
      throw new ApiError(502, 'upstream_unavailable', '유튜브에서 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
    return jsonResponse(response);
  }

  async function body(req: IncomingMessage): Promise<Record<string, unknown>> {
    if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') throw new ApiError(415, 'invalid_body', 'JSON 형식으로 요청해 주세요.');
    if (Number(req.headers['content-length']) > 8192) throw new ApiError(413, 'invalid_body', '요청이 너무 커요.');
    let size = 0;
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      size += Buffer.byteLength(chunk);
      if (size > 8192) throw new ApiError(413, 'invalid_body', '요청이 너무 커요.');
      chunks.push(Buffer.from(chunk));
    }
    let value: unknown;
    try { value = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new ApiError(400, 'invalid_body', '요청 내용을 확인해 주세요.'); }
    if (!record(value)) throw new ApiError(400, 'invalid_body', '요청 내용을 확인해 주세요.');
    return value;
  }

  function send(res: ServerResponse, value: unknown, status = 200) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(value));
  }

  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Vary', 'Origin');
    try {
      const requestHost = new URL(`http://${req.headers.host || ''}`);
      if (!['localhost', '127.0.0.1'].includes(requestHost.hostname) || requestHost.username || requestHost.password) throw new ApiError(403, 'origin_denied', '허용되지 않은 서버 주소예요.');
      const origin = req.headers.origin;
      if (origin && origin !== config.appOrigin) throw new ApiError(403, 'origin_denied', '허용되지 않은 앱 주소예요.');
      if (origin === config.appOrigin) {
        res.setHeader('Access-Control-Allow-Origin', config.appOrigin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
      if (req.method === 'OPTIONS') {
        if (origin !== config.appOrigin || !['GET', 'POST'].includes(req.headers['access-control-request-method'] || '') ||
          (req.headers['access-control-request-headers'] || '').split(',').some((header) => header.trim() && header.trim().toLowerCase() !== 'content-type')) {
          throw new ApiError(403, 'origin_denied', '허용되지 않은 요청이에요.');
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.statusCode = 204;
        res.end();
        return;
      }
      if (req.method === 'POST' && origin !== config.appOrigin) throw new ApiError(403, 'origin_denied', '앱에서 다시 요청해 주세요.');
      const rateKey = req.socket.remoteAddress || 'local';
      for (const [key, rate] of rates) if (rate.expiresAt <= now()) rates.delete(key);
      const rate = rates.get(rateKey) || { count: 0, expiresAt: now() + 60_000 };
      rate.count += 1;
      rates.set(rateKey, rate);
      if (rate.count > (options.rateLimit || 120)) throw new ApiError(429, 'limited', '잠시 후 다시 시도해 주세요.');
      const url = new URL(req.url || '/', config.callbackUrl);
      const fetchedAt = new Date(now()).toISOString();

      if (req.method === 'GET' && url.pathname === '/api/status') {
        const session = getSession(req)?.session;
        const connected = Boolean(session?.tokens && (session.tokens.expiresAt > now() || session.tokens.refreshToken));
        send(res, {
          youtube: { metadata: true, oauthConfigured, connected, ...(connected && session?.connectionId ? { connectionId: session.connectionId } : {}), playlistConfigured: Boolean(config.youtubeApiKey) },
          instagram: { embed: true, metadata: false, savedImport: false },
          naver: { searchConfigured: Boolean(config.naverClientId && config.naverClientSecret), savedImport: false },
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/metadata') {
        const input = await body(req);
        const parsed = validateHttpsUrl(input.url);
        if (['instagram.com', 'www.instagram.com'].includes(parsed.hostname)) throw new ApiError(400, 'unsupported', '인스타그램은 공개 게시물 미리보기만 지원해요. 제목과 장소는 직접 입력해 주세요.');
        const id = youtubeVideoId(input.url);
        const target = new URL('https://www.youtube.com/oembed');
        target.search = new URLSearchParams({ url: `https://www.youtube.com/watch?v=${id}`, format: 'json' }).toString();
        const data = await upstreamData(target);
        const title = cleanText(data.title, 120);
        if (!title) throw new ApiError(502, 'upstream_invalid', '영상 제목을 불러오지 못했어요. 직접 입력해 주세요.');
        send(res, { title, authorName: cleanText(data.author_name, 120), provider: 'youtube', fetchedAt });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/instagram/embed') {
        const input = await body(req);
        const target = new URL('https://graph.facebook.com/v26.0/instagram_oembed');
        target.search = new URLSearchParams({ url: instagramUrl(input.url), omitscript: 'true' }).toString();
        const data = await upstreamData(target);
        if (typeof data.html !== 'string' || !data.html || data.html.length > 250_000) throw new ApiError(502, 'upstream_invalid', '공개 게시물 미리보기를 불러오지 못했어요. 원본 링크를 열어 주세요.');
        // Official oEmbed HTML is forwarded for immediate display only. Never parse metadata or persist it.
        send(res, { html: data.html, provider: 'instagram', fetchedAt });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/youtube/connect') {
        await body(req);
        setup(oauthConfigured, '유튜브 계정을 연결하려면 서버에 Google OAuth 설정이 필요해요.');
        expireSessions();
        const existing = getSession(req);
        const id = existing?.id || randomBytes(32).toString('base64url');
        if (!existing && sessions.size >= MAX_SESSIONS) throw new ApiError(429, 'limited', '연결 요청이 많아요. 잠시 후 다시 시도해 주세요.');
        const session = existing?.session || { expiresAt: now() + SESSION_TTL };
        session.expiresAt = now() + SESSION_TTL;
        const state = randomBytes(32).toString('base64url');
        const verifier = randomBytes(32).toString('base64url');
        session.state = state;
        session.stateExpiresAt = now() + STATE_TTL;
        session.verifier = verifier;
        sessions.set(id, session);
        setCookie(res, id);
        const authorization = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authorization.search = new URLSearchParams({ client_id: config.googleClientId, redirect_uri: config.callbackUrl, response_type: 'code', scope: SCOPE, state, access_type: 'offline', prompt: 'consent', code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256' }).toString();
        send(res, { authorizationUrl: authorization.href });
        return;
      }

      if (req.method === 'GET' && url.pathname === '/api/youtube/callback') {
        const connected = getSession(req);
        const returnedState = url.searchParams.get('state') || '';
        const state = connected?.session.state || '';
        if (!connected || !state || connected.session.stateExpiresAt! <= now() || !/^[A-Za-z0-9_-]{43}$/.test(returnedState) || returnedState.length !== state.length ||
          !timingSafeEqual(Buffer.from(returnedState), Buffer.from(state))) throw new ApiError(400, 'invalid_state', '계정 연결 요청이 만료되었거나 올바르지 않아요. 앱에서 다시 연결해 주세요.');
        const verifier = connected.session.verifier!;
        delete connected.session.state;
        delete connected.session.stateExpiresAt;
        delete connected.session.verifier;
        const redirect = new URL('/integrations', config.appOrigin);
        redirect.searchParams.set('youtube', 'error');
        try {
          const code = url.searchParams.get('code');
          if (url.searchParams.has('error') || !code || code.length > 4096) throw new ApiError(401, 'auth_required', '연결이 취소되었어요.');
          const data = await upstreamData('https://oauth2.googleapis.com/token', {
            method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ client_id: config.googleClientId, client_secret: config.googleClientSecret, code, code_verifier: verifier, redirect_uri: config.callbackUrl, grant_type: 'authorization_code' }),
          });
          connected.session.tokens = parseTokens(data);
          connected.session.connectionId = randomUUID();
          redirect.searchParams.set('youtube', 'connected');
        } catch {
          if (!connected.session.tokens) {
            sessions.delete(connected.id);
            clearCookie(res);
          }
        }
        res.statusCode = 302;
        res.setHeader('Location', redirect.href);
        res.end();
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/youtube/disconnect') {
        await body(req);
        const connected = getSession(req);
        const token = connected?.session.tokens?.refreshToken || connected?.session.tokens?.accessToken;
        // Keep tokens in memory if remote revocation fails, so the user can retry it.
        if (token) {
          const response = await upstream('https://oauth2.googleapis.com/revoke', {
            method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ token }),
          });
          if (!response.ok && response.status !== 400) throw new ApiError(502, 'revoke_failed', 'Google 연결 해제가 완료되지 않았어요. 다시 시도하거나 Google 계정에서 권한을 해제해 주세요.');
        }
        if (connected) sessions.delete(connected.id);
        clearCookie(res);
        send(res, { disconnected: true });
        return;
      }

      if (req.method === 'GET' && ['/api/youtube/playlist', '/api/youtube/items', '/api/youtube/playlists'].includes(url.pathname)) {
        const ownLists = url.pathname === '/api/youtube/playlists';
        const isPrivate = url.pathname !== '/api/youtube/playlist';
        const id = ownLists ? undefined : (isPrivate ? playlistId(url.searchParams.get('playlistId')) : youtubePlaylistId(url.searchParams.get('url')));
        const target = new URL(`https://www.googleapis.com/youtube/v3/${ownLists ? 'playlists' : 'playlistItems'}`);
        target.searchParams.set('part', ownLists ? 'snippet,contentDetails' : 'snippet');
        target.searchParams.set('maxResults', '50');
        if (ownLists) target.searchParams.set('mine', 'true');
        else target.searchParams.set('playlistId', id!);
        const next = pageToken(url);
        if (next) target.searchParams.set('pageToken', next);
        const data = await youtubeData(req, target, isPrivate);
        if (!Array.isArray(data.items)) throw new ApiError(502, 'upstream_invalid', '재생목록 응답을 읽을 수 없어요.');
        const items = data.items.slice(0, 50).flatMap<Record<string, unknown>>((item: unknown) => {
          if (!record(item) || !record(item.snippet)) return [];
          if (ownLists) {
            const itemId = text(item.id, 500);
            if (!PLAYLIST_ID.test(itemId)) return [];
            return [{ id: itemId, title: cleanText(item.snippet.title, 120), itemCount: record(item.contentDetails) && typeof item.contentDetails.itemCount === 'number' ? item.contentDetails.itemCount : 0 }];
          }
          const videoId = record(item.snippet.resourceId) ? text(item.snippet.resourceId.videoId, 500) : '';
          if (!VIDEO_ID.test(videoId) || ['Deleted video', 'Private video'].includes(text(item.snippet.title))) return [];
          return [{ id: text(item.id, 150), videoId, title: cleanText(item.snippet.title, 120), url: `https://www.youtube.com/watch?v=${videoId}`, authorName: cleanText(item.snippet.videoOwnerChannelTitle, 120) }];
        });
        const nextPageToken = text(data.nextPageToken, 1024);
        send(res, { items, ...(PAGE_TOKEN.test(nextPageToken) ? { nextPageToken } : {}), provider: 'youtube', fetchedAt });
        return;
      }

      if (req.method === 'GET' && url.pathname === '/api/naver/search') {
        const query = url.searchParams.get('q')?.trim() || '';
        if (query.length < 2 || query.length > 100 || /[\u0000-\u001f\u007f]/.test(query)) throw new ApiError(400, 'invalid_query', '검색할 장소 이름을 2자 이상 입력해 주세요.');
        setup(Boolean(config.naverClientId && config.naverClientSecret), '장소를 검색하려면 서버에 네이버 검색 API 설정이 필요해요.');
        const target = new URL('https://openapi.naver.com/v1/search/local.json');
        target.search = new URLSearchParams({ query, display: '5', start: '1', sort: 'random' }).toString();
        const data = await upstreamData(target, { headers: { 'X-Naver-Client-Id': config.naverClientId, 'X-Naver-Client-Secret': config.naverClientSecret } });
        if (!Array.isArray(data.items)) throw new ApiError(502, 'upstream_invalid', '장소 검색 응답을 읽을 수 없어요.');
        const items = data.items.slice(0, 5).flatMap((item: unknown) => {
          if (!record(item)) return [];
          const mapx = text(String(item.mapx ?? ''), 20);
          const mapy = text(String(item.mapy ?? ''), 20);
          const x = Number(mapx), y = Number(mapy);
          const longitude = x / 10_000_000, latitude = y / 10_000_000;
          const coordinatesValid = /^\d{9,10}$/.test(mapx) && /^\d{8,9}$/.test(mapy) && Number.isSafeInteger(x) && Number.isSafeInteger(y) && longitude >= 124 && longitude <= 132 && latitude >= 33 && latitude <= 39;
          const title = cleanText(item.title, 120);
          if (!title) return [];
          return [{ title, category: cleanText(item.category), address: cleanText(item.address), roadAddress: cleanText(item.roadAddress), url: safeLink(item.link), mapx, mapy, ...(coordinatesValid ? { latitude, longitude } : {}) }];
        });
        send(res, { items, provider: 'naver', fetchedAt });
        return;
      }
      throw new ApiError(404, 'not_found', '요청한 기능을 찾을 수 없어요.');
    } catch (error) {
      const failure = error instanceof ApiError ? error : new ApiError(500, 'internal', '요청을 처리하지 못했어요.');
      if (!res.headersSent) send(res, { error: { code: failure.code, message: failure.message } }, failure.status);
      else res.end();
    }
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  return server;
}

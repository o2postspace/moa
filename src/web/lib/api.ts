import type { ExternalMetadata } from '../../domain/content';

export type IntegrationStatus = {
  youtube: { metadata: boolean; oauthConfigured: boolean; connected: boolean; playlistConfigured: boolean; connectionId?: string };
  instagram: { embed: boolean; savedImport: boolean; metadata: boolean };
  naver: { searchConfigured: boolean; savedImport?: boolean };
};
export type VideoCandidate = { id: string; videoId: string; title: string; url: string; authorName?: string };
export type Playlist = { id: string; title: string; itemCount: number };
export type ApiPage<T> = { items: T[]; nextPageToken?: string; provider: 'youtube'; fetchedAt: string };

export class IntegrationError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'IntegrationError';
    this.status = status;
    this.code = code;
  }
}

// Requests always go through the current web origin's development proxy.
// Provider endpoints and credentials stay in the server adapter.
async function request<T>(path: string, body?: object): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(path, {
      method: body ? 'POST' : 'GET',
      credentials: 'include',
      cache: 'no-store',
      redirect: 'error',
      signal: controller.signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    let payload;
    try { payload = await response.json(); }
    catch { throw new IntegrationError('연동 서버의 응답을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.', response.status, 'invalid_response'); }
    if (!response.ok) {
      const message = typeof payload?.error?.message === 'string' && payload.error.message.length <= 400 && !/[\u0000-\u001f\u007f]/.test(payload.error.message)
        ? payload.error.message : '연동 요청을 완료하지 못했어요.';
      const code = typeof payload?.error?.code === 'string' && /^[a-z_]{1,50}$/.test(payload.error.code)
        ? payload.error.code : 'request_failed';
      throw new IntegrationError(message, response.status, code);
    }
    return payload as T;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('응답이 늦어지고 있어요. 잠시 후 다시 시도해 주세요.');
    if (error instanceof TypeError) throw new Error('연동 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.');
    throw error;
  } finally { clearTimeout(timeout); }
}

export function youtubeAuthorizationUrl(value: string): string {
  let url: URL;
  try { url = new URL(value); }
  catch { throw new Error('Google 연결 주소를 확인하지 못했어요.'); }
  if (url.protocol !== 'https:' || url.hostname !== 'accounts.google.com' || url.port || url.username || url.password || url.pathname !== '/o/oauth2/v2/auth' || url.hash) {
    throw new Error('Google 연결 주소를 확인하지 못했어요.');
  }
  return url.href;
}

export const integrationsApi = {
  status: () => request<IntegrationStatus>('/api/status'),
  metadata: (url: string) => request<ExternalMetadata>('/api/metadata', { url }),
  instagramEmbed: (url: string) => request<{ html: string }>('/api/instagram/embed', { url }),
  connectYouTube: () => request<{ authorizationUrl: string }>('/api/youtube/connect', {}),
  disconnectYouTube: () => request<{ disconnected: boolean }>('/api/youtube/disconnect', {}),
  playlists: (pageToken?: string) => request<ApiPage<Playlist>>('/api/youtube/playlists' + (pageToken ? '?pageToken=' + encodeURIComponent(pageToken) : '')),
  videos: (playlistId: string, pageToken?: string) => request<ApiPage<VideoCandidate>>('/api/youtube/items?playlistId=' + encodeURIComponent(playlistId) + (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '')),
  publicPlaylist: (url: string, pageToken?: string) => request<ApiPage<VideoCandidate>>('/api/youtube/playlist?url=' + encodeURIComponent(url) + (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '')),
};

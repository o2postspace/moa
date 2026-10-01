import type { ExternalMetadata } from '../../domain/content';

export type IntegrationStatus = {
  youtube: { metadata: boolean; oauthConfigured: boolean; connected: boolean; playlistConfigured: boolean; connectionId?: string };
  instagram: { embed: boolean; savedImport: boolean; metadata: boolean };
  naver: { searchConfigured: boolean };
};
export type VideoCandidate = { id: string; videoId: string; title: string; url: string; authorName?: string };
export type Playlist = { id: string; title: string; itemCount: number };
export type ApiPage<T> = { items: T[]; nextPageToken?: string; provider: 'youtube'; fetchedAt: string };
export type PlaceCandidate = { title: string; category: string; address: string; roadAddress: string; url: string; latitude?: number; longitude?: number };

const baseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8787').replace(/\/$/, '');

export class IntegrationError extends Error {
  constructor(message: string, readonly status: number, readonly code: string) { super(message); this.name = 'IntegrationError'; }
}

async function request<T>(path: string, body?: object): Promise<T> {
  const target = new URL(baseUrl);
  if (target.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(target.hostname) || target.username || target.password || target.pathname !== '/' || target.search || target.hash) {
    throw new Error('개발 연동 서버 주소를 확인해 주세요. 현재 localhost 주소만 지원해요.');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(baseUrl + path, {
      method: body ? 'POST' : 'GET', credentials: 'include', signal: controller.signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await response.json();
    if (!response.ok) throw new IntegrationError(typeof payload?.error?.message === 'string' ? payload.error.message : '연동 요청을 완료하지 못했어요.', response.status, typeof payload?.error?.code === 'string' ? payload.error.code : 'request_failed');
    return payload as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('응답이 늦어지고 있어요. 잠시 후 다시 시도해 주세요.');
    if (error instanceof TypeError) throw new Error('연동 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.');
    throw error;
  } finally { clearTimeout(timeout); }
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
  searchPlaces: (query: string) => request<{ items: PlaceCandidate[]; provider: 'naver'; fetchedAt: string }>('/api/naver/search?q=' + encodeURIComponent(query)),
};

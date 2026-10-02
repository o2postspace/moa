export type Category = 'food' | 'cafe' | 'event' | 'other';
export type SourceType = 'instagram' | 'youtube' | 'naver' | 'web';

export interface ExternalMetadata {
  provider: 'youtube';
  title: string;
  authorName?: string;
  fetchedAt: string;
}

export interface ImportOrigin {
  provider: 'youtube' | 'naver';
  method: 'public-playlist' | 'account-playlist' | 'place-search';
  fetchedAt: string;
  connectionId?: string;
}

export interface NaverPlace {
  provider: 'naver';
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  fetchedAt: string;
}

export interface SavedContent {
  id: string;
  title: string;
  url: string;
  source: SourceType;
  category: Category;
  placeName: string;
  note: string;
  visited: boolean;
  createdAt: string;
  titleMode?: 'manual' | 'external';
  external?: ExternalMetadata;
  importedFrom?: ImportOrigin;
  place?: NaverPlace;
}

export interface DraftInput {
  title: string;
  url: string;
  category: Category;
  placeName?: string;
  note?: string;
  titleMode?: 'manual' | 'external';
  external?: ExternalMetadata | null;
  importedFrom?: ImportOrigin;
  place?: NaverPlace | null;
}

export const CATEGORIES: readonly { id: Category; label: string }[] = [
  { id: 'food', label: '맛집' },
  { id: 'cafe', label: '카페' },
  { id: 'event', label: '행사' },
  { id: 'other', label: '기타' },
];

export const SOURCES: readonly { id: SourceType; label: string }[] = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'naver', label: '네이버' },
  { id: 'web', label: '웹' },
];

export class DomainError extends Error {
  readonly code: 'validation' | 'duplicate';
  readonly duplicateId?: string;

  constructor(
    message: string,
    code: 'validation' | 'duplicate',
    duplicateId?: string,
  ) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.duplicateId = duplicateId;
  }
}

const categoryIds = new Set(CATEGORIES.map(({ id }) => id));
const sourceIds = new Set(SOURCES.map(({ id }) => id));
const commonTracking = new Set([
  'fbclid', 'gclid', 'dclid', 'msclkid', 'mc_cid', 'mc_eid', '_ga', '_gl',
]);

function belongsTo(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

function sourceForHostname(hostname: string): SourceType {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  if (belongsTo(host, 'instagram.com')) return 'instagram';
  if (belongsTo(host, 'youtube.com') || host === 'youtu.be') return 'youtube';
  if (belongsTo(host, 'naver.com') || belongsTo(host, 'naver.me')) return 'naver';
  return 'web';
}

/** Uses the actual parsed hostname; names in paths or user info do not count. */
export function detectSource(url: string): SourceType {
  try {
    return sourceForHostname(new URL(normalizeUrl(url)).hostname);
  } catch {
    return 'web';
  }
}

/** Canonicalizes safe shared links without removing content-specific parameters. */
export function normalizeUrl(input: string): string {
  if (typeof input !== 'string' || !input.trim()) {
    throw new DomainError('콘텐츠 링크를 입력해 주세요.', 'validation');
  }

  const trimmed = input.trim();
  let parsed: URL;
  try {
    // An explicit protocol must be https. Relative links are not saved links.
    const hostWithPort = /^[^\s/\\?#:@]+:\d+(?=[/?#]|$)/.test(trimmed);
    if (/^[a-z][a-z\d+.-]*:/i.test(trimmed) && !/^https:\/\//i.test(trimmed) && !hostWithPort) {
      throw new Error('Unsupported protocol');
    }
    if (/^[\/\\]/.test(trimmed)) throw new Error('Relative URL');
    parsed = new URL(/^https:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password) {
      throw new Error('Unsafe URL');
    }
    // Single words such as "hello" are not useful public shared URLs.
    if (!parsed.hostname.includes('.') || /\s/.test(trimmed)) {
      throw new Error('Invalid hostname');
    }
  } catch {
    throw new DomainError('https://로 시작하는 올바른 링크를 입력해 주세요.', 'validation');
  }

  parsed.hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  const source = sourceForHostname(parsed.hostname);
  for (const key of [...parsed.searchParams.keys()]) {
    const lower = key.toLowerCase();
    if (
      lower.startsWith('utm_') || commonTracking.has(lower) ||
      (source === 'instagram' && (lower === 'igshid' || lower === 'igsh')) ||
      (source === 'youtube' && (lower === 'si' || lower === 'feature'))
    ) {
      parsed.searchParams.delete(key);
    }
  }

  if (source === 'youtube') {
    const path = parsed.pathname.split('/').filter(Boolean);
    let videoId: string | null = null;
    if (parsed.hostname === 'youtu.be' && path.length === 1) videoId = path[0];
    else if (belongsTo(parsed.hostname, 'youtube.com')) {
      if (path.length === 1 && path[0] === 'watch') videoId = parsed.searchParams.get('v');
      else if (path.length === 2 && path[0] === 'shorts') videoId = path[1];
    }
    if (videoId && /^[a-z\d_-]+$/i.test(videoId)) {
      parsed.hostname = 'www.youtube.com';
      parsed.pathname = '/watch';
      parsed.searchParams.set('v', videoId);
    }
  }

  parsed.searchParams.sort();
  return parsed.toString();
}

export function validateDraft(draft: DraftInput): Partial<Record<'title' | 'url', string>> {
  const errors: Partial<Record<'title' | 'url', string>> = {};
  if (typeof draft.title !== 'string' || !draft.title.trim()) {
    errors.title = '제목을 입력해 주세요.';
  } else if (draft.title.trim().length > 120) {
    errors.title = '제목은 120자 이내로 적어 주세요.';
  }
  try {
    normalizeUrl(draft.url);
  } catch (error) {
    errors.url = error instanceof Error ? error.message : '링크를 확인해 주세요.';
  }
  return errors;
}

export function createContent(
  draft: DraftInput,
  existing: SavedContent[],
  now: string = new Date().toISOString(),
): SavedContent {
  const errors = validateDraft(draft);
  if (errors.title || errors.url) {
    throw new DomainError(errors.title ?? errors.url ?? '입력 내용을 확인해 주세요.', 'validation');
  }
  if (!categoryIds.has(draft.category)) {
    throw new DomainError('분류를 확인해 주세요.', 'validation');
  }
  if (
    (draft.placeName !== undefined && typeof draft.placeName !== 'string') ||
    (draft.note !== undefined && typeof draft.note !== 'string') ||
    (draft.placeName?.trim().length ?? 0) > 120 ||
    (draft.note?.trim().length ?? 0) > 2000 ||
    !isTimestamp(now)
  ) {
    throw new DomainError('입력 내용을 확인해 주세요.', 'validation');
  }
  const url = normalizeUrl(draft.url);
  const source = detectSource(url);
  const metadata = validateMetadata(draft, source, now);
  if (metadata.importedFrom?.provider === 'naver' || metadata.place) {
    throw new DomainError('네이버 검색 결과는 저장할 수 없어요. 직접 확인한 공유 링크와 제목을 추가해 주세요.', 'validation');
  }
  if (
    (metadata.importedFrom && expired(metadata.importedFrom.fetchedAt, now)) ||
    (metadata.external && expired(metadata.external.fetchedAt, now))
  ) throw new DomainError('확인한 지 30일이 지난 정보예요. 다시 가져와 주세요.', 'validation');
  const duplicate = existing.find((item) => normalizeUrl(item.url) === url);
  if (duplicate) {
    throw new DomainError('이미 저장한 링크예요.', 'duplicate', duplicate.id);
  }

  const baseId = `saved-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  let id = baseId;
  let suffix = 0;
  while (existing.some((item) => item.id === id)) id = `${baseId}-${++suffix}`;
  return {
    id,
    title: draft.title.trim(),
    url,
    source,
    category: draft.category,
    placeName: draft.placeName?.trim() ?? '',
    note: draft.note?.trim() ?? '',
    visited: false,
    createdAt: now,
    ...metadata,
  };
}

export interface ContentFilter {
  query?: string;
  category?: Category | 'all';
  source?: SourceType | 'all';
}

function searchText(text: string): string {
  return text.normalize('NFKC').toLowerCase();
}

/** Preserves input order so callers can retain their saved-list sorting. */
export function searchContent(items: SavedContent[], filter: ContentFilter = {}, now: string = new Date().toISOString()): SavedContent[] {
  const words = searchText(filter.query?.trim() ?? '').split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    if (filter.category && filter.category !== 'all' && item.category !== filter.category) return false;
    if (filter.source && filter.source !== 'all' && item.source !== filter.source) return false;
    const searchable = searchText(`${displayContentTitle(item, now)} ${item.placeName} ${item.note}`);
    return words.every((word) => searchable.includes(word));
  });
}

export const API_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
export const LIBRARY_STORAGE_KEY = 'moa.library.v1';
const CLOCK_SKEW_MS = 5 * 60 * 1000;

function isTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  return month >= 1 && month <= 12 && day >= 1 && day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function nowMilliseconds(now: string): number {
  if (!isTimestamp(now)) throw new DomainError('현재 날짜 형식을 확인해 주세요.', 'validation');
  return Date.parse(now);
}

function remoteTimestamp(value: unknown, now: string): string {
  if (!isTimestamp(value) || Date.parse(value) > nowMilliseconds(now) + CLOCK_SKEW_MS) {
    throw new DomainError('가져온 정보의 확인 날짜가 올바르지 않아요.', 'validation');
  }
  return value;
}

function objectValue(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new DomainError('가져온 정보의 형식이 올바르지 않아요.', 'validation');
  }
  return value as Record<string, unknown>;
}

function textValue(value: unknown, maximum: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum) {
    throw new DomainError('가져온 정보의 이름을 확인해 주세요.', 'validation');
  }
  return value.trim();
}

function validateMetadata(
  input: { titleMode?: unknown; external?: unknown; importedFrom?: unknown; place?: unknown },
  source: SourceType,
  now: string,
  allowNull = true,
): Pick<SavedContent, 'titleMode' | 'external' | 'importedFrom' | 'place'> {
  const result: Pick<SavedContent, 'titleMode' | 'external' | 'importedFrom' | 'place'> = {};
  if (input.titleMode !== undefined) {
    if (input.titleMode !== 'manual' && input.titleMode !== 'external') throw new DomainError('제목 표시 방식을 확인해 주세요.', 'validation');
    result.titleMode = input.titleMode;
  }
  if (!allowNull && (input.external === null || input.place === null)) throw new DomainError('저장 정보의 형식이 올바르지 않아요.', 'validation');
  if (input.external !== undefined && input.external !== null) {
    const external = objectValue(input.external);
    if (external.provider !== 'youtube' || source !== 'youtube') throw new DomainError('외부 제목의 출처가 링크와 일치하지 않아요.', 'validation');
    result.external = {
      provider: 'youtube',
      title: textValue(external.title, 500),
      fetchedAt: remoteTimestamp(external.fetchedAt, now),
      ...(external.authorName === undefined || external.authorName === '' ? {} : { authorName: textValue(external.authorName, 300) }),
    };
  }
  if (input.importedFrom !== undefined) {
    const origin = objectValue(input.importedFrom);
    if (
      (origin.provider !== 'youtube' && origin.provider !== 'naver') || origin.provider !== source ||
      (origin.provider === 'youtube' && origin.method !== 'public-playlist' && origin.method !== 'account-playlist') ||
      (origin.provider === 'naver' && origin.method !== 'place-search')
    ) throw new DomainError('가져온 정보의 출처와 방법을 확인해 주세요.', 'validation');
    if (origin.method !== 'account-playlist' && origin.connectionId !== undefined) throw new DomainError('계정 연결 정보가 올바르지 않아요.', 'validation');
    result.importedFrom = {
      provider: origin.provider,
      method: origin.method as ImportOrigin['method'],
      fetchedAt: remoteTimestamp(origin.fetchedAt, now),
      ...(origin.method === 'account-playlist' ? { connectionId: textValue(origin.connectionId, 200) } : {}),
    };
  }
  if (input.place !== undefined && input.place !== null) {
    const place = objectValue(input.place);
    if (
      place.provider !== 'naver' || source !== 'naver' || result.importedFrom?.provider !== 'naver' || result.importedFrom.method !== 'place-search' ||
      typeof place.latitude !== 'number' || !Number.isFinite(place.latitude) || Math.abs(place.latitude) > 90 ||
      typeof place.longitude !== 'number' || !Number.isFinite(place.longitude) || Math.abs(place.longitude) > 180
    ) throw new DomainError('장소의 출처와 좌표를 확인해 주세요.', 'validation');
    result.place = {
      provider: 'naver',
      name: textValue(place.name, 300),
      address: textValue(place.address, 1000),
      latitude: place.latitude,
      longitude: place.longitude,
      fetchedAt: remoteTimestamp(place.fetchedAt, now),
    };
  }
  if (result.titleMode === 'external' && !result.external) throw new DomainError('외부 제목 정보가 없어요.', 'validation');
  return result;
}

function expired(fetchedAt: string, now: string): boolean {
  return nowMilliseconds(now) - Date.parse(fetchedAt) >= API_RETENTION_MS;
}

export function displayContentTitle(item: SavedContent, now: string = new Date().toISOString()): string {
  return item.titleMode === 'external' && item.external && !expired(item.external.fetchedAt, now) ? item.external.title : item.title;
}

/** Only explicitly API-derived records are removed. A manual link keeps its own text. */
export function pruneExpiredContent(items: SavedContent[], now: string = new Date().toISOString()): { items: SavedContent[]; changed: boolean; removed: number } {
  nowMilliseconds(now);
  let changed = false;
  let removed = 0;
  const retained: SavedContent[] = [];
  for (const item of items) {
    validateMetadata(item, item.source, now, false);
    if ((item.importedFrom && expired(item.importedFrom.fetchedAt, now)) || (item.place && expired(item.place.fetchedAt, now))) {
      changed = true; removed += 1;
      continue;
    }
    if (item.external && expired(item.external.fetchedAt, now)) {
      const { external: _external, ...withoutCache } = item;
      retained.push({ ...withoutCache, ...(item.titleMode === 'external' ? { titleMode: 'manual' as const } : {}) });
      changed = true;
    } else retained.push(item);
  }
  return { items: retained, changed, removed };
}

function validateStoredItems(parsed: unknown, now: string): SavedContent[] {
  nowMilliseconds(now);
  if (!Array.isArray(parsed)) throw new DomainError('저장 데이터 형식이 올바르지 않아요.', 'validation');
  const ids = new Set<string>();
  return parsed.map((value: unknown) => {
    const item = objectValue(value);
    if (
      typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id) ||
      typeof item.title !== 'string' || !item.title.trim() ||
      typeof item.url !== 'string' || typeof item.placeName !== 'string' ||
      typeof item.note !== 'string' || typeof item.visited !== 'boolean' ||
      typeof item.source !== 'string' || !sourceIds.has(item.source as SourceType) ||
      typeof item.category !== 'string' || !categoryIds.has(item.category as Category) ||
      !isTimestamp(item.createdAt)
    ) throw new DomainError('저장 데이터 형식이 올바르지 않아요.', 'validation');
    const url = normalizeUrl(item.url);
    if (detectSource(url) !== item.source) throw new DomainError('저장된 링크의 출처 정보가 올바르지 않아요.', 'validation');
    const metadata = validateMetadata(item, item.source as SourceType, now, false);
    ids.add(item.id);
    return {
      id: item.id, title: item.title, url, source: item.source as SourceType,
      category: item.category as Category, placeName: item.placeName, note: item.note,
      visited: item.visited, createdAt: item.createdAt, ...metadata,
    };
  });
}

/** Unknown versions and any malformed item fail the entire read; no repair is guessed. */
export function readStoredLibrary(raw: string | null, now: string = new Date().toISOString()): { items: SavedContent[]; needsMigration: boolean } {
  if (raw === null) return { items: [], needsMigration: false };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new DomainError('저장된 데이터를 읽을 수 없어요. 원본 데이터를 보존해 주세요.', 'validation');
  }
  if (Array.isArray(parsed)) return { items: validateStoredItems(parsed, now), needsMigration: true };
  const envelope = objectValue(parsed);
  if (envelope.version !== 2) throw new DomainError('이 버전에서 지원하지 않는 저장 형식이에요. 원본 데이터를 보존해 주세요.', 'validation');
  return { items: validateStoredItems(envelope.items, now), needsMigration: false };
}

/** Compatibility read, intentionally without expiration side effects. */
export function parseStoredContent(raw: string | null, now: string = new Date().toISOString()): SavedContent[] {
  return readStoredLibrary(raw, now).items;
}

export function serializeStoredLibrary(items: SavedContent[], now: string = new Date().toISOString()): string {
  return JSON.stringify({ version: 2, items: validateStoredItems(items, now) });
}

export interface LibraryStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

/** Migration and retention use one replacement write before the provider becomes ready. */
export async function loadStoredLibrary(storage: LibraryStorage, now: string = new Date().toISOString()): Promise<SavedContent[]> {
  const raw = await storage.getItem(LIBRARY_STORAGE_KEY);
  const read = readStoredLibrary(raw, now);
  const cleaned = pruneExpiredContent(read.items, now);
  if (read.needsMigration || cleaned.changed) await storage.setItem(LIBRARY_STORAGE_KEY, serializeStoredLibrary(cleaned.items, now));
  return cleaned.items;
}

/** Returns the committed state only after the persistent write succeeds. */
export async function saveStoredLibrary(storage: LibraryStorage, items: SavedContent[], now: string = new Date().toISOString()): Promise<SavedContent[]> {
  const cleaned = pruneExpiredContent(validateStoredItems(items, now), now);
  await storage.setItem(LIBRARY_STORAGE_KEY, serializeStoredLibrary(cleaned.items, now));
  return cleaned.items;
}

/** Validates the whole batch, then skips duplicates without changing existing records. */
export function buildContentImport(drafts: DraftInput[], existing: SavedContent[], now: string = new Date().toISOString()): { items: SavedContent[]; added: number; duplicates: number } {
  if (!Array.isArray(drafts) || drafts.length > 200) throw new DomainError('한 번에 최대 200개까지 가져올 수 있어요.', 'validation');
  const candidates = drafts.map(draft => {
    if (!draft || typeof draft !== 'object') throw new DomainError('가져올 항목의 형식을 확인해 주세요.', 'validation');
    const item = createContent(draft, [], now);
    return item;
  });
  const urls = new Set(existing.map(item => normalizeUrl(item.url)));
  const ids = new Set(existing.map(item => item.id));
  const additions: SavedContent[] = [];
  let duplicates = 0;
  for (const candidate of candidates) {
    if (urls.has(candidate.url)) { duplicates += 1; continue; }
    while (ids.has(candidate.id)) candidate.id += '-new';
    ids.add(candidate.id); urls.add(candidate.url); additions.push(candidate);
  }
  return { items: [...additions, ...existing], added: additions.length, duplicates };
}

export function removeAccountImportedContent(items: SavedContent[], connectionId?: string): { items: SavedContent[]; removed: number } {
  if (connectionId !== undefined) textValue(connectionId, 200);
  const retained = items.filter(item => item.importedFrom?.method !== 'account-playlist' || (connectionId !== undefined && item.importedFrom.connectionId !== connectionId));
  return { items: retained, removed: items.length - retained.length };
}

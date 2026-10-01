export type Category = 'food' | 'cafe' | 'event' | 'other';
export type SourceType = 'instagram' | 'youtube' | 'naver' | 'web';

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
}

export interface DraftInput {
  title: string;
  url: string;
  category: Category;
  placeName?: string;
  note?: string;
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
    !isTimestamp(now)
  ) {
    throw new DomainError('입력 내용을 확인해 주세요.', 'validation');
  }
  const url = normalizeUrl(draft.url);
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
    source: detectSource(url),
    category: draft.category,
    placeName: draft.placeName?.trim() ?? '',
    note: draft.note?.trim() ?? '',
    visited: false,
    createdAt: now,
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
export function searchContent(items: SavedContent[], filter: ContentFilter = {}): SavedContent[] {
  const words = searchText(filter.query?.trim() ?? '').split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    if (filter.category && filter.category !== 'all' && item.category !== filter.category) return false;
    if (filter.source && filter.source !== 'all' && item.source !== filter.source) return false;
    const searchable = searchText(`${item.title} ${item.placeName} ${item.note}`);
    return words.every((word) => searchable.includes(word));
  });
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
}

/** Fails explicitly on corruption; the storage layer must not overwrite unreadable data. */
export function parseStoredContent(raw: string | null): SavedContent[] {
  if (raw === null) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new DomainError('저장된 데이터를 읽을 수 없어요. 원본 데이터를 보존해 주세요.', 'validation');
  }
  if (!Array.isArray(parsed)) {
    throw new DomainError('저장 데이터 형식이 올바르지 않아요.', 'validation');
  }
  const ids = new Set<string>();
  return parsed.map((value: unknown) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new DomainError('저장 데이터 형식이 올바르지 않아요.', 'validation');
    }
    const item = value as Record<string, unknown>;
    if (
      typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id) ||
      typeof item.title !== 'string' || !item.title.trim() ||
      typeof item.url !== 'string' || typeof item.placeName !== 'string' ||
      typeof item.note !== 'string' || typeof item.visited !== 'boolean' ||
      typeof item.source !== 'string' || !sourceIds.has(item.source as SourceType) ||
      typeof item.category !== 'string' || !categoryIds.has(item.category as Category) ||
      !isTimestamp(item.createdAt)
    ) {
      throw new DomainError('저장 데이터 형식이 올바르지 않아요.', 'validation');
    }
    const url = normalizeUrl(item.url);
    if (detectSource(url) !== item.source) {
      throw new DomainError('저장된 링크의 출처 정보가 올바르지 않아요.', 'validation');
    }
    ids.add(item.id);
    return {
      id: item.id,
      title: item.title,
      url,
      source: item.source as SourceType,
      category: item.category as Category,
      placeName: item.placeName,
      note: item.note,
      visited: item.visited,
      createdAt: item.createdAt,
    };
  });
}

import { detectSource, normalizeUrl } from './content.ts';

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
export const MAX_IMPORT_ITEMS = 200;

export type ImportFormat = 'json' | 'txt';

export interface ImportCandidate {
  url: string;
  title: string;
}

export interface ImportParseResult {
  items: ImportCandidate[];
  duplicates: number;
  unsupported: number;
}

export class ImportParseError extends Error {
  readonly code: 'size' | 'limit' | 'format';

  constructor(message: string, code: ImportParseError['code']) {
    super(message);
    this.name = 'ImportParseError';
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Counts UTF-8 bytes without depending on a browser or native encoder. */
function validateSize(text: string): void {
  if (text.length > MAX_IMPORT_BYTES) {
    throw new ImportParseError('파일은 2MiB 이하로 나누어 가져와 주세요.', 'size');
  }
  let bytes = 0;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code <= 0x7f) bytes += 1;
    else if (code <= 0x7ff) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff && index + 1 < text.length && text.charCodeAt(index + 1) >= 0xdc00 && text.charCodeAt(index + 1) <= 0xdfff) {
      bytes += 4;
      index += 1;
    } else bytes += 3;
    if (bytes > MAX_IMPORT_BYTES) {
      throw new ImportParseError('파일은 2MiB 이하로 나누어 가져와 주세요.', 'size');
    }
  }
}

function validateCount(count: number): void {
  if (count > MAX_IMPORT_ITEMS) {
    throw new ImportParseError('한 번에 최대 200개까지 가져올 수 있어요. 파일을 나누어 주세요.', 'limit');
  }
}

function candidateTitle(value: unknown, url: string): string {
  if (typeof value === 'string' && value.trim()) {
    // Preserve complete code points while meeting the saved title's 120-unit limit.
    let title = '';
    for (const character of value.trim()) {
      if (title.length + character.length > 120) break;
      title += character;
    }
    return title;
  }
  switch (detectSource(url)) {
    case 'instagram': return 'Instagram 링크';
    case 'youtube': return 'YouTube 링크';
    default: return '네이버 링크';
  }
}

/** Produces a review list only. It never writes storage, fetches links, or logs input. */
export function parseImportCandidates(text: string, format: ImportFormat): ImportParseResult {
  if (typeof text !== 'string' || (format !== 'json' && format !== 'txt')) {
    throw new ImportParseError('JSON 또는 TXT 파일을 선택해 주세요.', 'format');
  }
  validateSize(text);
  const input = text.replace(/^\uFEFF/, '').trim();
  const result: ImportParseResult = { items: [], duplicates: 0, unsupported: 0 };
  const seen = new Set<string>();
  let candidateCount = 0;

  function addCandidate(urlValue: unknown, titleValue?: unknown): void {
    candidateCount += 1;
    validateCount(candidateCount);
    if (
      typeof urlValue !== 'string' || urlValue.length > 4096 ||
      !/^https:\/\//i.test(urlValue.trim()) || /[\\\u0000-\u0020\u007f]/.test(urlValue.trim()) ||
      (titleValue !== undefined && typeof titleValue !== 'string')
    ) {
      result.unsupported += 1;
      return;
    }
    let url: string;
    try {
      url = normalizeUrl(urlValue);
      const parsed = new URL(url);
      if (parsed.port || detectSource(url) === 'web') throw new Error('Unsupported host');
    } catch {
      result.unsupported += 1;
      return;
    }
    if (seen.has(url)) {
      result.duplicates += 1;
      return;
    }
    seen.add(url);
    result.items.push({ url, title: candidateTitle(titleValue, url) });
  }

  if (format === 'txt') {
    const lines = input.split(/\r\n|\n|\r/).map(line => line.trim()).filter(Boolean);
    validateCount(lines.length);
    for (const line of lines) addCandidate(line);
    return result;
  }

  let value: unknown;
  try {
    value = JSON.parse(input);
  } catch {
    throw new ImportParseError('JSON 파일을 읽을 수 없어요. 원본을 수정하지 말고 파일 형식을 확인해 주세요.', 'format');
  }
  if (Array.isArray(value)) {
    validateCount(value.length);
    for (const entry of value) {
      if (!isRecord(entry)) addCandidate(undefined);
      else addCandidate(entry.url, entry.title);
    }
    return result;
  }
  if (isRecord(value) && Array.isArray(value.saved_saved_media)) {
    validateCount(value.saved_saved_media.length);
    for (const entry of value.saved_saved_media) {
      if (!isRecord(entry) || !isRecord(entry.string_map_data)) {
        addCandidate(undefined);
        continue;
      }
      let foundHref = false;
      for (const field of Object.values(entry.string_map_data)) {
        if (isRecord(field) && Object.prototype.hasOwnProperty.call(field, 'href')) {
          foundHref = true;
          addCandidate(field.href, entry.title);
        }
      }
      if (!foundHref) addCandidate(undefined);
    }
    return result;
  }
  throw new ImportParseError('아직 지원하지 않는 JSON 구조예요. 링크 목록을 [{"url":"https://...","title":"제목"}] 형식이나 한 줄에 링크 하나인 TXT 파일로 준비해 주세요.', 'format');
}

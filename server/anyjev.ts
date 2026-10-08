import { createHash } from 'node:crypto';
import { ANALYSIS_PROMPT_VERSION, analysisQuestions, parseAnyJevDecisions, prepareInstagramEvidence } from '../src/domain/instagramAnalysis.ts';
import type { InstagramAnalysisResult } from '../src/domain/instagramAnalysis.ts';

const CACHE_TTL_MS = 15 * 60_000;
const MAX_CACHE_ITEMS = 100;
const MAX_RESPONSE_BYTES = 64 * 1024;
const MAX_HEALTH_BYTES = 4 * 1024;

export class AnyJevError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export type AnyJevConfig = { baseUrl: string; timeoutMs: number };

export function anyJevConfigFromEnv(env: Record<string, string | undefined>): AnyJevConfig {
  const baseUrl = env.ANYJEV_BASE_URL?.trim() || '';
  const timeoutMs = Number(env.ANYJEV_TIMEOUT_MS?.trim() || 45_000);
  return validateConfig({ baseUrl, timeoutMs });
}

function validateConfig(config: AnyJevConfig): AnyJevConfig {
  if (!Number.isInteger(config.timeoutMs) || config.timeoutMs < 1000 || config.timeoutMs > 60_000) {
    throw new Error('ANYJEV_TIMEOUT_MS는 1000–60000 사이의 정수여야 합니다.');
  }
  if (!config.baseUrl) return { ...config };
  let url: URL;
  try { url = new URL(config.baseUrl); } catch { throw new Error('ANYJEV_BASE_URL에는 로컬 HTTP origin을 입력해 주세요.'); }
  if (url.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(url.hostname) ||
    url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('ANYJEV_BASE_URL에는 경로 없는 localhost 또는 127.0.0.1 HTTP origin만 허용합니다.');
  }
  return { baseUrl: url.origin, timeoutMs: config.timeoutMs };
}

type ParsedDecisions = ReturnType<typeof parseAnyJevDecisions>;
type GatewayOptions = { config: AnyJevConfig; fetchImpl?: typeof fetch; now?: () => number };

export function createAnyJevGateway(options: GatewayOptions) {
  const config = validateConfig(options.config);
  const fetchImpl = options.fetchImpl || fetch;
  const now = options.now || Date.now;
  // The map contains hashes and decisions only. Raw captions, OCR and transcripts
  // remain in the current request and are not logged or retained after completion.
  const cache = new Map<string, { expiresAt: number; decisions: ParsedDecisions }>();
  const pending = new Map<string, Promise<ParsedDecisions>>();

  async function request(path: '/health' | '/v1/decide', timeoutMs: number, init: RequestInit = {}): Promise<{ response: Response; signal: AbortSignal }> {
    const signal = AbortSignal.timeout(timeoutMs);
    try {
      const response = await fetchImpl(new URL(path, config.baseUrl), { ...init, signal, redirect: 'error' });
      return { response, signal };
    } catch {
      throw new AnyJevError(502, 'analysis_unavailable', '분석 서버에서 응답하지 않아요. 로컬 AnyJev 실행 상태를 확인해 주세요.');
    }
  }

  async function readResponse(response: Response, signal: AbortSignal, maxBytes = MAX_RESPONSE_BYTES): Promise<unknown> {
    if (Number(response.headers.get('content-length')) > maxBytes || !response.body) {
      void response.body?.cancel().catch(() => undefined);
      throw new AnyJevError(502, 'analysis_invalid', '분석 결과를 읽을 수 없어요.');
    }
    let size = 0;
    const chunks: Uint8Array[] = [];
    const reader = response.body.getReader();
    let abort!: () => void;
    const aborted = new Promise<never>((_resolve, reject) => {
      abort = () => {
        void reader.cancel().catch(() => undefined);
        reject(new AnyJevError(502, 'analysis_unavailable', '분석 응답 시간이 초과됐어요. 다시 시도해 주세요.'));
      };
      signal.addEventListener('abort', abort, { once: true });
    });
    try {
      if (signal.aborted) abort();
      while (true) {
        const chunk = await Promise.race([reader.read(), aborted]);
        if (chunk.done) break;
        if (!chunk.value.length) throw new AnyJevError(502, 'analysis_invalid', '분석 결과를 읽을 수 없어요.');
        size += chunk.value.length;
        if (size > maxBytes) throw new AnyJevError(502, 'analysis_invalid', '분석 결과가 너무 커요.');
        chunks.push(chunk.value);
      }
      if (signal.aborted) throw new AnyJevError(502, 'analysis_unavailable', '분석 응답 시간이 초과됐어요. 다시 시도해 주세요.');
    } catch (error) {
      void reader.cancel().catch(() => undefined);
      if (error instanceof AnyJevError) throw error;
      throw new AnyJevError(502, 'analysis_unavailable', '분석 응답이 끊겼어요. 다시 시도해 주세요.');
    } finally {
      signal.removeEventListener('abort', abort);
      reader.releaseLock();
    }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch {
      throw new AnyJevError(502, 'analysis_invalid', '분석 결과를 읽을 수 없어요.');
    }
  }

  async function status() {
    if (!config.baseUrl) return { provider: 'anyjev' as const, configured: false, reachable: false };
    try {
      const { response, signal } = await request('/health', Math.min(config.timeoutMs, 2000));
      if (response.status !== 200) {
        void response.body?.cancel().catch(() => undefined);
        return { provider: 'anyjev' as const, configured: true, reachable: false };
      }
      const data = await readResponse(response, signal, MAX_HEALTH_BYTES);
      const reachable = typeof data === 'object' && data !== null && !Array.isArray(data) && 'ok' in data && data.ok === true;
      return { provider: 'anyjev' as const, configured: true, reachable };
    } catch {
      return { provider: 'anyjev' as const, configured: true, reachable: false };
    }
  }

  async function analyze(input: unknown, canonicalUrl: string): Promise<InstagramAnalysisResult> {
    let prepared: ReturnType<typeof prepareInstagramEvidence>;
    try { prepared = prepareInstagramEvidence(input); } catch {
      throw new AnyJevError(400, 'invalid_evidence', '캡션·화면 글자·음성 자막을 확인해 주세요. 비어 있거나 너무 긴 입력은 분석할 수 없어요.');
    }
    if (!config.baseUrl) throw new AnyJevError(503, 'setup_required', '분석을 사용하려면 로컬 AnyJev 서버를 먼저 설정해 주세요.');
    const start = now();
    for (const [key, entry] of cache) if (entry.expiresAt <= start) cache.delete(key);
    const key = createHash('sha256').update(JSON.stringify([ANALYSIS_PROMPT_VERSION, canonicalUrl, prepared.text])).digest('hex');
    const existing = cache.get(key);
    let decisions: ParsedDecisions;
    if (existing) {
      decisions = existing.decisions;
    } else if (pending.has(key)) {
      decisions = await pending.get(key)!;
    } else {
      if (pending.size >= 1) throw new AnyJevError(429, 'limited', '다른 콘텐츠를 분석 중이에요. 완료된 뒤 다시 시도해 주세요.');
      const task = (async () => {
        const { response, signal } = await request('/v1/decide', config.timeoutMs, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: analysisQuestions(prepared.text) }),
        });
        if (!response.ok) {
          void response.body?.cancel().catch(() => undefined);
          if (response.status === 429) throw new AnyJevError(429, 'limited', '분석 요청 한도에 도달했어요. 잠시 후 다시 시도해 주세요.');
          throw new AnyJevError(502, 'analysis_unavailable', '분석을 완료하지 못했어요. 로컬 서버 설정을 확인해 주세요.');
        }
        let parsed: ParsedDecisions;
        try { parsed = parseAnyJevDecisions(await readResponse(response, signal)); } catch (error) {
          if (error instanceof AnyJevError) throw error;
          throw new AnyJevError(502, 'analysis_invalid', '분석 결과가 올바르지 않아요. 다시 시도해 주세요.');
        }
        if (parsed.category.route !== 'one_forward' || parsed.evidence.route !== 'one_forward') {
          throw new AnyJevError(502, 'analysis_budget', '긴 추론이 감지됐어요. AnyJev의 adaptive 설정을 꺼서 다시 실행해 주세요.');
        }
        if (cache.size >= MAX_CACHE_ITEMS) cache.delete(cache.keys().next().value!);
        cache.set(key, { expiresAt: now() + CACHE_TTL_MS, decisions: parsed });
        return parsed;
      })();
      pending.set(key, task);
      try { decisions = await task; } finally { pending.delete(key); }
    }
    const category = structuredClone(decisions.category);
    const evidence = structuredClone(decisions.evidence);
    const reasoningTokens = category.reasoningTokens === null || evidence.reasoningTokens === null
      ? null : category.reasoningTokens + evidence.reasoningTokens;
    return {
      provider: 'anyjev', category, evidence, reviewRequired: decisions.reviewRequired || prepared.truncated,
      metrics: {
        inputCharacters: prepared.inputCharacters, preparedCharacters: prepared.preparedCharacters,
        truncated: prepared.truncated, sources: [...prepared.sources], decisions: 2,
        reasoningTokens, elapsedMs: Math.max(0, now() - start),
      },
      cached: Boolean(existing),
    };
  }

  return { status, analyze };
}

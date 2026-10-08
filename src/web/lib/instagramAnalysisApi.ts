import { detectSource, normalizeUrl } from '../../domain/content.ts';
import type { Category } from '../../domain/content.ts';
import type { InstagramAnalysisResult } from '../../domain/instagramAnalysis.ts';
import { MAX_EVIDENCE_CHARACTERS, MAX_PREPARED_CHARACTERS } from '../../domain/instagramAnalysis.ts';
import { IntegrationError } from './api.ts';

export type InstagramAnalysisStatus = { configured: boolean; reachable: boolean; provider: 'anyjev' };
export type InstagramAnalysisInput = { url: string; caption?: string; ocr?: string; transcript?: string };

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function integer(value: unknown, maximum: number): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= maximum;
}

function tokenCount(value: unknown): value is number | null {
  return value === null || integer(value, 100_000);
}

function scores(value: unknown, labels: readonly string[]): boolean {
  if (!record(value) || Object.keys(value).length !== labels.length) return false;
  let total = 0;
  for (const label of labels) {
    const score = value[label];
    if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 1) return false;
    total += score;
  }
  return Math.abs(total - 1) < 0.01;
}

function decision(value: unknown, labels: readonly string[]): boolean {
  if (!record(value) || typeof value.value !== 'string' || !labels.includes(value.value)) return false;
  if (!scores(value.scores, labels) || (value.route !== 'one_forward' && value.route !== 'cot') || !tokenCount(value.reasoningTokens)
    || (value.route === 'one_forward' && value.reasoningTokens !== null && value.reasoningTokens !== 0)) return false;
  const probabilities = value.scores as Record<string, number>;
  return labels.every(label => probabilities[label] <= probabilities[value.value as string] + 1e-8);
}

function validStatus(value: unknown): value is InstagramAnalysisStatus {
  return record(value) && value.provider === 'anyjev' && typeof value.configured === 'boolean'
    && typeof value.reachable === 'boolean' && (value.configured || !value.reachable);
}

function validResult(value: unknown): value is InstagramAnalysisResult {
  if (!record(value) || value.provider !== 'anyjev' || typeof value.reviewRequired !== 'boolean' || typeof value.cached !== 'boolean') return false;
  if (!decision(value.category, ['food', 'cafe', 'event', 'other'] satisfies Category[]) || !decision(value.evidence, ['enough', 'needs_more'])) return false;
  const metrics = value.metrics;
  if (!record(metrics) || !integer(metrics.inputCharacters, MAX_EVIDENCE_CHARACTERS) || !integer(metrics.preparedCharacters, MAX_PREPARED_CHARACTERS)
    || metrics.inputCharacters === 0 || metrics.preparedCharacters === 0 || typeof metrics.truncated !== 'boolean'
    || metrics.decisions !== 2 || !tokenCount(metrics.reasoningTokens) || !integer(metrics.elapsedMs, 600_000)
    || !Array.isArray(metrics.sources) || metrics.sources.length === 0 || metrics.sources.length > 3
    || metrics.sources.some(source => source !== 'caption' && source !== 'ocr' && source !== 'transcript')
    || new Set(metrics.sources).size !== metrics.sources.length) return false;
  return true;
}

function safeMessage(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 400
    && !Array.from(value).some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);
}

async function request(path: string, body: InstagramAnalysisInput | undefined, externalSignal?: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  externalSignal?.addEventListener('abort', abort, { once: true });
  if (externalSignal?.aborted) controller.abort();
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 65_000);
  try {
    if (controller.signal.aborted) throw new DOMException('분석 요청을 취소했어요.', 'AbortError');
    const response = await fetch(path, {
      method: body ? 'POST' : 'GET', credentials: 'include', cache: 'no-store', redirect: 'error',
      signal: controller.signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const responseText = await response.text();
    let payload: unknown;
    try {
      if (responseText.length > 32_000) throw new Error();
      payload = JSON.parse(responseText);
    } catch {
      throw new IntegrationError('분석 응답을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.', response.status, 'invalid_response');
    }
    if (!response.ok) {
      const details = record(payload) && record(payload.error) ? payload.error : {};
      const message = safeMessage(details.message) ? details.message : '분석 요청을 완료하지 못했어요. 다시 시도해 주세요.';
      const code = typeof details.code === 'string' && /^[a-z_]{1,50}$/.test(details.code) ? details.code : 'request_failed';
      throw new IntegrationError(message, response.status, code);
    }
    if (controller.signal.aborted) throw new DOMException('분석 요청을 취소했어요.', 'AbortError');
    return payload;
  } catch (error) {
    if (timedOut) throw new Error('분석이 지연되고 있어요. 입력은 그대로 두고 잠시 후 다시 시도해 주세요.');
    if (externalSignal?.aborted) throw new DOMException('분석 요청을 취소했어요.', 'AbortError');
    if (error instanceof TypeError) throw new Error('분석 서버에 연결하지 못했어요. 입력은 그대로 두고 다시 시도해 주세요.');
    throw error;
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener('abort', abort);
  }
}

export const instagramAnalysisApi = {
  async status(signal?: AbortSignal): Promise<InstagramAnalysisStatus> {
    const result = await request('/api/instagram/analysis/status', undefined, signal);
    if (!validStatus(result)) throw new IntegrationError('분석 서버 상태를 확인하지 못했어요. 다시 확인해 주세요.', 200, 'invalid_response');
    return result;
  },
  async analyze(input: InstagramAnalysisInput, signal?: AbortSignal): Promise<InstagramAnalysisResult> {
    if (detectSource(input.url) !== 'instagram') throw new Error('Instagram 게시물 링크에서 분석해 주세요.');
    const url = normalizeUrl(input.url);
    if (!/^\/(?:p|reel)\/[A-Za-z0-9_-]+\/?$/.test(new URL(url).pathname)) throw new Error('Instagram 게시물이나 릴스 링크에서 분석해 주세요.');
    const result = await request('/api/instagram/analysis', { ...input, url }, signal);
    if (!validResult(result)) throw new IntegrationError('분석 결과를 확인하지 못했어요. 입력을 확인하고 다시 시도해 주세요.', 200, 'invalid_response');
    return result;
  },
};

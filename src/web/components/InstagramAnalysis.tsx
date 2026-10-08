import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router';
import { CATEGORIES } from '../../domain/content';
import { MAX_EVIDENCE_CHARACTERS, prepareInstagramEvidence } from '../../domain/instagramAnalysis';
import type { InstagramAnalysisResult } from '../../domain/instagramAnalysis';
import { instagramAnalysisApi } from '../lib/instagramAnalysisApi';
import type { InstagramAnalysisStatus } from '../lib/instagramAnalysisApi';
import { Button, Icon, Notice } from './Ui';

type EvidenceField = 'caption' | 'ocr' | 'transcript';
const fields: { id: EvidenceField; label: string; placeholder: string }[] = [
  { id: 'caption', label: '게시물 캡션', placeholder: '게시물에 적힌 설명을 붙여넣어 주세요.' },
  { id: 'ocr', label: '화면 속 글자', placeholder: '이미 추출한 화면 글자나 직접 옮긴 글자를 붙여넣어 주세요.' },
  { id: 'transcript', label: '릴스 자막', placeholder: '이미 추출한 자막이나 음성 기록을 붙여넣어 주세요.' },
];
const emptyInputs = { caption: '', ocr: '', transcript: '' };

export function InstagramAnalysis({ url, contentId }: { url: string; contentId: string }) {
  return <AnalysisPanel key={`${contentId}:${url}`} url={url} contentId={contentId} />;
}

function AnalysisPanel({ url, contentId }: { url: string; contentId: string }) {
  const [open, setOpen] = useState(false);
  const [inputs, setInputs] = useState(emptyInputs);
  const [status, setStatus] = useState<InstagramAnalysisStatus | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<InstagramAnalysisResult | null>(null);
  const requestVersion = useRef(0);
  const statusVersion = useRef(0);
  const mounted = useRef(true);
  const analysisRequest = useRef<AbortController | null>(null);
  const statusRequest = useRef<AbortController | null>(null);
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const formId = useId();
  const inputCharacters = inputs.caption.length + inputs.ocr.length + inputs.transcript.length;
  const prepared = useMemo(() => {
    if (!inputCharacters) return { evidence: null, error: '' };
    try { return { evidence: prepareInstagramEvidence(inputs), error: '' }; }
    catch (error) { return { evidence: null, error: error instanceof Error ? error.message : '입력 내용을 확인해 주세요.' }; }
  }, [inputs, inputCharacters]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestVersion.current += 1;
      statusVersion.current += 1;
      analysisRequest.current?.abort();
      statusRequest.current?.abort();
    };
  }, []);
  useEffect(() => { if (result) resultRef.current?.focus({ preventScroll: true }); }, [result]);

  const checkStatus = async () => {
    if (statusRequest.current) return;
    const controller = new AbortController();
    const version = ++statusVersion.current;
    statusRequest.current = controller;
    setStatusBusy(true); setStatusError('');
    try {
      const next = await instagramAnalysisApi.status(controller.signal);
      if (mounted.current && statusVersion.current === version) setStatus(next);
    } catch (error) {
      if (mounted.current && statusVersion.current === version && !controller.signal.aborted) {
        setStatus(null);
        setStatusError(error instanceof Error ? error.message : '분석 서버 상태를 확인하지 못했어요.');
      }
    } finally {
      if (statusRequest.current === controller) statusRequest.current = null;
      if (mounted.current && statusVersion.current === version) setStatusBusy(false);
    }
  };

  const cancelAnalysis = () => {
    requestVersion.current += 1;
    analysisRequest.current?.abort();
    analysisRequest.current = null;
    setBusy(false);
  };
  const update = (field: EvidenceField, value: string) => {
    cancelAnalysis();
    setInputs(previous => ({ ...previous, [field]: value }));
    setResult(null); setError('');
  };
  const reset = () => {
    cancelAnalysis();
    setInputs(emptyInputs); setResult(null); setError('');
    captionRef.current?.focus();
  };
  const analyze = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (analysisRequest.current || statusBusy || !status?.configured || !status.reachable) return;
    if (!prepared.evidence) {
      setError(prepared.error || '캡션·화면 글자·자막 중 하나를 붙여넣어 주세요.');
      captionRef.current?.focus();
      return;
    }
    const controller = new AbortController();
    const version = ++requestVersion.current;
    analysisRequest.current = controller;
    setBusy(true); setResult(null); setError('');
    try {
      const next = await instagramAnalysisApi.analyze({ url, ...inputs }, controller.signal);
      if (mounted.current && requestVersion.current === version && !controller.signal.aborted) setResult(next);
    } catch (error) {
      if (mounted.current && requestVersion.current === version && !controller.signal.aborted) {
        setError(error instanceof Error ? error.message : '분석하지 못했어요. 입력은 그대로 두고 다시 시도해 주세요.');
      }
    } finally {
      if (analysisRequest.current === controller) analysisRequest.current = null;
      if (mounted.current && requestVersion.current === version) setBusy(false);
    }
  };

  const categoryLabel = result ? CATEGORIES.find(category => category.id === result.category.value)?.label : '';
  return <section className="panel instagram-analysis" aria-label="Instagram 간단 분석">
    <button type="button" className="optional-toggle analysis-toggle" aria-expanded={open} aria-controls={`${formId}-panel`} onClick={() => {
      setOpen(!open);
      if (!open && !status && !statusBusy) void checkStatus();
    }}><span><Icon name="sparkles" /><strong>간단 분석</strong></span><Icon name="chevron-down" className={open ? 'analysis-chevron is-open' : 'analysis-chevron'} /></button>
    <p className="help-text">게시물 설명이나 릴스 자막으로 저장할 분류를 추천받아요.</p>
    <div id={`${formId}-panel`} className="analysis-body" hidden={!open}>
      <p className="analysis-description">직접 복사한 캡션이나 이미 추출한 화면 글자·자막을 붙여넣어 주세요. 입력은 이 화면에서만 유지되며, 분석할 때 분석 서버에 전송돼요.</p>
      <div className="analysis-status">
        {statusBusy ? <p className="help-text" role="status"><Icon name="loader" className="spin" />분석 연결을 확인하고 있어요.</p>
          : statusError ? <Notice kind="error">{statusError}</Notice>
            : status?.configured && status.reachable ? <p className="analysis-ready"><Icon name="check-circle" size={17} />AnyJev 분석 준비됨</p>
              : status?.configured ? <Notice>분석 서버가 응답하지 않아요. 연결을 다시 확인해 주세요. 입력은 계속 정리할 수 있어요.</Notice>
                : <Notice>AnyJev 모델 연결이 필요해요. 입력을 정리해 볼 수 있고, 연결 후 분류를 추천받을 수 있어요.</Notice>}
        <Button variant="ghost" loading={statusBusy} disabled={busy} onClick={() => void checkStatus()}>연결 다시 확인</Button>
      </div>
      <form className="analysis-form" onSubmit={event => void analyze(event)}>
        <fieldset className="analysis-inputs" aria-describedby={`${formId}-limit`}>
          <legend className="sr-only">분류할 게시물 텍스트</legend>
          {fields.map(field => <label key={field.id} className="field" htmlFor={`${formId}-${field.id}`}>
            <span className="field-label">{field.label}<span className="muted">선택</span></span>
            <textarea ref={field.id === 'caption' ? captionRef : undefined} id={`${formId}-${field.id}`} className="field-input analysis-textarea" rows={3} value={inputs[field.id]} maxLength={Math.max(0, MAX_EVIDENCE_CHARACTERS - inputCharacters + inputs[field.id].length)} placeholder={field.placeholder} onChange={event => update(field.id, event.target.value)} />
          </label>)}
        </fieldset>
        <p id={`${formId}-limit`} className="analysis-count">입력 {inputCharacters.toLocaleString('ko-KR')} / 8,000자 · 세 입력의 합계</p>
        {prepared.error && <Notice kind="error">{prepared.error}</Notice>}
        {prepared.evidence && <details className="analysis-prepared">
          <summary>정리한 분석 입력 · {prepared.evidence.preparedCharacters.toLocaleString('ko-KR')}자<Icon name="chevron-down" size={16} /></summary>
          <p>중복 줄·공백을 정리하고 최대 2,400자로 줄여 분류해요. 이 숫자는 문자 수이며 토큰 수와 달라요.{prepared.evidence.truncated && ' 긴 내용은 일부를 생략했어요. 중요한 장소·행사 설명이 포함됐는지 확인해 주세요.'}</p>
          <pre>{prepared.evidence.text}</pre>
        </details>}
        {error && <Notice kind="error">{error}</Notice>}
        <div className="button-row analysis-actions">
          <Button type="submit" icon="sparkles" loading={busy} disabled={!prepared.evidence || Boolean(prepared.error) || statusBusy || !status?.configured || !status.reachable}>분류 추천받기</Button>
          {busy ? <Button variant="secondary" onClick={cancelAnalysis}>분석 요청 취소</Button> : <Button variant="ghost" disabled={!inputCharacters && !result && !error} onClick={reset}>입력 비우기</Button>}
        </div>
        {busy && <p className="help-text">요청을 취소해도 이미 시작한 서버 분석은 계속 처리될 수 있어요.</p>}
      </form>
      {result && <div className="analysis-result">
        <h3 ref={resultRef} tabIndex={-1}>추천 분류 · {categoryLabel}</h3>
        <p>{result.evidence.value === 'needs_more' ? '판단할 근거가 부족해요. 원문을 확인하거나 캡션·자막을 더 추가해 주세요.'
          : result.reviewRequired ? '분류가 모호하거나 텍스트 일부가 생략됐어요. 원문을 확인하고 분류를 직접 선택해 주세요.'
            : '입력한 텍스트에서 분류를 추천했어요. 원문과 비교한 뒤 직접 선택해 주세요.'}</p>
        <Link to={`/add?id=${encodeURIComponent(contentId)}`} className="button button-secondary"><Icon name="edit" />분류 확인·수정</Link>
        <p className="help-text">현재 저장한 분류는 그대로예요. 수정 화면에서 분류를 선택하고 저장해 주세요.</p>
        <details className="analysis-diagnostics">
          <summary>분석 정보<Icon name="chevron-down" size={16} /></summary>
          <dl>
            <div><dt>결과</dt><dd>{result.cached ? '같은 입력의 이전 결과 재사용' : '새 입력 분석'}</dd></div>
            <div><dt>분류 판단</dt><dd>{result.category.route === 'one_forward' ? '추론 생성 없이 판단' : '추론 후 판단'}</dd></div>
            <div><dt>근거 판단</dt><dd>{result.evidence.route === 'one_forward' ? '추론 생성 없이 판단' : '추론 후 판단'}</dd></div>
            <div><dt>생성한 추론 토큰</dt><dd>{result.metrics.reasoningTokens === null ? '측정값 없음' : `${result.metrics.reasoningTokens.toLocaleString('ko-KR')}개`}</dd></div>
            <div><dt>분석 텍스트</dt><dd>{result.metrics.inputCharacters.toLocaleString('ko-KR')}자 → {result.metrics.preparedCharacters.toLocaleString('ko-KR')}자</dd></div>
          </dl>
          <p>분류 점수는 모델의 선택 가중치이며 정확도를 뜻하지 않아요. 전체 처리 토큰이나 비용 절감률은 측정하지 않았어요.</p>
          <ul>{CATEGORIES.map(category => <li key={category.id}><span>{category.label}</span><span>{result.category.scores[category.id].toFixed(3)}</span></li>)}</ul>
        </details>
      </div>}
    </div>
  </section>;
}

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { CATEGORIES, DomainError, detectSource, displayContentTitle, normalizeUrl, validateDraft, type Category, type DraftInput, type ExternalMetadata, type SavedContent } from '../../domain/content';
import { Button, EmptyState, Icon, Notice, PageHeading, SourceBadge } from '../components/Ui';
import { integrationsApi } from '../lib/api';
import { useLibrary } from '../library/LibraryProvider';

export function AddPage() {
  const [params] = useSearchParams();
  const id = params.get('id') || undefined;
  const initialUrl = params.get('url') || undefined;
  const { items, loading, error, retry } = useLibrary();
  const original = items.find(item => item.id === id);
  if (loading && id && !original) return <><PageHeading title="콘텐츠 준비" subtitle="저장한 내용을 불러오고 있어요." backTo="/" /><div className="loading-state" role="status"><Icon name="loader" /><span>저장함을 불러오는 중이에요.</span></div></>;
  if (id && !original) return <><PageHeading title="콘텐츠 수정" backTo="/" />{error ? <div className="panel"><Notice kind="error">{error}</Notice><Button variant="secondary" onClick={retry}>다시 불러오기</Button></div> : <EmptyState title="수정할 콘텐츠를 찾을 수 없어요" description="저장함에서 다시 선택해 주세요." action={<Link className="button button-primary" to="/">저장함으로</Link>} />}</>;
  return <LinkForm key={id ?? `new:${initialUrl ?? ''}`} id={id} original={original} initialUrl={initialUrl} />;
}

function LinkForm({ id, original, initialUrl }: { id?: string; original?: SavedContent; initialUrl?: string }) {
  const navigate = useNavigate();
  const { add, update, loading, saving, error: loadError, retry } = useLibrary();
  const [title, setTitle] = useState(original ? displayContentTitle(original) : '');
  const [url, setUrl] = useState(original?.url ?? initialUrl ?? '');
  const [external, setExternal] = useState<ExternalMetadata | null>(original?.external ?? null);
  const [titleMode, setTitleMode] = useState<'manual' | 'external'>(original?.titleMode ?? 'manual');
  const titleModeRef = useRef<'manual' | 'external'>(original?.titleMode ?? 'manual');
  const [category, setCategory] = useState<Category>(original?.category ?? 'other');
  const [placeName, setPlaceName] = useState(original?.placeName ?? '');
  const [note, setNote] = useState(original?.note ?? '');
  const [optionalOpen, setOptionalOpen] = useState(Boolean(original?.placeName || original?.note));
  const [errors, setErrors] = useState<Partial<Record<'url' | 'title', string>>>({});
  const [message, setMessage] = useState('');
  const [duplicateId, setDuplicateId] = useState<string>();
  const [fetching, setFetching] = useState(false);
  const [pasting, setPasting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const urlVersion = useRef(0);
  const metadataLock = useRef(false);
  const pasteLock = useRef(false);
  const submitLock = useRef(false);
  const active = useRef(true);
  const urlRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const legacyNaver = Boolean(original?.place || original?.importedFrom?.provider === 'naver');
  const formDisabled = saving || submitting || legacyNaver;

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; urlVersion.current += 1; };
  }, []);

  const changeUrl = (value: string) => {
    urlVersion.current += 1;
    setUrl(value); setExternal(null);
    if (titleModeRef.current === 'external') setTitle('');
    titleModeRef.current = 'manual';
    setTitleMode('manual');
    setErrors(previous => ({ ...previous, url: undefined }));
    setMessage(''); setDuplicateId(undefined);
  };
  const pasteLink = async () => {
    if (pasteLock.current) return;
    pasteLock.current = true; setPasting(true); setMessage('');
    const version = urlVersion.current;
    try {
      if (!navigator.clipboard?.readText) throw new Error('이 브라우저에서는 클립보드를 읽을 수 없어요. 링크 입력 칸에 직접 붙여넣어 주세요.');
      const text = (await navigator.clipboard.readText()).trim();
      if (!active.current || version !== urlVersion.current) return;
      normalizeUrl(text);
      changeUrl(text);
      urlRef.current?.focus();
    } catch (error) {
      if (active.current && version === urlVersion.current) setMessage(error instanceof DomainError ? error.message : '클립보드를 읽지 못했어요. 링크 입력 칸에 직접 붙여넣어 주세요.');
    } finally {
      pasteLock.current = false;
      if (active.current) setPasting(false);
    }
  };
  const fetchTitle = async () => {
    if (metadataLock.current || formDisabled) return;
    let normalized: string;
    try { normalized = normalizeUrl(url); }
    catch (error) { setErrors(previous => ({ ...previous, url: error instanceof Error ? error.message : '링크를 확인해 주세요.' })); urlRef.current?.focus(); return; }
    metadataLock.current = true; setFetching(true); setMessage('');
    const version = urlVersion.current;
    try {
      const result = await integrationsApi.metadata(normalized);
      if (!active.current || version !== urlVersion.current) return;
      setExternal(result); setTitle(result.title); titleModeRef.current = 'external'; setTitleMode('external');
      setErrors(previous => ({ ...previous, title: undefined }));
    } catch (error) {
      if (active.current && version === urlVersion.current) setMessage(error instanceof Error ? error.message : '제목을 불러오지 못했어요. 직접 입력할 수 있어요.');
    } finally {
      metadataLock.current = false;
      if (active.current) setFetching(false);
    }
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitLock.current || metadataLock.current || pasteLock.current || loading || saving || fetching || pasting || loadError || legacyNaver) return;
    const draft: DraftInput = {
      title: titleMode === 'external' ? original?.title ?? '저장한 YouTube 영상' : title,
      url, category, placeName, note, titleMode, external,
      ...(original && original.placeName !== placeName ? { place: null } : {}),
    };
    const nextErrors = validateDraft(draft);
    setErrors(nextErrors); setMessage(''); setDuplicateId(undefined);
    if (nextErrors.url || nextErrors.title) {
      const field = nextErrors.url ? urlRef.current : titleRef.current;
      field?.focus(); field?.scrollIntoView({ block: 'center' });
      return;
    }
    submitLock.current = true; setSubmitting(true);
    try {
      if (id) {
        await update(id, draft);
        if (active.current) navigate(`/content/${encodeURIComponent(id)}`, { replace: true });
      } else {
        await add(draft);
        if (active.current) navigate('/', { replace: true });
      }
    } catch (error) {
      if (!active.current) return;
      setMessage(error instanceof Error ? error.message : '저장하지 못했어요. 다시 시도해 주세요.');
      if (error instanceof DomainError && error.code === 'duplicate') setDuplicateId(error.duplicateId);
      requestAnimationFrame(() => messageRef.current?.focus());
    } finally {
      submitLock.current = false;
      if (active.current) setSubmitting(false);
    }
  };

  return <>
    <PageHeading kicker={id ? 'EDIT COLLECTION' : 'SAVE A MOMENT'} title={id ? '나의 취향을 조금 더 자세하게.' : '좋아한 순간을 모아두세요.'}
      subtitle="링크와 제목만 있으면 시작할 수 있어요." backTo="/" />
    <form className="form-grid" onSubmit={submit} noValidate>
      <section className="panel form-section" aria-label={id ? '콘텐츠 수정' : '링크 추가'}>
        <fieldset className="form-fields" disabled={formDisabled}>
          <div className="field">
            <label className="field-label" htmlFor="content-url">콘텐츠 링크 <span aria-hidden="true">*</span></label>
            <input id="content-url" ref={urlRef} className="field-input" type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="https://…" value={url} onChange={event => changeUrl(event.target.value)} aria-required="true" aria-invalid={Boolean(errors.url)} aria-describedby={errors.url ? 'content-url-error' : 'content-url-help'} />
            {errors.url && <p className="field-error" id="content-url-error" role="alert">{errors.url}</p>}
            <div className="button-row"><Button variant="ghost" icon="copy" loading={pasting} onClick={() => void pasteLink()}>링크 붙여넣기</Button>{url.trim() && <SourceBadge source={detectSource(url)} />}</div>
            <p className="help-text" id="content-url-help">영상·게시물·직접 공유한 지도 링크를 추가할 수 있어요.</p>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="content-title">제목 <span aria-hidden="true">*</span></label>
            <input id="content-title" ref={titleRef} className="field-input" type="text" placeholder="기억하고 싶은 콘텐츠 이름" value={title} maxLength={titleMode === 'external' ? 500 : 120} onChange={event => {
              urlVersion.current += 1; setTitle(event.target.value); titleModeRef.current = 'manual'; setTitleMode('manual'); setErrors(previous => ({ ...previous, title: undefined }));
            }} aria-required="true" aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'content-title-error' : 'content-title-help'} />
            {errors.title && <p className="field-error" id="content-title-error" role="alert">{errors.title}</p>}
            <p className="help-text" id="content-title-help">{titleMode === 'external' ? original?.importedFrom ? 'YouTube 제공 제목이에요. 제목을 수정해도 항목의 보관 기간은 유지돼요.' : 'YouTube에서 불러온 제목이에요. 수동 링크의 제목 캐시는 30일 후 기본 제목으로 돌아가요.' : '기억하기 쉬운 제목을 120자 이내로 적어 주세요.'}</p>
            {detectSource(url) === 'youtube' && <Button variant="secondary" icon="youtube" loading={fetching} onClick={() => void fetchTitle()}>YouTube에서 제목 불러오기</Button>}
          </div>

          <fieldset className="field filter-list">
            <legend className="field-label">분류</legend>
            {CATEGORIES.map(item => <button type="button" key={item.id} className={'filter-chip' + (category === item.id ? ' is-active' : '')} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</button>)}
          </fieldset>

          <button type="button" className="optional-toggle" aria-expanded={optionalOpen} aria-controls="optional-content-fields" onClick={() => setOptionalOpen(value => !value)}>
            <span><Icon name="edit" />장소와 메모 추가 <span className="muted">· 선택</span></span><Icon name="chevron-down" />
          </button>
          <div id="optional-content-fields" hidden={!optionalOpen}>
            <div className="field"><label className="field-label" htmlFor="content-place">장소 이름</label><input id="content-place" className="field-input" placeholder="예: 노들섬, 성수동 카페" value={placeName} onChange={event => setPlaceName(event.target.value)} maxLength={120} /></div>
            <div className="field"><label className="field-label" htmlFor="content-note">나의 메모</label><textarea id="content-note" className="field-input" placeholder="언제, 누구와 가고 싶은가요?" value={note} onChange={event => setNote(event.target.value)} maxLength={2000} rows={5} /></div>
          </div>
        </fieldset>
      </section>

      <aside className="panel form-summary">
        <p className="kicker">나만의 컬렉션</p><h2>{id ? '기억을 더해보세요' : '작은 취향부터 차곡차곡'}</h2>
        <p className="muted">장소와 일정은 자동으로 가져오지 않아요. 저장할 때 직접 확인해 주세요.</p>
        {loading && <Notice kind="info">저장함을 불러오는 중이에요. 입력한 내용은 유지되며 확인이 끝나면 저장할 수 있어요.</Notice>}
        {original?.importedFrom?.provider === 'youtube' && <Notice kind="info">YouTube에서 가져온 항목은 최초 확인부터 30일 후 항목·메모·분류·방문 표시가 함께 정리돼요. 수정해도 보관 기간은 늘어나지 않아요.</Notice>}
        {legacyNaver && <Notice kind="info">이전 네이버 검색 항목은 현재 수정할 수 없어요. 저장한 내용과 방문 상태는 상세 화면에서 확인할 수 있어요.</Notice>}
        {loadError && <><Notice kind="error">{loadError}</Notice><Button variant="secondary" onClick={retry}>다시 불러오기</Button></>}
        {message && <div ref={messageRef} tabIndex={-1}><Notice kind="error">{message}</Notice></div>}
        {duplicateId && <Link to={`/content/${encodeURIComponent(duplicateId)}`} className="text-link">이미 저장한 콘텐츠 보기 <Icon name="arrow-up-right" /></Link>}
        <div className="action-bar"><Button type="submit" icon="bookmark" loading={saving || submitting} disabled={loading || fetching || pasting || Boolean(loadError) || legacyNaver}>{id ? '수정 저장하기' : '저장하기'}</Button><Link to={id ? `/content/${encodeURIComponent(id)}` : '/'} className="button button-secondary">취소</Link></div>
        <p className="help-text">이 브라우저에 저장돼요. 저장에 실패하면 입력한 내용은 그대로 유지돼요.</p>
      </aside>
    </form>
  </>;
}

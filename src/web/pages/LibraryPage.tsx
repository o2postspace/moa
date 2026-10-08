import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { CATEGORIES, SOURCES, searchContent, type Category, type SourceType } from '../../domain/content';
import { Button, ContentCard, EmptyState, Icon, Notice, PageHeading } from '../components/Ui';
import { useLibrary } from '../library/LibraryProvider';

export function LibraryPage() {
  const { items, loading, error, retry } = useLibrary();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [source, setSource] = useState<SourceType | 'all'>('all');
  const [visitedOnly, setVisitedOnly] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const sourceRef = useRef<HTMLButtonElement>(null);
  const filtered = Boolean(query.trim()) || category !== 'all' || source !== 'all';
  const results = searchContent(items, { query, category, source }).filter(item => !visitedOnly || item.visited);
  const visitedCount = items.filter(item => item.visited).length;
  const sourceLabel = source === 'all' ? '모든 출처' : SOURCES.find(item => item.id === source)?.label;
  const reset = () => {
    setQuery(''); setCategory('all'); setSource('all'); setVisitedOnly(false); setSourcesOpen(false);
    searchRef.current?.focus();
  };
  const filteredEmpty = items.length > 0 || filtered || visitedOnly;
  const visitedEmpty = visitedOnly && !filtered;

  return <>
    <PageHeading className="library-heading" kicker="MY COLLECTION" title="저장한 취향" subtitle="좋아한 순간들을 한곳에. 필요할 때 다시 꺼내보세요."
      action={<Button icon="plus" disabled={loading || Boolean(error)} onClick={() => navigate('/add')}>링크 추가</Button>} />

    <Link to="/integrations" className="import-banner" aria-label="저장한 콘텐츠 가져오기">
      <span className="import-banner-icon"><Icon name="grid" /></span>
      <span><strong>흩어진 저장함 모아보기</strong><span className="muted">영상·게시물 링크 · 공개 재생목록 · 파일</span></span>
      <Icon name="arrow-up-right" />
    </Link>

    <section className="library-collection" aria-label="저장한 콘텐츠">
      <div className="collection-tabs" role="group" aria-label="콘텐츠 보기">
        <button type="button" className={!visitedOnly ? 'is-active' : ''} aria-pressed={!visitedOnly} onClick={() => setVisitedOnly(false)}>전체 저장 <span>{items.length}</span></button>
        <button type="button" className={visitedOnly ? 'is-active' : ''} aria-pressed={visitedOnly} onClick={() => setVisitedOnly(true)}>방문 완료 <span>{visitedCount}</span></button>
      </div>

      <div className="toolbar">
        <div className="search-field">
          <label className="sr-only" htmlFor="library-search">저장한 콘텐츠 검색</label>
          <Icon name="search" />
          <input id="library-search" ref={searchRef} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="제목·장소·메모 검색" />
          {query && <button type="button" className="icon-button" aria-label="검색어 지우기" onClick={() => { setQuery(''); searchRef.current?.focus(); }}><Icon name="x" /></button>}
        </div>
        <button type="button" ref={sourceRef} className="filter-chip source-filter" aria-expanded={sourcesOpen} aria-controls="library-source-filters" onClick={() => setSourcesOpen(value => !value)}>
          <Icon name="filter" />{sourceLabel}<Icon name="chevron-down" />
        </button>
      </div>

      <fieldset className="filter-list">
        <legend className="sr-only">분류 필터</legend>
        <button type="button" className={'filter-chip' + (category === 'all' ? ' is-active' : '')} aria-pressed={category === 'all'} onClick={() => setCategory('all')}>전체</button>
        {CATEGORIES.map(item => <button key={item.id} type="button" className={'filter-chip' + (category === item.id ? ' is-active' : '')} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</button>)}
      </fieldset>
      {sourcesOpen && <fieldset id="library-source-filters" className="filter-list source-filter-list">
        <legend className="sr-only">출처 필터</legend>
        <button type="button" className={'filter-chip' + (source === 'all' ? ' is-active' : '')} aria-pressed={source === 'all'} onClick={() => { setSource('all'); setSourcesOpen(false); sourceRef.current?.focus(); }}>모든 출처</button>
        {SOURCES.map(item => <button key={item.id} type="button" className={'filter-chip' + (source === item.id ? ' is-active' : '')} aria-pressed={source === item.id} onClick={() => { setSource(item.id); setSourcesOpen(false); sourceRef.current?.focus(); }}>{item.label}</button>)}
      </fieldset>}

      <div className="section-heading">
        <h2>{visitedOnly ? '방문한 콘텐츠' : '나의 콘텐츠'} <span className="muted">{results.length}</span></h2>
        {filtered && <Button variant="ghost" onClick={reset}>필터 초기화</Button>}
      </div>

      {loading ? <div className="loading-state" role="status"><Icon name="loader" /><span>저장함을 불러오는 중이에요.</span></div>
        : error ? <div className="panel"><Notice kind="error">{error}</Notice><Button variant="secondary" onClick={retry}>다시 불러오기</Button></div>
          : results.length ? <div className="content-grid">{results.map(item => <ContentCard key={item.id} item={item} />)}</div>
            : <EmptyState
              title={filteredEmpty ? visitedEmpty ? '아직 방문한 콘텐츠가 없어요' : '찾는 콘텐츠가 없어요' : '첫 링크를 모아볼까요?'}
              description={filteredEmpty ? visitedEmpty ? '다녀온 곳은 상세 화면에서 방문 완료로 표시해 보세요.' : '검색어나 선택한 필터를 바꿔 보세요.' : '마음에 든 링크 하나면 충분해요. 영상이나 게시물 링크를 붙여넣어 보세요.'}
              action={<Button variant={filteredEmpty ? 'secondary' : 'primary'} icon={filteredEmpty ? 'arrow-left' : 'plus'} onClick={filteredEmpty ? reset : () => navigate('/add')}>{filteredEmpty ? '전체 저장 보기' : '링크로 추가하기'}</Button>} />}
    </section>
    <p className="library-footer muted">이 브라우저에 저장되는 나만의 컬렉션</p>
  </>;
}

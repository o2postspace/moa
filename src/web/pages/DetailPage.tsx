import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { API_RETENTION_MS, CATEGORIES, displayContentTitle } from '../../domain/content';
import { InstagramEmbed } from '../components/InstagramEmbed';
import { InstagramAnalysis } from '../components/InstagramAnalysis';
import { Button, CategoryStamp, EmptyState, Icon, Notice, PageHeading, SourceBadge } from '../components/Ui';
import { naverMapUrl } from '../lib/maps';
import { useLibrary } from '../library/LibraryProvider';

function koreaDate(value: string | number) {
  return new Date(value).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' });
}

export function DetailPage() {
  const { id } = useParams<{ id: string }>();
  return <ContentDetail key={id ?? 'missing'} id={id} />;
}

function ContentDetail({ id }: { id?: string }) {
  const { items, loading, saving, error: libraryError, retry, toggleVisited } = useLibrary();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);
  const item = items.find(content => content.id === id);
  const canEdit = Boolean(item && !item.place && item.importedFrom?.provider !== 'naver');
  const markVisited = async () => {
    if (!item || lock.current || saving || libraryError) return;
    lock.current = true; setBusy(true); setError(''); setMessage('');
    try {
      await toggleVisited(item.id);
      if (!active.current) return;
      setMessage(item.visited ? '방문 완료 표시를 취소했어요.' : '방문 완료로 표시했어요.');
    } catch (error) { if (active.current) setError(error instanceof Error ? error.message : '방문 상태를 저장하지 못했어요. 다시 시도해 주세요.'); }
    finally { lock.current = false; if (active.current) setBusy(false); }
  };

  return <>
    <PageHeading title="저장한 콘텐츠" backTo="/" action={item && canEdit && !loading && <Link to={`/add?id=${encodeURIComponent(item.id)}`} className="button button-secondary"><Icon name="edit" />내용 수정</Link>} />
    {loading ? <div className="loading-state" role="status"><Icon name="loader" /><span>저장함을 불러오는 중이에요.</span></div>
      : !item ? libraryError ? <div className="panel"><Notice kind="error">{libraryError}</Notice><Button variant="secondary" onClick={retry}>다시 불러오기</Button></div> : <EmptyState title="콘텐츠를 찾을 수 없어요" description="저장함에서 다시 선택해 주세요." action={<Link to="/" className="button button-primary">저장함으로</Link>} />
        : <div className="detail-grid">
          <section className="panel detail-hero" aria-label="콘텐츠 정보">
            <CategoryStamp category={item.category} visited={item.visited} large />
            <p className="kicker">MY SAVED MOMENT</p>
            <h2>{displayContentTitle(item)}</h2>
            <div className="detail-meta"><SourceBadge source={item.source} /><span className="muted">{CATEGORIES.find(category => category.id === item.category)?.label}</span></div>
            {item.visited && <p className="visited-label"><Icon name="check-circle" />방문 완료</p>}
            <div className="action-bar">
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="button button-primary"><Icon name="arrow-up-right" />원본 보기</a>
              <Button variant="secondary" icon={item.visited ? 'check-circle' : 'check'} onClick={() => void markVisited()} loading={saving || busy} disabled={Boolean(libraryError)}>{item.visited ? '방문 완료 취소' : '방문 완료로 표시'}</Button>
            </div>
            {error && <Notice kind="error">{error}</Notice>}
            {message && <Notice kind="success">{message}</Notice>}
            {libraryError && <><Notice kind="error">{libraryError}</Notice><Button variant="secondary" onClick={retry}>다시 불러오기</Button></>}
          </section>

          <div className="detail-panels">
            <section className="panel detail-panel">
              <div className="section-heading"><h2><Icon name="map-pin" />저장한 장소</h2></div>
              <p className="place-title">{item.placeName || '장소 미등록'}</p>
              <p className="muted">{item.place ? item.place.address : item.placeName ? '직접 적은 장소예요. 방문 전 위치를 확인해 주세요.' : '장소 이름을 추가하면 지도에서 찾아볼 수 있어요.'}</p>
              {item.placeName && <a href={naverMapUrl(item.placeName, item.place?.address, item.place)} target="_blank" rel="noopener noreferrer" className="button button-secondary"><Icon name="map-pin" />{item.place ? '네이버 지도에서 보기' : '네이버 지도에서 장소 확인'}</a>}
            </section>
            <section className="panel detail-panel">
              <h2>나의 메모</h2>
              <p className={'detail-note' + (!item.note ? ' muted' : '')}>{item.note || '저장한 이유를 적어보세요.\n나중의 내가 더 쉽게 기억할 수 있어요.'}</p>
              {canEdit && <Link to={`/add?id=${encodeURIComponent(item.id)}`} className="text-link">메모 수정하기 <Icon name="edit" /></Link>}
            </section>
            {item.source === 'instagram' && <InstagramEmbed key={item.url} url={item.url} />}
            {item.source === 'instagram' && <InstagramAnalysis url={item.url} contentId={item.id} />}
            <section className="panel detail-panel origin-panel">
              <h2>원본 링크</h2><a href={item.url} target="_blank" rel="noopener noreferrer" className="original-url">{item.url}</a>
              <p className="help-text"><Icon name="calendar" />{koreaDate(item.createdAt)} 저장</p>
              {item.external && <p className="help-text">YouTube 제공 · 제목을 수정하면 내가 적은 제목으로 저장돼요.</p>}
              {item.importedFrom?.provider === 'youtube' && <Notice kind="info">YouTube에서 가져온 항목 · {koreaDate(Date.parse(item.importedFrom.fetchedAt) + API_RETENTION_MS)}까지 보관해요. 기간이 지나면 앱을 사용할 때 항목과 메모·분류·방문 표시가 함께 정리돼요.</Notice>}
              {item.importedFrom?.provider === 'naver' && <p className="help-text">이전 네이버 API에서 가져온 항목이에요. 현재 신규 연동과 항목 수정은 보류되어 있어요.</p>}
            </section>
          </div>
        </div>}
  </>;
}

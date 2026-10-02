import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type PropsWithChildren } from 'react';
import { Link, useSearchParams } from 'react-router';
import { detectSource, normalizeUrl, type DraftInput } from '../../domain/content';
import { parseImportCandidates } from '../../domain/imports';
import { Button, Icon, Notice, PageHeading, SourceBadge, type IconName } from '../components/Ui';
import { useLibrary } from '../library/LibraryProvider';
import { integrationsApi, IntegrationError, youtubeAuthorizationUrl, type IntegrationStatus, type Playlist } from '../lib/api';
import { readImportFile } from '../lib/readImportFile';

type Candidate = { url: string; title: string; draft: DraftInput };
type ImportMode = 'account' | 'public' | 'file';

export function IntegrationsPage() {
  const [params] = useSearchParams();
  const { items, importMany, removeAccountImports, saving, loading, error: libraryError, retry } = useLibrary();
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const active = useRef(true);
  const statusVersion = useRef(0);
  const [publicUrl, setPublicUrl] = useState('');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistToken, setPlaylistToken] = useState<string>();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<ImportMode>('file');
  const [playlistId, setPlaylistId] = useState('');
  const [loadedUrl, setLoadedUrl] = useState('');
  const [nextToken, setNextToken] = useState<string>();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const savedUrls = useMemo(() => new Set(items.map(item => normalizeUrl(item.url))), [items]);
  const selectedCandidates = candidates.filter(item => selected.has(item.url) && !savedUrls.has(item.url));
  const eligibleCandidates = candidates.filter(item => !savedUrls.has(item.url));
  const selectionDisabled = busy || saving || loading || Boolean(libraryError);
  const controlsDisabled = busy || saving;

  const refresh = useCallback(async () => {
    const version = ++statusVersion.current;
    if (active.current) setCheckingStatus(true);
    try {
      const value = await integrationsApi.status();
      if (active.current && version === statusVersion.current) setStatus(value);
    } catch (err) {
      if (active.current && version === statusVersion.current) throw err;
    } finally {
      if (active.current && version === statusVersion.current) setCheckingStatus(false);
    }
  }, []);

  useEffect(() => {
    active.current = true;
    void refresh().catch(err => {
      if (active.current) setError(err instanceof Error ? err.message : '연결 상태를 확인하지 못했어요.');
    });
    return () => { active.current = false; statusVersion.current += 1; };
  }, [refresh]);

  const run = async (action: () => Promise<void>) => {
    if (lock.current || saving) return;
    lock.current = true; setBusy(true); setError(''); setMessage('');
    try { await action(); }
    catch (err) {
      if (!active.current) return;
      setError(err instanceof Error ? err.message : '요청을 완료하지 못했어요.');
      if (err instanceof IntegrationError && err.status === 401) {
        setPlaylists([]); setPlaylistToken(undefined);
        if (mode === 'account') { setCandidates([]); setSelected(new Set()); setNextToken(undefined); }
        await refresh().catch(() => { if (active.current) setStatus(null); });
      }
    } finally {
      lock.current = false;
      if (active.current) setBusy(false);
    }
  };

  const preview = (next: Candidate[], nextMode: ImportMode, append = false) => {
    const normalized = next.map(item => ({ ...item, url: normalizeUrl(item.url) }));
    const previousUrls = new Set(append ? candidates.map(item => item.url) : []);
    const merged = append ? [...candidates, ...normalized] : normalized;
    const unique = [...new Map(merged.map(item => [item.url, item])).values()].slice(0, 200);
    if (!active.current) return;
    setCandidates(unique); setMode(nextMode);
    setSelected(previous => new Set([
      ...(append ? previous : []),
      ...normalized.filter(item => !savedUrls.has(item.url) && !previousUrls.has(item.url)).map(item => item.url),
    ].filter(url => unique.some(item => item.url === url))));
    if (!unique.length) setMessage('가져올 콘텐츠가 없어요. 다른 파일이나 재생목록을 선택해 주세요.');
  };

  const fetchVideos = async (kind: 'account' | 'public', idOrUrl: string, token?: string) => {
    const connectionId = status?.youtube.connectionId;
    if (kind === 'account' && !connectionId) throw new Error('YouTube 연결 상태를 다시 확인해 주세요.');
    const page = kind === 'account' ? await integrationsApi.videos(idOrUrl, token) : await integrationsApi.publicPlaylist(idOrUrl, token);
    if (!active.current) return;
    const next: Candidate[] = page.items.map(video => ({ url: video.url, title: video.title, draft: {
      url: video.url, title: '저장한 YouTube 영상', category: 'other', titleMode: 'external',
      external: { provider: 'youtube', title: video.title, authorName: video.authorName, fetchedAt: page.fetchedAt },
      importedFrom: { provider: 'youtube', method: kind === 'account' ? 'account-playlist' : 'public-playlist', fetchedAt: page.fetchedAt, ...(kind === 'account' ? { connectionId } : {}) },
    } }));
    preview(next, kind, Boolean(token));
    setNextToken(page.nextPageToken);
    setPlaylistId(kind === 'account' ? idOrUrl : '');
    setLoadedUrl(kind === 'public' ? idOrUrl : '');
  };

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    // Reset the DOM value so the same file can be selected after a failure.
    event.currentTarget.value = '';
    if (!file) return;
    void run(async () => {
      const input = await readImportFile(file);
      const result = parseImportCandidates(input.text, input.format);
      if (!active.current) return;
      preview(result.items.map(item => ({ ...item, draft: { ...item, category: 'other' } })), 'file');
      setNextToken(undefined); setPlaylistId(''); setLoadedUrl('');
      setMessage(`링크 후보 ${result.items.length}개 · 파일 안 중복 ${result.duplicates}개 · 제외 ${result.unsupported}개`);
    });
  };

  const disconnect = async () => {
    if (!status?.youtube.connectionId) throw new Error('연결 상태를 다시 확인해 주세요.');
    // One connected-account MVP: remove every private import from this device
    // before revocation, including records from previous server sessions.
    const removed = await removeAccountImports();
    if (active.current) {
      setPlaylists([]); setPlaylistToken(undefined); setCandidates([]); setSelected(new Set()); setNextToken(undefined);
      setMessage(`계정 연결로 가져온 ${removed}개 항목을 삭제했어요. 연결 해제를 완료하는 중이에요.`);
    }
    await integrationsApi.disconnectYouTube();
    if (!active.current) return;
    setStatus(previous => previous ? { ...previous, youtube: { ...previous.youtube, connected: false, connectionId: undefined } } : previous);
    setConfirmDisconnect(false);
    setMessage(`연결을 해제하고 계정에서 가져온 ${removed}개 항목을 삭제했어요.`);
  };

  const openAccount = async () => {
    if (status?.youtube.connected) {
      const page = await integrationsApi.playlists();
      if (!active.current) return;
      setPlaylists(page.items); setPlaylistToken(page.nextPageToken);
      if (!page.items.length) setMessage('가져올 수 있는 재생목록이 없어요.');
    } else {
      const result = await integrationsApi.connectYouTube();
      if (active.current) window.location.assign(youtubeAuthorizationUrl(result.authorizationUrl));
    }
  };

  const saveSelected = async () => {
    if (selectionDisabled || !selectedCandidates.length) return;
    const result = await importMany(selectedCandidates.map(item => item.draft));
    if (!active.current) return;
    setCandidates([]); setSelected(new Set()); setNextToken(undefined);
    setMessage(`${result.added}개를 저장했어요. 중복 ${result.duplicates}개는 제외했어요.`);
  };

  const youtubeResult = params.get('youtube');
  const callbackSuccess = youtubeResult === 'connected' && status?.youtube.connected;

  return <>
    <PageHeading kicker="BRING YOUR FAVORITES" title="흩어진 취향을 한곳으로." subtitle="링크나 파일로 가져오고, 저장할 콘텐츠는 직접 골라보세요." backTo="/"
      action={<Button variant="secondary" loading={busy || checkingStatus} disabled={saving} onClick={() => void run(refresh)}>연결 상태 다시 확인</Button>} />
    {error && <Notice kind="error">{error}</Notice>}
    {libraryError && <div className="panel"><Notice kind="error">{libraryError}</Notice><Button variant="secondary" disabled={controlsDisabled} onClick={retry}>저장함 다시 불러오기</Button></div>}
    {(message || callbackSuccess) && <Notice kind="success">{message || 'YouTube를 연결했어요. 가져올 재생목록을 선택해 주세요.'}</Notice>}
    {youtubeResult && youtubeResult !== 'connected' && <Notice kind="error">YouTube 연결을 완료하지 못했어요. 다시 시도해 주세요.</Notice>}

    <div className="service-grid">
      <ServiceCard name="YouTube" icon="youtube" state={checkingStatus ? '연결 상태 확인 중' : status?.youtube.connected ? '계정 연결됨' : status?.youtube.oauthConfigured ? '계정 연결 가능' : status?.youtube.playlistConfigured ? '공개 재생목록으로 시작' : '영상 링크로 시작'}>
        <p className="muted">영상 링크를 추가하거나 공개 재생목록에서 필요한 영상을 골라 가져오세요.</p>
        <Link to="/add" className="button button-secondary"><Icon name="link" />영상 링크 추가·제목 불러오기</Link>
        {status?.youtube.oauthConfigured && <>
          <p className="help-text">계정을 연결하면 내 재생목록도 선택할 수 있어요. ‘나중에 볼 동영상’은 지원되지 않아요.</p>
          <Button variant="secondary" icon="youtube" disabled={controlsDisabled} onClick={() => void run(openAccount)}>{status.youtube.connected ? '내 재생목록 보기' : 'YouTube 계정 연결'}</Button>
          {!!playlists.length && <div className="playlist-list" aria-label="내 YouTube 재생목록">{playlists.map(playlist => <Button key={playlist.id} variant="secondary" disabled={controlsDisabled} onClick={() => void run(() => fetchVideos('account', playlist.id))}>{playlist.title} · {playlist.itemCount}개</Button>)}</div>}
          {playlistToken && <Button variant="ghost" disabled={controlsDisabled} onClick={() => void run(async () => {
            const page = await integrationsApi.playlists(playlistToken);
            if (!active.current) return;
            setPlaylists(previous => [...new Map([...previous, ...page.items].map(item => [item.id, item])).values()]);
            setPlaylistToken(page.nextPageToken);
          })}>재생목록 더 보기</Button>}
        </>}
        {status?.youtube.playlistConfigured && <form onSubmit={event => { event.preventDefault(); if (publicUrl.trim()) void run(() => fetchVideos('public', publicUrl.trim())); }}>
          <label className="field" htmlFor="public-playlist"><span>공개 YouTube 재생목록 링크</span><input id="public-playlist" className="field-input" type="url" value={publicUrl} onChange={event => setPublicUrl(event.target.value)} placeholder="공개 재생목록 링크 붙여넣기" autoCapitalize="none" autoCorrect="off" spellCheck={false} disabled={controlsDisabled} /></label>
          <Button type="submit" variant="secondary" icon="import" disabled={!publicUrl.trim() || controlsDisabled}>공개 재생목록 불러오기</Button>
        </form>}
        {status?.youtube.connected && !confirmDisconnect && <Button variant="ghost" disabled={controlsDisabled} onClick={() => setConfirmDisconnect(true)}>YouTube 연결 해제</Button>}
        {status?.youtube.connected && confirmDisconnect && <div className="disconnect-confirm">
          <Notice kind="info">이 기기에서 계정 연결로 가져온 모든 항목과 메모를 삭제해요. 직접 추가한 링크와 공개 재생목록 항목은 유지돼요.</Notice>
          <div className="button-row"><Button loading={busy} disabled={saving || loading || Boolean(libraryError)} onClick={() => void run(disconnect)}>연결 해제·가져온 항목 삭제</Button><Button variant="secondary" disabled={controlsDisabled} onClick={() => setConfirmDisconnect(false)}>취소</Button></div>
        </div>}
      </ServiceCard>

      <ServiceCard name="Instagram" icon="instagram" state="공개 게시물 원문 보기">
        <p className="muted">링크를 저장하면 상세 화면에서 공개 게시물을 볼 수 있어요. 개인 저장함을 자동으로 가져오는 API는 제공되지 않아요.</p>
        <Link to="/add" className="button button-secondary"><Icon name="link" />Instagram 링크 추가</Link>
      </ServiceCard>

      <ServiceCard name="파일에서 가져오기" icon="file" state="확인 후 한 번에 저장">
        <p className="muted">JSON 또는 TXT 파일에서 링크 후보를 찾아드려요. 압축을 푼 저장 콘텐츠 파일을 선택하고, 가져올 항목을 확인해 주세요.</p>
        <label className="field" htmlFor="import-file"><span>가져올 파일 선택</span><input id="import-file" className="field-input file-input" type="file" accept=".json,.txt,application/json,text/plain" onChange={chooseFile} disabled={controlsDisabled} aria-describedby="import-file-help" /></label>
        <p id="import-file-help" className="help-text">UTF-8 JSON·TXT · 최대 2MiB · 한 번에 최대 200개. 원본 파일을 서버에 업로드하지 않아요.</p>
      </ServiceCard>
    </div>

    {!!candidates.length && <section className="import-preview panel" aria-labelledby="import-preview-title" aria-busy={busy || saving}>
      <div className="selection-bar"><div><p className="kicker">REVIEW YOUR IMPORT</p><h2 id="import-preview-title">가져올 콘텐츠 · {selectedCandidates.length}개</h2><p className="help-text">저장할 링크를 직접 선택해 주세요. 이미 저장한 링크는 제외돼요.</p></div><div className="button-row">
        <button type="button" className="filter-chip" aria-pressed={eligibleCandidates.length > 0 && selectedCandidates.length === eligibleCandidates.length} disabled={selectionDisabled || !eligibleCandidates.length} onClick={() => setSelected(new Set(eligibleCandidates.map(item => item.url)))}>전체 선택</button>
        <button type="button" className="filter-chip" aria-pressed={!selectedCandidates.length} disabled={selectionDisabled || !selectedCandidates.length} onClick={() => setSelected(new Set())}>선택 해제</button>
      </div></div>
      <ul className="candidate-list">{candidates.map(item => {
        const duplicate = savedUrls.has(item.url);
        return <li key={item.url}><label className={`candidate-row${duplicate ? ' is-duplicate' : ''}`}>
          <input type="checkbox" checked={selected.has(item.url) && !duplicate} disabled={duplicate || selectionDisabled} onChange={() => setSelected(previous => { const next = new Set(previous); if (next.has(item.url)) next.delete(item.url); else next.add(item.url); return next; })} />
          <span className="candidate-details"><strong>{item.title}</strong><span className="help-text">{duplicate ? '이미 저장한 링크예요' : item.url}</span></span><SourceBadge source={detectSource(item.url)} />
        </label></li>;
      })}</ul>
      {nextToken && mode !== 'file' && candidates.length < 200 && <Button variant="secondary" disabled={controlsDisabled} onClick={() => void run(() => fetchVideos(mode === 'account' ? 'account' : 'public', mode === 'account' ? playlistId : loadedUrl, nextToken))}>동영상 더 불러오기</Button>}
      {nextToken && candidates.length >= 200 && <p className="help-text">한 번에 최대 200개까지 확인할 수 있어요. 저장 후 다른 재생목록이나 파일을 가져와 주세요.</p>}
      {mode !== 'file' && <Notice kind="info">YouTube에서 가져온 항목은 최초 확인부터 30일 동안 보관돼요. 기간이 지나면 앱을 사용할 때 항목과 메모·분류·방문 표시가 함께 정리되니 재생목록에서 다시 가져와 주세요. 계정 연결 해제 시 이 기기의 계정 연결로 가져온 모든 항목과 메모도 삭제돼요.</Notice>}
      <div className="button-row"><Button icon="bookmark" loading={saving || busy} disabled={!selectedCandidates.length || selectionDisabled} onClick={() => void run(saveSelected)}>{selectedCandidates.length}개 저장하기</Button><Link to="/" className="button button-secondary">저장함 보기</Link></div>
    </section>}

    <div className="button-row"><Link to="/add" className="text-link"><Icon name="plus" />링크 직접 추가</Link></div>
  </>;
}

function ServiceCard({ name, icon, state, children }: PropsWithChildren<{ name: string; icon: IconName; state: string }>) {
  return <section className="service-card"><div className="service-heading"><Icon name={icon} /><h2>{name}</h2></div><span className="service-state">{state}</span>{children}</section>;
}

export default IntegrationsPage;

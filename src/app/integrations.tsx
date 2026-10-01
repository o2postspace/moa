import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, ScreenHeader } from '../components/Screen';
import { UiText } from '../components/UiText';
import { PrimaryButton } from '../components/PrimaryButton';
import { FilterChip } from '../components/FilterChip';
import { normalizeUrl, type DraftInput } from '../domain/content';
import { parseImportCandidates } from '../domain/imports';
import { useLibrary } from '../features/library/LibraryProvider';
import { integrationsApi, IntegrationError, type IntegrationStatus, type Playlist, type VideoCandidate } from '../features/integrations/api';
import { readImportFile } from '../features/integrations/readImportFile';
import { tokens } from '../theme/tokens';

type Candidate = { url: string; title: string; draft: DraftInput };
export default function IntegrationsScreen() {
  const { youtube } = useLocalSearchParams<{ youtube?: string }>();
  const { items, importMany, removeAccountImports, saving, loading, error: libraryError } = useLibrary();
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [publicUrl, setPublicUrl] = useState('');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistToken, setPlaylistToken] = useState<string>();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<'account' | 'public' | 'file'>('file');
  const [playlistId, setPlaylistId] = useState('');
  const [loadedUrl, setLoadedUrl] = useState('');
  const [nextToken, setNextToken] = useState<string>();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const savedUrls = new Set(items.map(item => normalizeUrl(item.url)));
  const selectedCandidates = candidates.filter(item => selected.has(item.url) && !savedUrls.has(item.url));
  const refresh = useCallback(async () => { setStatus(await integrationsApi.status()); }, []);
  useEffect(() => { let active = true; integrationsApi.status().then(value => { if (active) setStatus(value); }).catch(err => { if (active) setError(err.message); }); return () => { active = false; }; }, []);

  const run = async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setMessage('');
    try { await action(); } catch (err) {
      setError(err instanceof Error ? err.message : '요청을 완료하지 못했어요.');
      if (err instanceof IntegrationError && err.status === 401) { setPlaylists([]); setPlaylistToken(undefined); if (mode === 'account') { setCandidates([]); setSelected(new Set()); setNextToken(undefined); } await refresh().catch(() => setStatus(null)); }
    }
    finally { lock.current = false; setBusy(false); }
  };
  const preview = (next: Candidate[], nextMode: typeof mode, append = false) => {
    const merged = append ? [...candidates, ...next] : next;
    const unique = [...new Map(merged.map(item => [normalizeUrl(item.url), { ...item, url: normalizeUrl(item.url) }])).values()].slice(0, 200);
    setCandidates(unique); setMode(nextMode);
    setSelected(previous => new Set([...append ? previous : [], ...next.filter(item => !savedUrls.has(normalizeUrl(item.url))).map(item => normalizeUrl(item.url))]));
    if (!unique.length) setMessage('가져올 콘텐츠가 없어요. 다른 파일이나 재생목록을 선택해 주세요.');
  };
  const fetchVideos = async (kind: 'account' | 'public', idOrUrl: string, token?: string) => {
    const page = kind === 'account' ? await integrationsApi.videos(idOrUrl, token) : await integrationsApi.publicPlaylist(idOrUrl, token);
    if (kind === 'account' && !status?.youtube.connectionId) throw new Error('유튜브 연결을 다시 확인해 주세요.');
    const next: Candidate[] = page.items.map((video: VideoCandidate) => ({ url: video.url, title: video.title, draft: {
      url: video.url, title: '저장한 YouTube 영상', category: 'other', titleMode: 'external',
      external: { provider: 'youtube', title: video.title, authorName: video.authorName, fetchedAt: page.fetchedAt },
      importedFrom: { provider: 'youtube', method: kind === 'account' ? 'account-playlist' : 'public-playlist', fetchedAt: page.fetchedAt, ...(kind === 'account' ? { connectionId: status!.youtube.connectionId } : {}) },
    } }));
    preview(next, kind, Boolean(token)); setNextToken(page.nextPageToken); setPlaylistId(kind === 'account' ? idOrUrl : ''); setLoadedUrl(kind === 'public' ? idOrUrl : '');
  };
  const disconnect = async () => {
    const connectionId = status?.youtube.connectionId;
    if (!connectionId) throw new Error('연결 상태를 다시 확인해 주세요.');
    const removed = await removeAccountImports();
    setPlaylists([]); setCandidates([]); setNextToken(undefined);
    setMessage(`계정 연결로 가져온 ${removed}개 항목을 삭제했어요. 연결 해제를 완료하는 중이에요.`);
    await integrationsApi.disconnectYouTube();
    setStatus(previous => previous ? { ...previous, youtube: { ...previous.youtube, connected: false, connectionId: undefined } } : previous);
    setConfirmDisconnect(false);
    setMessage(`연결을 해제하고 계정에서 가져온 ${removed}개 항목을 삭제했어요.`);
  };

  return <Screen><ScreenHeader title="서비스 연결" /><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <View style={styles.intro}><UiText variant="hero">{'흩어진 취향을\n한곳으로.'}</UiText><UiText muted style={styles.description}>필요한 서비스만 연결하고, 가져올 콘텐츠는 직접 골라보세요.</UiText></View>
    {Platform.OS !== 'web' && <UiText variant="caption" muted>서비스 연동은 현재 웹 개발 미리보기에서 확인할 수 있어요. 모바일 계정 연결은 다음 단계에서 제공할 예정이에요.</UiText>}
    {error || libraryError ? <UiText accessibilityRole="alert" style={styles.error}>{error || libraryError}</UiText> : null}
    {message || (youtube === 'connected' && status?.youtube.connected) ? <UiText accessibilityLiveRegion="polite" style={styles.message}>{message || '유튜브를 연결했어요. 가져올 재생목록을 선택해 주세요.'}</UiText> : null}
    {youtube && youtube !== 'connected' && <UiText accessibilityRole="alert" style={styles.error}>유튜브 연결을 완료하지 못했어요. 다시 시도해 주세요.</UiText>}
    {!status && <PrimaryButton label="연결 상태 다시 확인" secondary loading={busy} onPress={() => run(refresh)} />}
    <ServiceCard name="YouTube" icon="logo-youtube" state={status?.youtube.connected ? '계정 연결됨' : status?.youtube.oauthConfigured ? '계정 연결 가능' : '영상 링크로 시작'}>
      <UiText muted>내 재생목록을 골라서 가져오세요. ‘나중에 볼 동영상’은 유튜브에서 공개 API를 제공하지 않아요.</UiText>
      <PrimaryButton label="영상 링크 추가·제목 불러오기" secondary icon="link-outline" onPress={() => router.push('/add')} />
      {Platform.OS === 'web' ? <PrimaryButton label={status?.youtube.connected ? '내 재생목록 보기' : 'YouTube 계정 연결'} disabled={!status?.youtube.oauthConfigured || busy} secondary onPress={() => run(async () => {
        if (status?.youtube.connected) { const page = await integrationsApi.playlists(); setPlaylists(page.items); setPlaylistToken(page.nextPageToken); if (!page.items.length) setMessage('가져올 수 있는 재생목록이 없어요.'); }
        else { const result = await integrationsApi.connectYouTube(); const destination = new URL(result.authorizationUrl); if (destination.protocol !== 'https:' || destination.hostname !== 'accounts.google.com') throw new Error('유튜브 로그인 주소를 확인하지 못했어요.'); window.location.assign(destination.href); }
      })} /> : <UiText variant="caption" muted>계정 연결은 현재 웹 미리보기에서 사용할 수 있어요.</UiText>}
      {!status?.youtube.oauthConfigured && <UiText variant="caption" muted>계정 연결을 준비 중이에요. 지금은 영상 링크를 추가해 제목을 불러올 수 있어요.</UiText>}
      {playlists.map(playlist => <PrimaryButton key={playlist.id} label={`${playlist.title} · ${playlist.itemCount}개`} secondary disabled={busy} onPress={() => run(() => fetchVideos('account', playlist.id))} />)}
      {playlistToken && <PrimaryButton label="재생목록 더 보기" secondary disabled={busy} onPress={() => run(async () => { const page = await integrationsApi.playlists(playlistToken); setPlaylists(previous => [...new Map([...previous, ...page.items].map(item => [item.id, item])).values()]); setPlaylistToken(page.nextPageToken); })} />}
      <TextInput accessibilityLabel="공개 YouTube 재생목록 링크" placeholder="공개 재생목록 링크 붙여넣기" value={publicUrl} onChangeText={setPublicUrl} autoCapitalize="none" autoCorrect={false} style={styles.input} placeholderTextColor={tokens.color.secondary} />
      <PrimaryButton label="공개 재생목록 불러오기" disabled={!publicUrl.trim() || !status?.youtube.playlistConfigured || busy} secondary onPress={() => run(() => fetchVideos('public', publicUrl.trim()))} />
      {!status?.youtube.playlistConfigured && <UiText variant="caption" muted>공개 재생목록 가져오기를 준비 중이에요. 지금은 개별 영상 링크를 추가해 주세요.</UiText>}
      {status?.youtube.connected && !confirmDisconnect && <PrimaryButton label="YouTube 연결 해제" secondary disabled={busy} onPress={() => setConfirmDisconnect(true)} />}
      {confirmDisconnect && <View style={styles.confirm}><UiText variant="caption">이 기기에서 계정 연결로 가져온 모든 항목과 메모를 삭제해요. 직접 추가한 링크와 공개 재생목록 항목은 유지돼요.</UiText><PrimaryButton label="연결 해제·가져온 항목 삭제" onPress={() => run(disconnect)} loading={busy} disabled={saving || loading || Boolean(libraryError)} /><PrimaryButton label="취소" secondary disabled={busy} onPress={() => setConfirmDisconnect(false)} /></View>}
    </ServiceCard>
    <ServiceCard name="Instagram" icon="logo-instagram" state="공개 게시물 원문 보기">
      <UiText muted>링크를 저장하면 상세 화면에서 공개 게시물을 볼 수 있어요. 개인 저장함을 자동으로 가져오는 API는 제공되지 않아요.</UiText>
      <PrimaryButton label="Instagram 링크 추가" secondary icon="link-outline" onPress={() => router.push('/add')} />
    </ServiceCard>
    <ServiceCard name="네이버 지도" icon="map-outline" state={status?.naver.searchConfigured ? '장소 검색 설정됨' : '지도 링크로 시작'}>
      <UiText muted>장소를 검색해 주소와 좌표를 함께 저장하고, 네이버 지도로 바로 열어보세요.</UiText>
      <PrimaryButton label="장소 검색하고 저장" secondary disabled={!status?.naver.searchConfigured || busy} onPress={() => router.push('/places')} />
      <PrimaryButton label="저장한 지도 링크 추가" secondary onPress={() => router.push('/add')} />
      <UiText variant="caption" muted>네이버 지도 개인 저장 목록의 자동 동기화는 지원되지 않아요.</UiText>
    </ServiceCard>
    <ServiceCard name="파일에서 가져오기" icon="documents-outline" state="확인 후 한 번에 저장">
      <UiText muted>JSON 또는 TXT 파일에서 링크 후보를 찾아드려요. 압축을 푼 저장 콘텐츠 파일을 선택하고, 가져올 항목을 확인해 주세요.</UiText>
      <PrimaryButton label="가져올 파일 선택" secondary loading={busy} onPress={() => run(async () => { const file = await readImportFile(); if (!file) return; const result = parseImportCandidates(file.text, file.format); preview(result.items.map(item => ({ ...item, draft: { ...item, category: 'other' } })), 'file'); setNextToken(undefined); setMessage(`링크 후보 ${result.items.length}개 · 중복 ${result.duplicates}개 · 제외 ${result.unsupported}개`); })} />
      <UiText variant="caption" muted>2MB · 한 번에 최대 200개 · 지원 파일 형식은 계속 늘려갈게요.</UiText>
    </ServiceCard>
    {!!candidates.length && <View style={styles.preview}>
      <UiText variant="subtitle" style={styles.bold}>가져올 콘텐츠 · {selectedCandidates.length}개</UiText>
      <View style={styles.selection}><FilterChip label="전체 선택" selected={selectedCandidates.length === candidates.filter(item => !savedUrls.has(item.url)).length} onPress={() => setSelected(new Set(candidates.filter(item => !savedUrls.has(item.url)).map(item => item.url)))} /><FilterChip label="선택 해제" selected={!selectedCandidates.length} onPress={() => setSelected(new Set())} /></View>
      {candidates.map(item => { const duplicate = savedUrls.has(item.url); return <Pressable key={item.url} accessibilityRole="checkbox" accessibilityLabel={item.title + (duplicate ? ', 이미 저장됨' : '')} accessibilityState={{ checked: selected.has(item.url) && !duplicate, disabled: duplicate }} disabled={duplicate || busy || saving} onPress={() => setSelected(previous => { const next = new Set(previous); if (next.has(item.url)) next.delete(item.url); else next.add(item.url); return next; })} style={[styles.candidate, duplicate && { opacity: 0.5 }]}><Ionicons name={selected.has(item.url) && !duplicate ? 'checkbox' : 'square-outline'} color={tokens.color.accent} size={23} /><View style={styles.candidateText}><UiText numberOfLines={2}>{item.title}</UiText><UiText variant="caption" muted numberOfLines={1}>{duplicate ? '이미 저장한 링크예요' : item.url}</UiText></View></Pressable>; })}
      {nextToken && candidates.length < 200 && <PrimaryButton label="동영상 더 불러오기" secondary disabled={busy} onPress={() => run(() => fetchVideos(mode === 'account' ? 'account' : 'public', mode === 'account' ? playlistId : loadedUrl, nextToken))} />}
      {mode !== 'file' && <UiText variant="caption" muted>YouTube에서 가져온 항목은 30일 동안 보관돼요. 기간이 지나면 앱을 사용할 때 정리되니 재생목록에서 다시 가져와 주세요. 연결 해제 시 이 기기의 계정 연결로 가져온 모든 항목과 메모도 삭제돼요.</UiText>}
      <PrimaryButton label={`${selectedCandidates.length}개 저장하기`} disabled={!selectedCandidates.length || busy || loading || Boolean(libraryError)} loading={saving} onPress={() => run(async () => { const result = await importMany(selectedCandidates.map(item => item.draft)); setCandidates([]); setSelected(new Set()); setNextToken(undefined); setMessage(`${result.added}개를 저장했어요. 중복 ${result.duplicates}개는 제외했어요.`); })} />
    </View>}
    <PrimaryButton label="영상·장소 링크 직접 추가" secondary onPress={() => router.push('/add')} />
  </ScrollView></Screen>;
}
function ServiceCard({ name, icon, state, children }: React.PropsWithChildren<{ name: string; icon: keyof typeof Ionicons.glyphMap; state: string }>) {
  return <View style={styles.service}><View style={styles.cardHeading}><Ionicons name={icon} size={24} color={tokens.color.accent} /><UiText variant="subtitle" style={styles.bold}>{name}</UiText></View><UiText variant="caption" style={styles.state}>{state}</UiText>{children}</View>;
}
const styles = StyleSheet.create({
  page: { padding: tokens.spacing.xl, paddingTop: tokens.spacing.sm, gap: tokens.spacing.lg },
  intro: { paddingBottom: tokens.spacing.md }, description: { marginTop: tokens.spacing.md },
  service: { padding: tokens.spacing.lg, backgroundColor: tokens.color.surfaceMuted, borderRadius: tokens.radius.lg, gap: tokens.spacing.md },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm }, bold: { fontFamily: tokens.font.bold },
  state: { color: tokens.color.accentInk },
  input: { minHeight: tokens.control.height, borderRadius: tokens.radius.md, padding: tokens.spacing.md, backgroundColor: tokens.color.surface, color: tokens.color.ink, fontFamily: tokens.font.regular, fontSize: 14 },
  error: { color: tokens.color.error }, message: { color: tokens.color.green },
  preview: { gap: tokens.spacing.md }, selection: { flexDirection: 'row', gap: tokens.spacing.sm },
  candidate: { flexDirection: 'row', gap: tokens.spacing.md, minHeight: tokens.control.height, paddingVertical: tokens.spacing.md, borderBottomWidth: 1, borderColor: tokens.color.border, alignItems: 'center' }, candidateText: { flex: 1 },
  confirm: { gap: tokens.spacing.sm },
});

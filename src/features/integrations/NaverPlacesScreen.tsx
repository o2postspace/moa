import { useCallback, useRef, useState } from 'react';
import { AppState, Linking, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen, ScreenHeader } from '../../components/Screen';
import { UiText } from '../../components/UiText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { normalizeUrl } from '../../domain/content';
import { integrationsApi, type PlaceCandidate } from './api';
import { openNaverPlace } from './maps';
import { tokens } from '../../theme/tokens';

export default function NaverPlacesScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceCandidate[]>([]);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const lock = useRef(false);
  const focused = useRef(false);
  const operation = useRef(0);
  const expiresAt = useRef(0);
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const clearResults = useCallback(() => {
    if (expiryTimer.current !== undefined) clearTimeout(expiryTimer.current);
    expiryTimer.current = undefined;
    expiresAt.current = 0;
    setResults([]);
    setSearched(false);
  }, []);
  useFocusEffect(useCallback(() => {
    focused.current = true;
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' && expiresAt.current > 0 && Date.now() >= expiresAt.current) {
        clearResults();
        setNotice('검색 결과의 보관 시간이 지났어요. 다시 검색해 주세요.');
      }
    });
    return () => {
      focused.current = false;
      operation.current += 1;
      lock.current = false;
      clearResults();
      setBusy(false);
      setError('');
      setNotice('');
      subscription.remove();
    };
  }, [clearResults]));

  const run = async (action: (version: number) => Promise<void>) => {
    if (lock.current || !focused.current) return;
    const version = ++operation.current;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try { await action(version); }
    catch (err) {
      if (focused.current && version === operation.current) setError(err instanceof Error ? err.message : '요청을 완료하지 못했어요.');
    } finally {
      if (focused.current && version === operation.current) { lock.current = false; setBusy(false); }
    }
  };
  const search = () => {
    if (!query.trim()) return;
    return run(async version => {
      // A new query invalidates the previous response, including on request failure.
      clearResults();
      const page = await integrationsApi.searchPlaces(query.trim());
      if (!focused.current || version !== operation.current) return;
      const confirmedAt = Date.parse(page.fetchedAt);
      const receivedAt = Date.now();
      const deadline = Math.min(confirmedAt, receivedAt) + 24 * 60 * 60 * 1000;
      if (!Number.isFinite(confirmedAt) || confirmedAt > receivedAt + 5 * 60 * 1000 || deadline <= receivedAt) throw new Error('검색 결과의 확인 시간을 읽지 못했어요. 다시 검색해 주세요.');
      expiresAt.current = deadline;
      setResults(page.items); setSearched(true);
      expiryTimer.current = setTimeout(() => {
        if (!focused.current || expiresAt.current !== deadline) return;
        clearResults();
        setNotice('검색 결과의 보관 시간이 지났어요. 다시 검색해 주세요.');
      }, deadline - Date.now());
    });
  };
  const openOriginal = (url: string) => run(async () => {
    normalizeUrl(url);
    if (!/^https:\/\//i.test(url)) throw new Error('원문 주소를 확인하지 못했어요.');
    await Linking.openURL(url);
  });
  return <Screen><ScreenHeader title="장소 검색" /><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <UiText variant="hero">{'가고 싶은 곳을\n더 정확하게.'}</UiText>
    <UiText muted>동네와 장소 이름을 함께 검색하면 찾기 쉬워요.</UiText>
    <TextInput accessibilityLabel="장소 검색어" value={query} onChangeText={setQuery} placeholder="예: 성수 카페, 노들섬" placeholderTextColor={tokens.color.secondary} style={styles.input} maxLength={100} onSubmitEditing={search} />
    <PrimaryButton label="네이버에서 장소 검색" icon="search-outline" loading={busy} disabled={!query.trim()} onPress={search} />
    {error ? <UiText accessibilityRole="alert" style={styles.error}>{error}</UiText> : null}
    {notice ? <UiText accessibilityLiveRegion="polite" muted>{notice}</UiText> : null}
    {searched && <UiText variant="caption" muted>네이버 지역 검색 결과</UiText>}
    {searched && !results.length && <UiText muted>검색 결과가 없어요. 동네나 장소 이름을 바꿔보세요.</UiText>}
    {results.map((place, index) => <View key={index} style={styles.card}>
      <UiText variant="subtitle" style={styles.bold}>{place.title}</UiText><UiText variant="caption" muted>{place.category}</UiText><UiText>{place.roadAddress || place.address}</UiText>
      {place.url ? <PrimaryButton label="검색 결과 원문 보기" secondary icon="open-outline" disabled={busy} onPress={() => openOriginal(place.url)} /> : <UiText variant="caption" muted>제공된 원문 링크가 없어요.</UiText>}
      <PrimaryButton label="네이버 지도에서 확인" secondary icon="map-outline" disabled={busy} onPress={() => run(() => openNaverPlace(place.title, place.roadAddress || place.address))} />
    </View>)}
    <UiText variant="caption" muted>검색 결과는 네이버에서 제공해요. 결과는 화면을 떠나거나 새로 검색하면 사라지고, 이 화면에 머물러도 최대 24시간만 유지돼요. 방문 전 주소와 영업 정보를 원본에서 확인해 주세요.</UiText>
  </ScrollView></Screen>;
}
const styles = StyleSheet.create({ page: { padding: tokens.spacing.xl, gap: tokens.spacing.lg }, input: { minHeight: tokens.control.height, padding: tokens.spacing.lg, borderRadius: tokens.radius.md, backgroundColor: tokens.color.surfaceMuted, color: tokens.color.ink, fontFamily: tokens.font.regular, fontSize: 14 }, card: { padding: tokens.spacing.lg, borderRadius: tokens.radius.lg, backgroundColor: tokens.color.surfaceMuted, gap: tokens.spacing.md }, bold: { fontFamily: tokens.font.bold }, error: { color: tokens.color.error } });

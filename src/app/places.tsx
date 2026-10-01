import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Screen, ScreenHeader } from '../components/Screen';
import { UiText } from '../components/UiText';
import { PrimaryButton } from '../components/PrimaryButton';
import { FilterChip } from '../components/FilterChip';
import { CATEGORIES, type Category } from '../domain/content';
import { useLibrary } from '../features/library/LibraryProvider';
import { integrationsApi, type PlaceCandidate } from '../features/integrations/api';
import { naverPlaceUrl, openNaverPlace } from '../features/integrations/maps';
import { tokens } from '../theme/tokens';

export default function PlacesScreen() {
  const { add, saving, loading, error: libraryError } = useLibrary();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('food');
  const [results, setResults] = useState<PlaceCandidate[]>([]);
  const [fetchedAt, setFetchedAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const lock = useRef(false);
  const run = async (action: () => Promise<void>) => { if (lock.current) return; lock.current = true; setBusy(true); setError(''); setMessage(''); try { await action(); } catch (err) { setError(err instanceof Error ? err.message : '요청을 완료하지 못했어요.'); } finally { lock.current = false; setBusy(false); } };
  return <Screen><ScreenHeader title="장소 검색" /><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <UiText variant="hero">{'가고 싶은 곳을\n더 정확하게.'}</UiText>
    <UiText muted>동네와 장소 이름을 함께 검색하면 찾기 쉬워요.</UiText>
    <TextInput accessibilityLabel="장소 검색어" value={query} onChangeText={setQuery} placeholder="예: 성수 카페, 노들섬" placeholderTextColor={tokens.color.secondary} style={styles.input} maxLength={100} onSubmitEditing={() => { if (query.trim()) run(async () => { const page = await integrationsApi.searchPlaces(query.trim()); setResults(page.items); setFetchedAt(page.fetchedAt); setSearched(true); }); }} />
    <PrimaryButton label="네이버에서 장소 검색" icon="search-outline" loading={busy} disabled={!query.trim()} onPress={() => run(async () => { const page = await integrationsApi.searchPlaces(query.trim()); setResults(page.items); setFetchedAt(page.fetchedAt); setSearched(true); })} />
    {error || libraryError ? <UiText accessibilityRole="alert" style={styles.error}>{error || libraryError}</UiText> : null}
    {message ? <UiText accessibilityLiveRegion="polite" style={styles.success}>{message}</UiText> : null}
    <UiText style={styles.bold}>저장할 분류</UiText>
    <View style={styles.chips}>{CATEGORIES.map(item => <FilterChip key={item.id} label={item.label} selected={category === item.id} onPress={() => setCategory(item.id)} />)}</View>
    {searched && !results.length && <UiText muted>검색 결과가 없어요. 동네나 장소 이름을 바꿔보세요.</UiText>}
    {results.map((place, index) => <View key={index} style={styles.card}>
      <UiText variant="subtitle" style={styles.bold}>{place.title}</UiText><UiText variant="caption" muted>{place.category}</UiText><UiText>{place.roadAddress || place.address}</UiText>
      <PrimaryButton label="네이버 지도에서 확인" secondary icon="map-outline" disabled={busy} onPress={() => run(() => openNaverPlace(place.title, place.roadAddress || place.address))} />
      <PrimaryButton label="이 장소 저장" icon="bookmark-outline" loading={saving} disabled={busy || loading || Boolean(libraryError) || place.latitude === undefined || place.longitude === undefined} onPress={() => run(async () => {
        if (place.latitude === undefined || place.longitude === undefined) throw new Error('좌표가 없는 장소는 링크로 직접 저장해 주세요.');
        await add({ title: place.title, url: naverPlaceUrl(place.title, place.roadAddress || place.address), category, placeName: place.title,
          place: { provider: 'naver', name: place.title, address: place.roadAddress || place.address, latitude: place.latitude, longitude: place.longitude, fetchedAt },
          importedFrom: { provider: 'naver', method: 'place-search', fetchedAt } });
        setMessage(`${place.title}을 저장했어요.`);
      })} />
      {(place.latitude === undefined || place.longitude === undefined) && <UiText variant="caption" muted>좌표를 확인하지 못했어요. 지도에서 확인한 링크를 직접 추가해 주세요.</UiText>}
    </View>)}
    <UiText variant="caption" muted>검색 결과는 네이버에서 제공해요. 방문 전 주소와 영업 정보를 원본에서 확인해 주세요. 검색으로 저장한 장소 정보는 30일 동안 보관돼요.</UiText>
  </ScrollView></Screen>;
}
const styles = StyleSheet.create({ page: { padding: tokens.spacing.xl, gap: tokens.spacing.lg }, input: { minHeight: tokens.control.height, padding: tokens.spacing.lg, borderRadius: tokens.radius.md, backgroundColor: tokens.color.surfaceMuted, color: tokens.color.ink, fontFamily: tokens.font.regular, fontSize: 14 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm }, card: { padding: tokens.spacing.lg, borderRadius: tokens.radius.lg, backgroundColor: tokens.color.surfaceMuted, gap: tokens.spacing.md }, bold: { fontFamily: tokens.font.bold }, error: { color: tokens.color.error }, success: { color: tokens.color.green } });

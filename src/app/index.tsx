import { useState } from 'react';
import { ScrollView, View, StyleSheet, TextInput, ActivityIndicator, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { CATEGORIES, SOURCES, searchContent, type Category, type SourceType } from '../domain/content';
import { useLibrary } from '../features/library/LibraryProvider';
import { Screen } from '../components/Screen';
import { UiText } from '../components/UiText';
import { PrimaryButton } from '../components/PrimaryButton';
import { FilterChip } from '../components/FilterChip';
import { ContentCard } from '../components/ContentCard';
import { EmptyState } from '../components/EmptyState';
import { tokens } from '../theme/tokens';

export default function LibraryScreen() {
  const { items, loading, error, retry } = useLibrary();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [source, setSource] = useState<SourceType | 'all'>('all');
  const results = searchContent(items, { query, category, source });
  const reset = () => { setQuery(''); setCategory('all'); setSource('all'); };
  return <Screen><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <View style={styles.brandRow}><View style={styles.brand}><View style={styles.brandMark}><Ionicons name="bookmark" size={18} color={tokens.color.surface} /></View><UiText variant="title">모아</UiText></View><UiText variant="caption" muted>나의 저장함</UiText></View>
    <View style={styles.intro}><UiText variant="caption" style={styles.eyebrow}>MY SAVED COLLECTION</UiText><UiText variant="hero">{'저장해 둔 취향,\n한곳에서 만나요.'}</UiText><UiText muted style={{ marginTop: tokens.spacing.md }}>흩어진 링크에 이름과 장소를 붙여 보세요.</UiText></View>
    <View style={styles.summary}><View><UiText variant="caption" muted>모아 둔 콘텐츠</UiText><UiText variant="title">{items.length}<UiText muted> 개</UiText></UiText></View><PrimaryButton label="링크 추가" icon="add-outline" onPress={() => router.push('/add')} disabled={loading || Boolean(error)} /></View>
    <View style={styles.search}><Ionicons name="search-outline" size={20} color={tokens.color.secondary} /><TextInput accessibilityLabel="저장한 콘텐츠 검색" placeholder="제목, 장소, 메모로 검색" placeholderTextColor={tokens.color.secondary} value={query} onChangeText={setQuery} style={styles.searchInput} />{query ? <Pressable accessibilityRole="button" accessibilityLabel="검색어 지우기" onPress={() => setQuery('')} style={styles.clear}><Ionicons name="close-circle" size={19} color={tokens.color.secondary} /></Pressable> : null}</View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}><FilterChip label="전체" selected={category === 'all'} onPress={() => setCategory('all')} />{CATEGORIES.map(item => <FilterChip key={item.id} label={item.label} selected={category === item.id} onPress={() => setCategory(item.id)} />)}</ScrollView>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}><FilterChip label="모든 출처" selected={source === 'all'} onPress={() => setSource('all')} />{SOURCES.map(item => <FilterChip key={item.id} label={item.label} selected={source === item.id} onPress={() => setSource(item.id)} />)}</ScrollView>
    <View style={styles.listHeading}><UiText variant="subtitle">내 콘텐츠</UiText><UiText variant="caption" muted>{results.length}개 · 최근 저장순</UiText></View>
    {loading ? <View style={styles.loading}><ActivityIndicator color={tokens.color.accent} /><UiText muted>저장함을 불러오는 중이에요</UiText></View> : error ? <View style={styles.error}><UiText>{error}</UiText><PrimaryButton label="다시 불러오기" onPress={retry} secondary /></View> : results.length ? <View style={styles.cards}>{results.map(item => <ContentCard key={item.id} item={item} onPress={() => router.push({ pathname: '/content/[id]', params: { id: item.id } })} />)}</View> : <EmptyState filtered={items.length > 0 || Boolean(query) || category !== 'all' || source !== 'all'} onAction={items.length > 0 || query || category !== 'all' || source !== 'all' ? reset : () => router.push('/add')} />}
    <View style={styles.footer}><Ionicons name="lock-closed-outline" size={13} color={tokens.color.secondary} /><UiText variant="caption" muted>저장한 콘텐츠는 이 기기에 보관돼요.</UiText></View>
  </ScrollView></Screen>;
}
const styles = StyleSheet.create({
  page: { padding: tokens.spacing.xl, paddingTop: tokens.spacing.lg, paddingBottom: tokens.spacing.xxl },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, brand: { flexDirection: 'row', gap: tokens.spacing.sm, alignItems: 'center' }, brandMark: { width: 32, height: 32, borderRadius: 10, backgroundColor: tokens.color.accent, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] },
  intro: { marginTop: tokens.spacing.xxl, marginBottom: tokens.spacing.xl }, eyebrow: { color: tokens.color.accent, fontFamily: tokens.font.medium, letterSpacing: 1.3, fontSize: 10, marginBottom: tokens.spacing.sm },
  summary: { padding: tokens.spacing.lg, borderRadius: tokens.radius.md, backgroundColor: tokens.color.accentSoft, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.xl, gap: tokens.spacing.sm },
  search: { minHeight: tokens.control.height, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, borderWidth: 1, borderColor: tokens.color.border, borderRadius: tokens.radius.md, backgroundColor: tokens.color.surface, paddingHorizontal: tokens.spacing.lg, marginBottom: tokens.spacing.lg }, searchInput: { flex: 1, fontFamily: tokens.font.regular, fontSize: 14, color: tokens.color.ink, minHeight: 50 }, clear: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  chips: { gap: tokens.spacing.sm, paddingBottom: tokens.spacing.sm },
  listHeading: { marginTop: tokens.spacing.lg, marginBottom: tokens.spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, cards: { gap: tokens.spacing.md },
  loading: { paddingVertical: tokens.spacing.xxxl, gap: tokens.spacing.lg, alignItems: 'center' }, error: { padding: tokens.spacing.lg, gap: tokens.spacing.lg },
  footer: { flexDirection: 'row', gap: tokens.spacing.xs, alignItems: 'center', justifyContent: 'center', marginTop: tokens.spacing.xl },
});

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
  const [visitedOnly, setVisitedOnly] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const filtered = Boolean(query.trim()) || category !== 'all' || source !== 'all';
  const results = searchContent(items, { query, category, source }).filter(item => !visitedOnly || item.visited);
  const visitedCount = items.filter(item => item.visited).length;
  const sourceLabel = source === 'all' ? '모든 출처' : SOURCES.find(item => item.id === source)?.label;
  const reset = () => { setQuery(''); setCategory('all'); setSource('all'); setVisitedOnly(false); setSourcesOpen(false); };

  return <Screen><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <View style={styles.brandRow}>
      <View style={styles.brand}><Ionicons name="bookmark" size={24} color={tokens.color.accent} /><UiText variant="title" style={styles.brandName}>모아</UiText></View>
      <Pressable accessibilityRole="button" accessibilityLabel="링크 추가" accessibilityState={{ disabled: loading || Boolean(error) }} disabled={loading || Boolean(error)} onPress={() => router.push('/add')} style={({ pressed }) => [styles.add, pressed && { opacity: 0.7 }, (loading || error) && { opacity: 0.5 }]}>
        <Ionicons name="add-outline" size={20} color={tokens.color.accent} /><UiText style={styles.addLabel}>링크 추가</UiText>
      </Pressable>
    </View>

    <View style={styles.intro}><UiText variant="hero">모아 둔 취향</UiText><UiText muted style={styles.description}>좋아한 순간들을 한곳에.</UiText></View>
    <Pressable accessibilityRole="button" accessibilityLabel="저장한 콘텐츠 가져오기" onPress={() => router.push('/integrations')} style={styles.integrations}><Ionicons name="albums-outline" size={20} color={tokens.color.accent} /><View style={{ flex: 1 }}><UiText style={{ fontFamily: tokens.font.medium }}>흩어진 저장함 모아보기</UiText><UiText variant="caption" muted>영상·게시물 링크 · 공개 재생목록 · 파일</UiText></View><Ionicons name="chevron-forward" size={18} color={tokens.color.secondary} /></Pressable>
    <View style={styles.tabs}>
      <CollectionTab label="전체 저장" count={items.length} selected={!visitedOnly} onPress={() => setVisitedOnly(false)} />
      <CollectionTab label="방문 완료" count={visitedCount} selected={visitedOnly} onPress={() => setVisitedOnly(true)} />
    </View>
    <View style={styles.search}>
      <Ionicons name="search-outline" size={21} color={tokens.color.secondary} />
      <TextInput accessibilityLabel="저장한 콘텐츠 검색" placeholder="제목·장소·메모 검색" placeholderTextColor={tokens.color.secondary} value={query} onChangeText={setQuery} style={styles.searchInput} />
      {query ? <Pressable accessibilityRole="button" accessibilityLabel="검색어 지우기" onPress={() => setQuery('')} style={styles.clear}><Ionicons name="close-circle" size={20} color={tokens.color.secondary} /></Pressable> : null}
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      <FilterChip label="전체" selected={category === 'all'} onPress={() => setCategory('all')} />
      {CATEGORIES.map(item => <FilterChip key={item.id} label={item.label} selected={category === item.id} onPress={() => setCategory(item.id)} />)}
    </ScrollView>

    <View style={styles.listHeading}>
      <View style={styles.headingLabel}><UiText variant="subtitle" style={styles.listTitle}>{visitedOnly ? '방문한 콘텐츠' : '나의 콘텐츠'}</UiText><UiText variant="caption" muted>{results.length}</UiText></View>
      <Pressable accessibilityRole="button" accessibilityLabel={'출처 필터: ' + sourceLabel} accessibilityState={{ expanded: sourcesOpen }} onPress={() => setSourcesOpen(value => !value)} style={styles.sourceControl}>
        <UiText variant="caption" style={source !== 'all' && { color: tokens.color.accent }}>{sourceLabel}</UiText><Ionicons name={sourcesOpen ? 'chevron-up' : 'chevron-down'} size={14} color={tokens.color.secondary} />
      </Pressable>
    </View>
    {sourcesOpen && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sourceChoices}>
      <FilterChip label="모든 출처" selected={source === 'all'} onPress={() => { setSource('all'); setSourcesOpen(false); }} />
      {SOURCES.map(item => <FilterChip key={item.id} label={item.label} selected={source === item.id} onPress={() => { setSource(item.id); setSourcesOpen(false); }} />)}
    </ScrollView>}

    {loading ? <View style={styles.loading}><ActivityIndicator color={tokens.color.accent} /><UiText muted>저장함을 불러오는 중이에요</UiText></View>
      : error ? <View style={styles.error}><UiText accessibilityRole="alert">{error}</UiText><PrimaryButton label="다시 불러오기" onPress={retry} secondary /></View>
      : results.length ? <View style={styles.cards}>{results.map(item => <ContentCard key={item.id} item={item} onPress={() => router.push({ pathname: '/content/[id]', params: { id: item.id } })} />)}</View>
      : <EmptyState filtered={items.length > 0 || filtered || visitedOnly} visited={visitedOnly && !filtered} onAction={items.length > 0 || filtered || visitedOnly ? reset : () => router.push('/add')} />}
    <View style={styles.footer}><Ionicons name="lock-closed-outline" size={12} color={tokens.color.secondary} /><UiText variant="caption" muted>이 기기에 저장되는 나만의 컬렉션</UiText></View>
  </ScrollView></Screen>;
}
function CollectionTab({ label, count, selected, onPress }: { label: string; count: number; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={label + ' ' + count + '개'} onPress={onPress} style={[styles.tab, selected && styles.tabSelected]}>
    <View style={styles.tabContent}><UiText variant="subtitle" style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{label}</UiText><UiText variant="caption" style={{ color: selected ? tokens.color.accent : tokens.color.secondary }}>{count}</UiText></View>
  </Pressable>;
}
const styles = StyleSheet.create({
  page: { padding: tokens.spacing.xl, paddingTop: tokens.spacing.lg, paddingBottom: tokens.spacing.xxl },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: tokens.spacing.sm },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandName: { fontSize: 24, letterSpacing: -1 },
  add: { minHeight: tokens.control.touchMin, paddingHorizontal: tokens.spacing.md, borderRadius: tokens.radius.pill, backgroundColor: tokens.color.accentSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.xs, flexShrink: 1 },
  addLabel: { color: tokens.color.accentInk, fontFamily: tokens.font.bold, flexShrink: 1 },
  intro: { paddingTop: tokens.spacing.xl, paddingBottom: tokens.spacing.lg },
  description: { marginTop: tokens.spacing.xs },
  integrations: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, padding: tokens.spacing.lg, borderRadius: tokens.radius.md, backgroundColor: tokens.color.accentSoft, marginBottom: tokens.spacing.lg },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderColor: tokens.color.border, marginBottom: tokens.spacing.xl },
  tab: { flex: 1, minHeight: tokens.control.touchMin, paddingVertical: tokens.spacing.md, borderBottomWidth: 2, borderBottomColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  tabSelected: { borderBottomColor: tokens.color.accent },
  tabContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: tokens.spacing.sm },
  tabLabel: { color: tokens.color.secondary, textAlign: 'center' },
  tabLabelSelected: { color: tokens.color.ink, fontFamily: tokens.font.bold },
  search: { minHeight: tokens.control.height, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, borderRadius: tokens.radius.md, backgroundColor: tokens.color.surfaceMuted, paddingLeft: tokens.spacing.lg, paddingRight: tokens.spacing.sm, marginBottom: tokens.spacing.md },
  searchInput: { flex: 1, minWidth: 0, fontFamily: tokens.font.regular, fontSize: 14, color: tokens.color.ink, minHeight: 56, paddingVertical: tokens.spacing.md },
  clear: { width: tokens.control.touchMin, height: tokens.control.touchMin, alignItems: 'center', justifyContent: 'center' },
  chips: { gap: tokens.spacing.sm, paddingBottom: tokens.spacing.xs },
  listHeading: { marginTop: tokens.spacing.md, marginBottom: tokens.spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: tokens.spacing.sm },
  headingLabel: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: tokens.spacing.sm },
  listTitle: { fontFamily: tokens.font.bold, flexShrink: 1 },
  sourceControl: { minHeight: tokens.control.touchMin, flexDirection: 'row', gap: tokens.spacing.xs, alignItems: 'center', paddingHorizontal: tokens.spacing.sm },
  sourceChoices: { gap: tokens.spacing.sm, paddingBottom: tokens.spacing.lg },
  cards: { gap: tokens.spacing.md },
  loading: { paddingVertical: tokens.spacing.xxxl, gap: tokens.spacing.lg, alignItems: 'center' },
  error: { padding: tokens.spacing.lg, gap: tokens.spacing.lg },
  footer: { flexDirection: 'row', gap: tokens.spacing.xs, alignItems: 'center', justifyContent: 'center', marginTop: tokens.spacing.xl, flexWrap: 'wrap' },
});

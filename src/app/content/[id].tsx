import { useState } from 'react';
import { ScrollView, View, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CATEGORIES } from '../../domain/content';
import { useLibrary } from '../../features/library/LibraryProvider';
import { Screen, ScreenHeader } from '../../components/Screen';
import { UiText } from '../../components/UiText';
import { SourceBadge } from '../../components/SourceBadge';
import { PrimaryButton } from '../../components/PrimaryButton';
import { CategoryStamp } from '../../components/CategoryStamp';
import { tokens } from '../../theme/tokens';

export default function ContentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, loading, saving, toggleVisited } = useLibrary();
  const [error, setError] = useState('');
  const item = items.find(content => content.id === id);
  const markVisited = async () => { setError(''); try { await toggleVisited(id); } catch { setError('방문 상태를 저장하지 못했어요. 다시 시도해 주세요.'); } };
  const openOriginal = async () => { setError(''); try { if (item) await Linking.openURL(item.url); } catch { setError('링크를 열지 못했어요. 잠시 후 다시 시도해 주세요.'); } };

  return <Screen><ScreenHeader title="저장한 콘텐츠" action={item ? { label: '내용 수정', icon: 'create-outline', onPress: () => router.push({ pathname: '/add', params: { id: item.id } }) } : undefined} />
    {loading ? <ActivityIndicator color={tokens.color.accent} />
      : !item ? <View style={styles.page}><UiText>콘텐츠를 찾을 수 없어요.</UiText><PrimaryButton label="저장함으로" onPress={() => router.replace('/')} /></View>
      : <>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.page}>
          <View style={styles.hero}>
            <CategoryStamp category={item.category} visited={item.visited} large />
            <UiText variant="hero" style={styles.title}>{item.title}</UiText>
            <View style={styles.meta}><SourceBadge source={item.source} /><UiText variant="caption" muted>· {CATEGORIES.find(category => category.id === item.category)?.label}</UiText></View>
            {item.visited && <View style={styles.visited}><Ionicons name="checkmark-circle" size={15} color={tokens.color.green} /><UiText variant="caption" style={styles.visitedText}>방문 완료</UiText></View>}
          </View>
          <View style={styles.location}>
            <View style={styles.locationSymbol}><Ionicons name="location-outline" size={23} color={tokens.color.accent} /></View>
            <View style={styles.locationText}><UiText variant="caption" muted>저장한 장소</UiText><UiText variant="subtitle" style={styles.placeName}>{item.placeName || '장소 미등록'}</UiText><UiText variant="caption" muted>지도 연결 전 · 직접 적은 장소예요</UiText></View>
          </View>
          <View style={styles.memo}>
            <View style={styles.sectionHeading}><Ionicons name="chatbubble-ellipses-outline" size={18} color={tokens.color.secondary} /><UiText style={styles.sectionLabel}>나의 메모</UiText></View>
            <UiText style={styles.memoText}>{item.note || '저장한 이유를 적어보세요.\n나중의 내가 더 쉽게 기억할 수 있어요.'}</UiText>
          </View>
          <View style={styles.origin}><UiText variant="caption" muted>원본 링크</UiText><UiText variant="caption" muted selectable style={styles.url}>{item.url}</UiText><UiText variant="caption" muted style={styles.date}>{new Date(item.createdAt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })} 저장</UiText></View>
        </ScrollView>
        <View style={styles.actionBar}>
          {error ? <UiText variant="caption" accessibilityRole="alert" style={styles.error}>{error}</UiText> : null}
          <PrimaryButton label="원본 보기" icon="open-outline" onPress={openOriginal} />
          <PrimaryButton label={item.visited ? '방문 완료 취소' : '방문 완료로 표시'} icon={item.visited ? 'checkmark-circle' : 'checkmark-outline'} secondary onPress={markVisited} loading={saving} />
        </View>
      </>}
  </Screen>;
}
const styles = StyleSheet.create({
  page: { paddingHorizontal: tokens.spacing.xl, paddingBottom: tokens.spacing.xl },
  hero: { alignItems: 'center', paddingTop: tokens.spacing.lg, paddingBottom: tokens.spacing.xxl },
  title: { textAlign: 'center', marginTop: tokens.spacing.sm, fontSize: 25, lineHeight: 36, width: '100%' },
  meta: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: tokens.spacing.xs, marginTop: tokens.spacing.md },
  visited: { flexDirection: 'row', gap: tokens.spacing.xs, alignItems: 'center', marginTop: tokens.spacing.md, backgroundColor: tokens.color.greenSoft, borderRadius: tokens.radius.pill, paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.xs },
  visitedText: { color: tokens.color.green },
  location: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, padding: tokens.spacing.lg, backgroundColor: tokens.color.surfaceMuted, borderRadius: tokens.radius.md },
  locationSymbol: { width: 44, height: 48, borderRadius: tokens.radius.sm, backgroundColor: tokens.color.surface, alignItems: 'center', justifyContent: 'center' },
  locationText: { flex: 1, minWidth: 0 },
  placeName: { fontFamily: tokens.font.bold, marginVertical: 2 },
  memo: { marginTop: tokens.spacing.xl },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  sectionLabel: { fontFamily: tokens.font.bold },
  memoText: { marginTop: tokens.spacing.md, padding: tokens.spacing.lg, backgroundColor: tokens.color.surfaceMuted, borderRadius: tokens.radius.md },
  origin: { marginTop: tokens.spacing.xl, paddingTop: tokens.spacing.lg, borderTopWidth: 1, borderColor: tokens.color.border },
  url: { marginTop: tokens.spacing.xs },
  date: { marginTop: tokens.spacing.sm },
  actionBar: { paddingHorizontal: tokens.spacing.xl, paddingTop: tokens.spacing.md, paddingBottom: tokens.spacing.lg, gap: tokens.spacing.sm, borderTopWidth: 1, borderColor: tokens.color.border, backgroundColor: tokens.color.surface },
  error: { color: tokens.color.error, marginTop: tokens.spacing.lg },
});

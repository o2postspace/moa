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
import { tokens } from '../../theme/tokens';

export default function ContentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, loading, saving, toggleVisited } = useLibrary();
  const [error, setError] = useState('');
  const item = items.find(content => content.id === id);
  const markVisited = async () => { setError(''); try { await toggleVisited(id); } catch { setError('방문 상태를 저장하지 못했어요. 다시 시도해 주세요.'); } };
  const openOriginal = async () => { setError(''); try { if (item) await Linking.openURL(item.url); } catch { setError('링크를 열지 못했어요. 잠시 후 다시 시도해 주세요.'); } };
  return <Screen><ScreenHeader title="저장한 콘텐츠" />{loading ? <ActivityIndicator color={tokens.color.accent} /> : !item ? <View style={styles.page}><UiText>콘텐츠를 찾을 수 없어요.</UiText><PrimaryButton label="저장함으로" onPress={() => router.replace('/')} /></View> : <ScrollView contentContainerStyle={styles.page}>
    <View style={styles.meta}><SourceBadge source={item.source} /><UiText variant="caption" muted>· {CATEGORIES.find(category => category.id === item.category)?.label}</UiText></View>
    <UiText variant="hero" style={styles.title}>{item.title}</UiText>
    <View style={styles.location}><Ionicons name="location-outline" size={22} color={tokens.color.accent} /><View style={{ flex: 1 }}><UiText variant="caption" muted>저장한 장소</UiText><UiText variant="subtitle">{item.placeName || '장소 확인 전'}</UiText><UiText variant="caption" muted>위치는 아직 지도에 연결되지 않았어요.</UiText></View></View>
    <View style={styles.memo}><UiText variant="caption" muted>나의 메모</UiText><UiText style={{ marginTop: tokens.spacing.sm }}>{item.note || '아직 메모가 없어요. 저장한 이유를 적어 보세요.'}</UiText></View>
    <View style={styles.origin}><UiText variant="caption" muted>원본 링크</UiText><UiText style={{ marginTop: tokens.spacing.xs }} selectable>{item.url}</UiText><UiText variant="caption" muted style={{ marginTop: tokens.spacing.sm }}>{new Date(item.createdAt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })} 저장</UiText></View>
    <View style={styles.actions}><PrimaryButton label="원본 보기" icon="open-outline" onPress={openOriginal} /><PrimaryButton label={item.visited ? '방문 완료 취소' : '방문 완료로 표시'} icon={item.visited ? 'checkmark-circle' : 'checkmark-outline'} secondary onPress={markVisited} loading={saving} /><PrimaryButton label="내용 수정" icon="create-outline" secondary onPress={() => router.push({ pathname: '/add', params: { id: item.id } })} /></View>
    {item.visited ? <View style={styles.visited}><Ionicons name="checkmark-circle" size={18} color={tokens.color.green} /><UiText style={{ color: tokens.color.green }}>방문한 콘텐츠로 표시했어요.</UiText></View> : null}
    {error ? <UiText accessibilityRole="alert" style={{ color: tokens.color.error, marginTop: 16 }}>{error}</UiText> : null}
  </ScrollView>}</Screen>;
}
const styles = StyleSheet.create({ page: { padding: tokens.spacing.xl, paddingBottom: tokens.spacing.xxl }, meta: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs }, title: { marginTop: tokens.spacing.lg, marginBottom: tokens.spacing.xl }, location: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, padding: tokens.spacing.lg, backgroundColor: tokens.color.accentSoft, borderRadius: tokens.radius.md }, memo: { padding: tokens.spacing.xl, backgroundColor: tokens.color.surface, borderRadius: tokens.radius.md, borderWidth: 1, borderColor: tokens.color.border, marginTop: tokens.spacing.lg }, origin: { marginVertical: tokens.spacing.xl }, actions: { gap: tokens.spacing.md }, visited: { flexDirection: 'row', gap: tokens.spacing.sm, alignItems: 'center', marginTop: tokens.spacing.xl } });

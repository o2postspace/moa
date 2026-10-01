import { View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { tokens } from '../theme/tokens';
import { UiText } from './UiText';
import { PrimaryButton } from './PrimaryButton';

export function EmptyState({ filtered = false, onAction }: { filtered?: boolean; onAction: () => void }) {
  return <View style={styles.container}>
    <View style={styles.symbol}><Ionicons name={filtered ? 'search-outline' : 'bookmarks-outline'} size={32} color={tokens.color.accent} /></View>
    <UiText variant="title" style={styles.center}>{filtered ? '찾는 콘텐츠가 없어요' : '첫 콘텐츠를 모아볼까요?'}</UiText>
    <UiText muted style={[styles.center, { marginTop: tokens.spacing.sm, marginBottom: tokens.spacing.xl }]}>{filtered ? '검색어나 선택한 필터를 바꿔 보세요.' : '인스타·유튜브·네이버 링크를\n붙여넣어 보세요.'}</UiText>
    <PrimaryButton label={filtered ? '필터 초기화' : '링크로 추가하기'} secondary={filtered} onPress={onAction} icon={filtered ? 'refresh-outline' : 'add-outline'} />
  </View>;
}
const styles = StyleSheet.create({ container: { paddingHorizontal: tokens.spacing.lg, paddingVertical: tokens.spacing.xxl, borderWidth: 1, borderColor: tokens.color.border, backgroundColor: tokens.color.surface, borderRadius: tokens.radius.lg }, symbol: { width: 68, height: 68, borderRadius: tokens.radius.md, backgroundColor: tokens.color.accentSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: tokens.spacing.xl }, center: { textAlign: 'center' } });

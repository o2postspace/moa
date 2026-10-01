import { View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { tokens } from '../theme/tokens';
import { UiText } from './UiText';
import { PrimaryButton } from './PrimaryButton';
import { CategoryStamp } from './CategoryStamp';

export function EmptyState({ filtered = false, visited = false, onAction }: { filtered?: boolean; visited?: boolean; onAction: () => void }) {
  return <View style={styles.container}>
    {filtered ? <View style={styles.searchSymbol}><Ionicons name={visited ? 'checkmark-outline' : 'search-outline'} size={28} color={tokens.color.accent} /></View> : <CategoryStamp large />}
    <UiText variant="title" style={styles.center}>{filtered ? (visited ? '아직 방문한 콘텐츠가 없어요' : '찾는 콘텐츠가 없어요') : '첫 링크를 모아볼까요?'}</UiText>
    <UiText muted style={styles.description}>{filtered ? (visited ? '다녀온 곳은 상세 화면에서\n방문 완료로 표시해 보세요.' : '검색어나 선택한 필터를 바꿔 보세요.') : '마음에 든 링크 하나면 충분해요.\n인스타·유튜브·네이버 링크를 붙여넣어 보세요.'}</UiText>
    <PrimaryButton label={filtered ? '전체 저장 보기' : '링크로 추가하기'} secondary={filtered} onPress={onAction} icon={filtered ? 'arrow-back-outline' : 'add-outline'} />
  </View>;
}
const styles = StyleSheet.create({
  container: { paddingHorizontal: tokens.spacing.xl, paddingTop: tokens.spacing.xl, paddingBottom: tokens.spacing.xxl, backgroundColor: tokens.color.surfaceMuted, borderRadius: tokens.radius.lg, alignItems: 'center' },
  searchSymbol: { width: 72, height: 72, borderRadius: tokens.radius.pill, backgroundColor: tokens.color.surface, alignItems: 'center', justifyContent: 'center', marginBottom: tokens.spacing.lg },
  center: { textAlign: 'center', marginTop: tokens.spacing.sm, fontSize: 20 },
  description: { textAlign: 'center', marginTop: tokens.spacing.sm, marginBottom: tokens.spacing.xl },
});

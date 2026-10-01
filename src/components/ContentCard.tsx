import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CATEGORIES, SOURCES, type SavedContent } from '../domain/content';
import { tokens } from '../theme/tokens';
import { UiText } from './UiText';
import { SourceBadge } from './SourceBadge';
import { CategoryStamp } from './CategoryStamp';

export function ContentCard({ item, onPress }: { item: SavedContent; onPress: () => void }) {
  const category = CATEGORIES.find(value => value.id === item.category)?.label;
  const source = SOURCES.find(value => value.id === item.source)?.label;
  const label = [item.title, category, item.placeName, source, item.visited ? '방문 완료' : '저장한 콘텐츠'].filter(Boolean).join(', ');
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
    <View style={styles.content}>
      <UiText variant="subtitle" numberOfLines={2} style={styles.title}>{item.title}</UiText>
      <UiText variant="caption" muted numberOfLines={1} style={styles.place}>{item.placeName || '장소 미등록'}</UiText>
      <View style={styles.meta}><SourceBadge source={item.source} /><UiText variant="caption" muted>· {category}</UiText></View>
      {item.visited && <View style={styles.status}><Ionicons name="checkmark-circle" size={13} color={tokens.color.green} /><UiText variant="caption" style={styles.statusLabel}>방문 완료</UiText></View>}
    </View>
    <CategoryStamp category={item.category} visited={item.visited} />
  </Pressable>;
}
const styles = StyleSheet.create({
  card: { padding: tokens.spacing.lg, paddingLeft: tokens.spacing.xl, borderRadius: tokens.radius.md, backgroundColor: tokens.color.surfaceMuted, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, minHeight: 132 },
  content: { flex: 1, minWidth: 0 },
  title: { fontFamily: tokens.font.bold, lineHeight: 25 },
  place: { marginTop: tokens.spacing.xs },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: tokens.spacing.xs, marginTop: tokens.spacing.sm },
  status: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs, marginTop: tokens.spacing.xs },
  statusLabel: { color: tokens.color.green },
  pressed: { opacity: 0.75 },
});

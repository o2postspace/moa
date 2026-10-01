import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CATEGORIES, type Category, type SavedContent } from '../domain/content';
import { tokens } from '../theme/tokens';
import { UiText } from './UiText';
import { SourceBadge } from './SourceBadge';

const icons: Record<Category, keyof typeof Ionicons.glyphMap> = { food: 'restaurant-outline', cafe: 'cafe-outline', event: 'sparkles-outline', other: 'bookmark-outline' };
export function ContentCard({ item, onPress }: { item: SavedContent; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${item.title}, ${item.visited ? '방문 완료' : '저장한 콘텐츠'}`} onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}>
    <View style={styles.row}>
      <View style={[styles.icon, item.visited && { backgroundColor: tokens.color.greenSoft }]}><Ionicons name={item.visited ? 'checkmark-outline' : icons[item.category]} size={25} color={item.visited ? tokens.color.green : tokens.color.accent} /></View>
      <View style={styles.content}>
        <View style={styles.badges}><SourceBadge source={item.source} /><UiText variant="caption" muted>· {CATEGORIES.find(c => c.id === item.category)?.label}</UiText></View>
        <UiText variant="subtitle" numberOfLines={2} style={styles.title}>{item.title}</UiText>
        {item.placeName ? <UiText variant="caption" muted numberOfLines={1}>{item.placeName}</UiText> : <UiText variant="caption" muted>장소 확인 전</UiText>}
        {item.visited && <UiText variant="caption" style={{ color: tokens.color.green }}>방문 완료</UiText>}
      </View>
      <Ionicons name="chevron-forward" size={17} color={tokens.color.secondary} />
    </View>
  </Pressable>;
}
const styles = StyleSheet.create({
  card: { padding: tokens.spacing.lg, borderRadius: tokens.radius.md, borderWidth: 1, borderColor: tokens.color.border, backgroundColor: tokens.color.surface },
  row: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md },
  icon: { width: 52, height: 60, borderRadius: tokens.radius.sm, backgroundColor: tokens.color.accentSoft, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 }, badges: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 2 }, title: { marginTop: tokens.spacing.xs, marginBottom: 2 },
});

import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CATEGORIES, type Category } from '../domain/content';
import { tokens } from '../theme/tokens';
import { UiText } from './UiText';

const icons: Record<Category, keyof typeof Ionicons.glyphMap> = {
  food: 'restaurant-outline', cafe: 'cafe-outline', event: 'sparkles-outline', other: 'bookmark-outline',
};

export function CategoryStamp({ category = 'other', visited = false, large = false }: { category?: Category; visited?: boolean; large?: boolean }) {
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.artwork, large && styles.large]}>
    <View style={[styles.paperBack, large && styles.largePaper]} />
    <View style={[styles.paper, large && styles.largePaper, visited && styles.visited]}>
      <Ionicons name={visited ? 'checkmark-outline' : icons[category]} size={large ? 35 : 25} color={visited ? tokens.color.green : tokens.color.accent} />
      <UiText style={[styles.label, visited && { color: tokens.color.green }]}>{CATEGORIES.find(item => item.id === category)?.label}</UiText>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  artwork: { width: 80, height: 88, alignItems: 'center', justifyContent: 'center' },
  large: { width: 116, height: 124 },
  paperBack: { position: 'absolute', width: 66, height: 72, borderRadius: tokens.radius.sm, backgroundColor: tokens.color.border, transform: [{ rotate: '7deg' }] },
  paper: { width: 66, minHeight: 72, borderRadius: tokens.radius.sm, backgroundColor: tokens.color.surface, borderWidth: 1, borderColor: tokens.color.border, alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.xs, padding: tokens.spacing.sm, transform: [{ rotate: '-5deg' }] },
  largePaper: { width: 94, minHeight: 104 },
  visited: { backgroundColor: tokens.color.greenSoft, borderColor: tokens.color.greenSoft },
  label: { fontFamily: tokens.font.medium, fontSize: 10, lineHeight: 16, color: tokens.color.secondary },
});

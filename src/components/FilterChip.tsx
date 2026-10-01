import { Pressable, StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';
import { UiText } from './UiText';

export function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={label} style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && { opacity: 0.75 }]}>
    <UiText style={[styles.label, selected && styles.selectedLabel]}>{label}</UiText>
  </Pressable>;
}
const styles = StyleSheet.create({
  chip: { minHeight: tokens.control.chipHeight, paddingHorizontal: tokens.spacing.lg, borderRadius: tokens.radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.surfaceMuted },
  selected: { backgroundColor: tokens.color.accentSoft },
  label: { fontSize: 13, color: tokens.color.secondary, fontFamily: tokens.font.medium },
  selectedLabel: { color: tokens.color.accentInk, fontFamily: tokens.font.bold },
});

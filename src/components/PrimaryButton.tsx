import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { tokens } from '../theme/tokens';
import { UiText } from './UiText';

type Props = { label: string; onPress: () => void; disabled?: boolean; loading?: boolean; secondary?: boolean; icon?: keyof typeof Ionicons.glyphMap };
export function PrimaryButton({ label, onPress, disabled, loading, secondary, icon }: Props) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }} disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.secondary, pressed && styles.pressed, (disabled || loading) && styles.disabled]}>
    <View style={styles.row}>
      {loading ? <ActivityIndicator color={secondary ? tokens.color.ink : tokens.color.surface} /> : icon ? <Ionicons name={icon} size={19} color={secondary ? tokens.color.ink : tokens.color.surface} /> : null}
      <UiText style={[styles.label, secondary && styles.secondaryLabel]}>{label}</UiText>
    </View>
  </Pressable>;
}
const styles = StyleSheet.create({
  button: { minHeight: tokens.control.height, borderRadius: tokens.radius.md, backgroundColor: tokens.color.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: tokens.spacing.xl, paddingVertical: tokens.spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  label: { fontFamily: tokens.font.medium, color: tokens.color.surface, fontSize: 15 },
  secondary: { backgroundColor: tokens.color.surface, borderColor: tokens.color.border, borderWidth: 1 },
  secondaryLabel: { color: tokens.color.ink },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.55 },
});

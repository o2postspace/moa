import { Text, type TextProps, StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';

type Variant = 'body' | 'caption' | 'subtitle' | 'title' | 'hero';
export function UiText({ variant = 'body', muted = false, style, ...props }: TextProps & { variant?: Variant; muted?: boolean }) {
  return <Text {...props} style={[styles.base, styles[variant], muted && styles.muted, style]} />;
}
const styles = StyleSheet.create({
  base: { color: tokens.color.ink, fontFamily: tokens.font.regular },
  body: { fontSize: tokens.fontSize.body, lineHeight: 23 },
  caption: { fontSize: tokens.fontSize.caption, lineHeight: 20 },
  subtitle: { fontSize: tokens.fontSize.subtitle, lineHeight: 26, fontFamily: tokens.font.medium },
  title: { fontSize: tokens.fontSize.title, lineHeight: 32, fontFamily: tokens.font.bold, letterSpacing: -0.5 },
  hero: { fontSize: tokens.fontSize.hero, lineHeight: 39, fontFamily: tokens.font.bold, letterSpacing: -0.8 },
  muted: { color: tokens.color.secondary },
});

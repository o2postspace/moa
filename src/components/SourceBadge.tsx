import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SOURCES, type SourceType } from '../domain/content';
import { tokens } from '../theme/tokens';
import { UiText } from './UiText';

const icons: Record<SourceType, keyof typeof Ionicons.glyphMap> = { instagram: 'logo-instagram', youtube: 'logo-youtube', naver: 'map-outline', web: 'link-outline' };
export function SourceBadge({ source }: { source: SourceType }) {
  return <View style={styles.badge}><Ionicons name={icons[source]} size={13} color={tokens.color.secondary} /><UiText variant="caption" muted>{SOURCES.find(s => s.id === source)?.label}</UiText></View>;
}
const styles = StyleSheet.create({ badge: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs } });

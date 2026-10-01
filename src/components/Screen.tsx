import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { type PropsWithChildren } from 'react';
import { tokens } from '../theme/tokens';
import { UiText } from './UiText';

export function Screen({ children }: PropsWithChildren) {
  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}><View style={styles.shell}>{children}</View></SafeAreaView>;
}
type HeaderAction = { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void };
export function ScreenHeader({ title, action }: { title: string; action?: HeaderAction }) {
  return <View style={styles.header}>
    <Pressable accessibilityRole="button" accessibilityLabel="저장함으로 돌아가기" onPress={() => router.dismissTo('/')} style={styles.back}><Ionicons name="arrow-back-outline" size={22} color={tokens.color.ink} /></Pressable>
    <UiText variant="subtitle" style={styles.headerTitle}>{title}</UiText>
    {action ? <Pressable accessibilityRole="button" accessibilityLabel={action.label} onPress={action.onPress} style={styles.action}><Ionicons name={action.icon} size={22} color={tokens.color.ink} /></Pressable> : <View style={styles.action} />}
  </View>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.background },
  shell: { width: '100%', maxWidth: 520, alignSelf: 'center', flex: 1 },
  header: { flexDirection: 'row', gap: tokens.spacing.sm, justifyContent: 'space-between', alignItems: 'center', minHeight: 72, paddingHorizontal: tokens.spacing.xl },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: tokens.font.bold },
  back: { width: tokens.control.touchMin, height: tokens.control.touchMin, borderRadius: tokens.radius.pill, backgroundColor: tokens.color.surfaceMuted, justifyContent: 'center', alignItems: 'center' },
  action: { width: tokens.control.touchMin, height: tokens.control.touchMin, justifyContent: 'center', alignItems: 'center' },
});

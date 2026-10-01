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
export function ScreenHeader({ title }: { title: string }) {
  return <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="저장함으로 돌아가기" onPress={() => router.dismissTo('/')} style={styles.back}><Ionicons name="arrow-back-outline" size={23} color={tokens.color.ink} /></Pressable><UiText variant="subtitle">{title}</UiText><View style={styles.back} /></View>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: tokens.color.background }, shell: { width: '100%', maxWidth: 520, alignSelf: 'center', flex: 1 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 64, paddingHorizontal: tokens.spacing.lg }, back: { width: tokens.control.touchMin, height: tokens.control.touchMin, justifyContent: 'center', alignItems: 'center' } });

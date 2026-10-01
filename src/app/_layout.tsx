import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { NotoSansKR_400Regular } from '@expo-google-fonts/noto-sans-kr/400Regular';
import { NotoSansKR_500Medium } from '@expo-google-fonts/noto-sans-kr/500Medium';
import { NotoSansKR_700Bold } from '@expo-google-fonts/noto-sans-kr/700Bold';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Text } from 'react-native';
import { LibraryProvider } from '../features/library/LibraryProvider';
import { tokens } from '../theme/tokens';

export default function RootLayout() {
  const [loaded, fontError] = useFonts({ NotoSansKR_400Regular, NotoSansKR_500Medium, NotoSansKR_700Bold });
  if (!loaded && !fontError) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.background }}><ActivityIndicator color={tokens.color.accent} /><Text>모아를 준비하고 있어요</Text></View>;
  return <SafeAreaProvider><LibraryProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tokens.color.background } }}><Stack.Screen name="index" /><Stack.Screen name="add" /><Stack.Screen name="content/[id]" /></Stack></LibraryProvider></SafeAreaProvider>;
}

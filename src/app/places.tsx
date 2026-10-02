import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, ScreenHeader } from '../components/Screen';
import { UiText } from '../components/UiText';
import { PrimaryButton } from '../components/PrimaryButton';
import { tokens } from '../theme/tokens';

export default function PlacesScreen() {
  return <Screen><ScreenHeader title="장소 연동" /><ScrollView contentContainerStyle={styles.page}>
    <View style={styles.notice}>
      <UiText variant="hero">{'네이버 연동은\n잠시 보류했어요.'}</UiText>
      <UiText muted>지금은 YouTube·Instagram 링크와 파일에서 콘텐츠를 가져와 정리할 수 있어요.</UiText>
      <PrimaryButton label="콘텐츠 가져오기로 이동" icon="albums-outline" onPress={() => router.replace('/integrations')} />
    </View>
  </ScrollView></Screen>;
}

const styles = StyleSheet.create({
  page: { padding: tokens.spacing.xl },
  notice: { gap: tokens.spacing.lg },
});

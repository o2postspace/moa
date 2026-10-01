import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CATEGORIES, DomainError, validateDraft, detectSource, type Category, type DraftInput, type SavedContent } from '../domain/content';
import { useLibrary } from '../features/library/LibraryProvider';
import { Screen, ScreenHeader } from '../components/Screen';
import { UiText } from '../components/UiText';
import { PrimaryButton } from '../components/PrimaryButton';
import { FilterChip } from '../components/FilterChip';
import { SourceBadge } from '../components/SourceBadge';
import { tokens } from '../theme/tokens';

export default function AddLinkScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { items, loading } = useLibrary();
  const original = items.find(item => item.id === id);
  if (loading) return <Screen><ScreenHeader title="콘텐츠 준비" /><ActivityIndicator color={tokens.color.accent} /></Screen>;
  if (id && !original) return <Screen><ScreenHeader title="콘텐츠 수정" /><View style={styles.page}><UiText>수정할 콘텐츠를 찾을 수 없어요.</UiText><PrimaryButton label="저장함으로" onPress={() => router.replace('/')} /></View></Screen>;
  return <LinkForm key={id ?? 'new'} id={id} original={original} />;
}
function LinkForm({ id, original }: { id?: string; original?: SavedContent }) {
  const { add, update, loading, saving, error: loadError } = useLibrary();
  const [title, setTitle] = useState(original?.title ?? ''); const [url, setUrl] = useState(original?.url ?? ''); const [category, setCategory] = useState<Category>(original?.category ?? 'other'); const [placeName, setPlaceName] = useState(original?.placeName ?? ''); const [note, setNote] = useState(original?.note ?? '');
  const [errors, setErrors] = useState<Partial<Record<'url' | 'title', string>>>({});
  const [message, setMessage] = useState(''); const [duplicateId, setDuplicateId] = useState<string | undefined>();
  const submit = async () => {
    const draft: DraftInput = { title, url, category, placeName, note };
    const nextErrors = validateDraft(draft); setErrors(nextErrors); setMessage(''); setDuplicateId(undefined);
    if (Object.keys(nextErrors).length) return;
    try {
      if (id) { await update(id, draft); router.replace({ pathname: '/content/[id]', params: { id } }); }
      else { await add(draft); router.replace('/'); }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '저장하지 못했어요. 다시 시도해 주세요.');
      if (err instanceof DomainError && err.code === 'duplicate') setDuplicateId(err.duplicateId);
    }
  };
  return <Screen><ScreenHeader title={id ? '콘텐츠 수정' : '링크 추가'} /><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <UiText variant="hero">{id ? '저장한 내용을\n다듬어 보세요.' : '좋아한 순간을\n모아 두세요.'}</UiText><UiText muted style={styles.description}>링크를 저장하고, 알아볼 수 있는 이름을 붙여요.</UiText>
    <Field label="콘텐츠 링크" required error={errors.url}><TextInput accessibilityLabel="콘텐츠 링크" placeholder="https://…" autoCapitalize="none" autoCorrect={false} keyboardType="url" value={url} onChangeText={setUrl} style={[styles.input, errors.url && styles.inputError]} placeholderTextColor={tokens.color.secondary} /></Field>
    {url.trim() ? <View style={styles.source}><SourceBadge source={detectSource(url)} /></View> : null}
    <Field label="제목" required error={errors.title}><TextInput accessibilityLabel="제목" placeholder="다음에 가보고 싶은 곳, 기억할 콘텐츠" value={title} onChangeText={setTitle} maxLength={120} style={[styles.input, errors.title && styles.inputError]} placeholderTextColor={tokens.color.secondary} /></Field>
    <Field label="분류"><View style={styles.categories}>{CATEGORIES.map(item => <FilterChip key={item.id} label={item.label} selected={category === item.id} onPress={() => setCategory(item.id)} />)}</View></Field>
    <Field label="장소 이름" hint="선택 · 장소를 아직 몰라도 저장할 수 있어요"><TextInput accessibilityLabel="장소 이름" placeholder="예: 노들섬, 성수동 카페" value={placeName} onChangeText={setPlaceName} maxLength={120} style={styles.input} placeholderTextColor={tokens.color.secondary} /></Field>
    <Field label="나의 메모" hint="선택 · 왜 저장했는지 짧게 적어 두세요"><TextInput accessibilityLabel="나의 메모" placeholder="언제, 누구와 가고 싶은가요?" value={note} onChangeText={setNote} multiline maxLength={2000} textAlignVertical="top" style={[styles.input, styles.note]} placeholderTextColor={tokens.color.secondary} /></Field>
    <View style={styles.notice}><UiText variant="caption" muted>장소와 행사 날짜는 직접 확인해 주세요. 링크만으로 내용을 자동으로 읽어오지는 않아요.</UiText></View>
    {message || loadError ? <UiText accessibilityRole="alert" style={styles.error}>{message || loadError}</UiText> : null}
    {duplicateId ? <Pressable accessibilityRole="button" accessibilityLabel="이미 저장한 콘텐츠 보기" onPress={() => router.replace({ pathname: '/content/[id]', params: { id: duplicateId } })} style={{ paddingVertical: 12 }}><UiText style={{ color: tokens.color.accent }}>이미 저장한 콘텐츠 보기 →</UiText></Pressable> : null}
    <PrimaryButton label={id ? '수정 저장하기' : '저장하기'} icon="bookmark-outline" onPress={submit} loading={saving} disabled={loading || Boolean(loadError)} />
  </ScrollView></KeyboardAvoidingView></Screen>;
}
function Field({ label, hint, error, required, children }: React.PropsWithChildren<{ label: string; hint?: string; error?: string; required?: boolean }>) {
  return <View style={styles.field}><UiText style={styles.label}>{label}{required ? <UiText style={{ color: tokens.color.accent }}> *</UiText> : null}</UiText>{hint ? <UiText variant="caption" muted style={{ marginBottom: 8 }}>{hint}</UiText> : null}{children}{error ? <UiText variant="caption" accessibilityRole="alert" style={styles.error}>{error}</UiText> : null}</View>;
}
const styles = StyleSheet.create({ page: { padding: tokens.spacing.xl, paddingTop: tokens.spacing.lg, paddingBottom: tokens.spacing.xxl }, description: { marginTop: tokens.spacing.md, marginBottom: tokens.spacing.xl }, field: { marginBottom: tokens.spacing.xl }, label: { fontFamily: tokens.font.medium, marginBottom: tokens.spacing.sm }, input: { minHeight: tokens.control.height, borderWidth: 1, borderColor: tokens.color.border, borderRadius: tokens.radius.md, backgroundColor: tokens.color.surface, paddingHorizontal: tokens.spacing.lg, paddingVertical: tokens.spacing.md, color: tokens.color.ink, fontSize: 14, fontFamily: tokens.font.regular }, inputError: { borderColor: tokens.color.error }, note: { minHeight: 116 }, categories: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm }, source: { marginTop: -16, marginBottom: tokens.spacing.xl }, notice: { padding: tokens.spacing.lg, borderRadius: tokens.radius.md, backgroundColor: tokens.color.accentSoft, marginBottom: tokens.spacing.xl }, error: { color: tokens.color.error, marginVertical: tokens.spacing.sm } });

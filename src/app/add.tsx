import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View, Pressable, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { CATEGORIES, DomainError, validateDraft, detectSource, normalizeUrl, displayContentTitle, type ExternalMetadata, type Category, type DraftInput, type SavedContent } from '../domain/content';
import { integrationsApi } from '../features/integrations/api';
import { useLibrary } from '../features/library/LibraryProvider';
import { Screen, ScreenHeader } from '../components/Screen';
import { UiText } from '../components/UiText';
import { PrimaryButton } from '../components/PrimaryButton';
import { FilterChip } from '../components/FilterChip';
import { SourceBadge } from '../components/SourceBadge';
import { tokens } from '../theme/tokens';

export default function AddLinkScreen() {
  const { id, url } = useLocalSearchParams<{ id?: string; url?: string }>();
  const { items, loading } = useLibrary();
  const original = items.find(item => item.id === id);
  if (loading) return <Screen><ScreenHeader title="콘텐츠 준비" /><ActivityIndicator color={tokens.color.accent} /></Screen>;
  if (id && !original) return <Screen><ScreenHeader title="콘텐츠 수정" /><View style={styles.page}><UiText>수정할 콘텐츠를 찾을 수 없어요.</UiText><PrimaryButton label="저장함으로" onPress={() => router.replace('/')} /></View></Screen>;
  return <LinkForm key={id ?? 'new'} id={id} original={original} initialUrl={url} />;
}
function LinkForm({ id, original, initialUrl }: { id?: string; original?: SavedContent; initialUrl?: string }) {
  const { add, update, loading, saving, error: loadError } = useLibrary();
  const [title, setTitle] = useState(original ? displayContentTitle(original) : '');
  const [url, setUrl] = useState(original?.url ?? initialUrl ?? '');
  const [external, setExternal] = useState<ExternalMetadata | null>(original?.external ?? null);
  const [titleMode, setTitleMode] = useState<'manual' | 'external'>(original?.titleMode ?? 'manual');
  const [fetching, setFetching] = useState(false);
  const urlVersion = useRef(0);
  const metadataLock = useRef(false);
  const [category, setCategory] = useState<Category>(original?.category ?? 'other');
  const [placeName, setPlaceName] = useState(original?.placeName ?? '');
  const [note, setNote] = useState(original?.note ?? '');
  const [optionalOpen, setOptionalOpen] = useState(Boolean(original?.placeName || original?.note));
  const [errors, setErrors] = useState<Partial<Record<'url' | 'title', string>>>({});
  const [message, setMessage] = useState('');
  const [duplicateId, setDuplicateId] = useState<string | undefined>();
  const scrollRef = useRef<ScrollView>(null);
  const urlRef = useRef<TextInput>(null);
  const titleRef = useRef<TextInput>(null);

  const changeUrl = (value: string) => { urlVersion.current += 1; setUrl(value); setExternal(null); if (titleMode === 'external') setTitle(''); setTitleMode('manual'); setErrors(previous => ({ ...previous, url: undefined })); setMessage(''); setDuplicateId(undefined); };
  const pasteLink = async () => { try { const text = (await Clipboard.getStringAsync()).trim(); normalizeUrl(text); changeUrl(text); } catch (err) { setMessage(err instanceof Error ? err.message : '붙여넣을 링크를 확인해 주세요.'); } };
  const fetchTitle = async () => {
    if (metadataLock.current) return;
    metadataLock.current = true; setFetching(true); setMessage(''); const version = urlVersion.current;
    try { const result = await integrationsApi.metadata(normalizeUrl(url)); if (version !== urlVersion.current) return; setExternal(result); setTitle(result.title); setTitleMode('external'); setErrors(previous => ({ ...previous, title: undefined })); }
    catch (err) { if (version === urlVersion.current) setMessage(err instanceof Error ? err.message : '제목을 불러오지 못했어요. 직접 입력할 수 있어요.'); }
    finally { metadataLock.current = false; setFetching(false); }
  };

  const submit = async () => {
    const draft: DraftInput = { title: titleMode === 'external' ? (original?.title ?? '저장한 YouTube 영상') : title, url, category, placeName, note, titleMode, external,
      ...(original && original.placeName !== placeName ? { place: null } : {}) };
    const nextErrors = validateDraft(draft);
    setErrors(nextErrors); setMessage(''); setDuplicateId(undefined);
    if (Object.keys(nextErrors).length) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      if (nextErrors.url) urlRef.current?.focus();
      else titleRef.current?.focus();
      return;
    }
    try {
      if (id) { await update(id, draft); router.replace({ pathname: '/content/[id]', params: { id } }); }
      else { await add(draft); router.replace('/'); }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '저장하지 못했어요. 다시 시도해 주세요.');
      if (err instanceof DomainError && err.code === 'duplicate') setDuplicateId(err.duplicateId);
    }
  };

  return <Screen><ScreenHeader title={id ? '콘텐츠 수정' : '링크 추가'} />
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}><UiText variant="hero">{id ? '나의 취향을\n조금 더 자세하게.' : '좋아한 순간을\n모아두세요.'}</UiText><UiText muted style={styles.description}>링크와 제목만 있으면 시작할 수 있어요.</UiText></View>
        <Field label="콘텐츠 링크" required error={errors.url}>
          <TextInput ref={urlRef} accessibilityLabel="콘텐츠 링크" placeholder="https://…" autoCapitalize="none" autoCorrect={false} keyboardType="url" value={url} onChangeText={changeUrl} style={[styles.input, errors.url && styles.inputError]} placeholderTextColor={tokens.color.secondary} />
          <Pressable accessibilityRole="button" accessibilityLabel="클립보드에서 링크 붙여넣기" onPress={pasteLink} style={styles.paste}><Ionicons name="clipboard-outline" size={17} color={tokens.color.accent} /><UiText style={{ color: tokens.color.accentInk }}>링크 붙여넣기</UiText></Pressable>
        </Field>
        {url.trim() ? <View style={styles.source}><SourceBadge source={detectSource(url)} /></View> : null}
        <Field label="제목" required error={errors.title}>
          <TextInput ref={titleRef} accessibilityLabel="제목" placeholder="기억하고 싶은 콘텐츠 이름" value={title} onChangeText={value => { urlVersion.current += 1; setTitle(value); setTitleMode('manual'); setErrors(previous => ({ ...previous, title: undefined })); }} maxLength={120} style={[styles.input, errors.title && styles.inputError]} placeholderTextColor={tokens.color.secondary} />
          {detectSource(url) === 'youtube' && <View style={styles.metadata}><PrimaryButton label="YouTube에서 제목 불러오기" secondary loading={fetching} disabled={Platform.OS !== 'web'} onPress={fetchTitle} /><UiText variant="caption" muted>{Platform.OS !== 'web' ? '제목 불러오기는 현재 웹 개발 미리보기에서 지원해요.' : titleMode === 'external' ? 'YouTube에서 불러온 제목이에요. 30일 후에는 기본 제목으로 표시돼요.' : '영상 링크라면 제목을 불러올 수 있어요. 원하면 직접 수정해 주세요.'}</UiText></View>}
        </Field>
        <Field label="분류"><View style={styles.categories}>{CATEGORIES.map(item => <FilterChip key={item.id} label={item.label} selected={category === item.id} onPress={() => setCategory(item.id)} />)}</View></Field>

        <Pressable accessibilityRole="button" accessibilityLabel="장소와 메모 추가" accessibilityState={{ expanded: optionalOpen }} onPress={() => setOptionalOpen(value => !value)} style={styles.optionalControl}>
          <View style={styles.optionalTitle}><Ionicons name="create-outline" size={19} color={tokens.color.secondary} /><UiText style={styles.optionalLabel}>장소와 메모 추가<UiText variant="caption" muted> · 선택</UiText></UiText></View>
          <Ionicons name={optionalOpen ? 'chevron-up' : 'chevron-down'} size={16} color={tokens.color.secondary} />
        </Pressable>
        {optionalOpen && <View style={styles.optionalFields}>
          <Field label="장소 이름"><TextInput accessibilityLabel="장소 이름" placeholder="예: 노들섬, 성수동 카페" value={placeName} onChangeText={setPlaceName} maxLength={120} style={styles.input} placeholderTextColor={tokens.color.secondary} /></Field>
          <Field label="나의 메모"><TextInput accessibilityLabel="나의 메모" placeholder="언제, 누구와 가고 싶은가요?" value={note} onChangeText={setNote} multiline maxLength={2000} textAlignVertical="top" style={[styles.input, styles.note]} placeholderTextColor={tokens.color.secondary} /></Field>
        </View>}
        <View style={styles.notice}><Ionicons name="information-circle-outline" size={16} color={tokens.color.secondary} /><UiText variant="caption" muted style={styles.noticeText}>장소와 일정은 자동으로 가져오지 않아요. 저장할 때 직접 확인해 주세요.</UiText></View>
      </ScrollView>
      <View style={styles.saveBar}>
        {message || loadError ? <UiText variant="caption" accessibilityRole="alert" style={styles.error}>{message || loadError}</UiText> : null}
        {duplicateId ? <Pressable accessibilityRole="button" accessibilityLabel="이미 저장한 콘텐츠 보기" onPress={() => router.replace({ pathname: '/content/[id]', params: { id: duplicateId } })} style={styles.duplicate}><UiText style={{ color: tokens.color.accent }}>이미 저장한 콘텐츠 보기 →</UiText></Pressable> : null}
        <PrimaryButton label={id ? '수정 저장하기' : '저장하기'} icon="bookmark-outline" onPress={submit} loading={saving} disabled={loading || fetching || Boolean(loadError)} />
      </View>
    </KeyboardAvoidingView>
  </Screen>;
}
function Field({ label, error, required, children }: React.PropsWithChildren<{ label: string; error?: string; required?: boolean }>) {
  return <View style={styles.field}><UiText style={styles.label}>{label}{required ? <UiText style={{ color: tokens.color.accent }}> *</UiText> : null}</UiText>{children}{error ? <UiText variant="caption" accessibilityRole="alert" style={styles.error}>{error}</UiText> : null}</View>;
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: { paddingHorizontal: tokens.spacing.xl, paddingTop: tokens.spacing.lg, paddingBottom: tokens.spacing.xl },
  intro: { marginBottom: tokens.spacing.xl },
  description: { marginTop: tokens.spacing.sm },
  field: { marginBottom: tokens.spacing.xl },
  label: { fontFamily: tokens.font.medium, marginBottom: tokens.spacing.sm },
  input: { minHeight: tokens.control.height, borderWidth: 1, borderColor: tokens.color.surfaceMuted, borderRadius: tokens.radius.md, backgroundColor: tokens.color.surfaceMuted, paddingHorizontal: tokens.spacing.lg, paddingVertical: tokens.spacing.lg, color: tokens.color.ink, fontSize: 14, fontFamily: tokens.font.regular },
  inputError: { borderColor: tokens.color.error },
  note: { minHeight: 116 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm },
  source: { marginTop: -tokens.spacing.lg, marginBottom: tokens.spacing.xl, paddingLeft: tokens.spacing.xs },
  paste: { minHeight: tokens.control.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, paddingTop: tokens.spacing.xs },
  metadata: { gap: tokens.spacing.sm, marginTop: tokens.spacing.sm },
  optionalControl: { minHeight: 56, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: tokens.spacing.sm, borderTopWidth: 1, borderBottomWidth: 1, borderColor: tokens.color.border, marginBottom: tokens.spacing.lg, paddingVertical: tokens.spacing.md },
  optionalTitle: { flex: 1, flexDirection: 'row', gap: tokens.spacing.sm, alignItems: 'center' },
  optionalLabel: { flex: 1 },
  optionalFields: { marginTop: tokens.spacing.sm },
  notice: { flexDirection: 'row', gap: tokens.spacing.sm, alignItems: 'flex-start' },
  noticeText: { flex: 1 },
  saveBar: { paddingHorizontal: tokens.spacing.xl, paddingTop: tokens.spacing.md, paddingBottom: tokens.spacing.lg, backgroundColor: tokens.color.surface, borderTopWidth: 1, borderColor: tokens.color.border },
  error: { color: tokens.color.error, marginVertical: tokens.spacing.sm },
  duplicate: { minHeight: tokens.control.touchMin, justifyContent: 'center', paddingVertical: tokens.spacing.md },
});

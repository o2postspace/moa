import { useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { integrationsApi } from '../features/integrations/api';
import { PrimaryButton } from './PrimaryButton';
import { UiText } from './UiText';
import { InstagramFrame } from './InstagramFrame';
import { tokens } from '../theme/tokens';

export function InstagramEmbed({ url }: { url: string }) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  return <View style={{ marginTop: tokens.spacing.xl, gap: tokens.spacing.sm }}>
    <PrimaryButton label={html ? 'Instagram 원문 접기' : 'Instagram 원문 표시'} secondary icon="logo-instagram" disabled={Platform.OS !== 'web'} loading={loading} onPress={async () => {
      if (html) { setHtml(''); return; }
      if (lock.current) return; lock.current = true; setLoading(true); setError('');
      try { const result = await integrationsApi.instagramEmbed(url); setHtml(result.html); } catch (err) { setError(err instanceof Error ? err.message : '원문을 표시하지 못했어요. 원본 링크로 확인해 주세요.'); } finally { lock.current = false; setLoading(false); }
    }} />
    <UiText variant="caption" muted>{Platform.OS !== 'web' ? '원문 표시는 현재 웹 개발 미리보기에서 지원해요. 원본 보기로 확인해 주세요.' : '표시하면 Instagram에 연결돼요. 공개 게시물만 지원하며, 원문은 이 화면에서만 보여드려요.'}</UiText>
    {!!error && <UiText accessibilityRole="alert" variant="caption" style={{ color: tokens.color.error }}>{error}</UiText>}
    {!!html && <InstagramFrame html={html} />}
  </View>;
}

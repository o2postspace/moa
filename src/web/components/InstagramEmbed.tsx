import { useEffect, useRef, useState } from 'react';
import { detectSource, normalizeUrl } from '../../domain/content';
import { integrationsApi } from '../lib/api';
import { Button, Icon, Notice } from './Ui';

export function InstagramEmbed({ url }: { url: string }) {
  return <InstagramPreview key={url} url={url} />;
}

function InstagramPreview({ url }: { url: string }) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  let originalUrl = '';
  try { if (detectSource(url) === 'instagram') originalUrl = normalizeUrl(url); }
  catch { /* Invalid links cannot become an external action. */ }

  const toggle = async () => {
    if (html) { setHtml(''); return; }
    if (lock.current) return;
    lock.current = true;
    setLoading(true); setError('');
    try {
      const result = await integrationsApi.instagramEmbed(url);
      if (typeof result.html !== 'string' || !result.html || result.html.length > 250_000) throw new Error('공개 원문을 표시하지 못했어요. 원본 링크로 확인해 주세요.');
      if (active.current) setHtml(result.html);
    } catch (err) {
      if (active.current) setError(err instanceof Error ? err.message : '원문을 표시하지 못했어요. 원본 링크로 확인해 주세요.');
    } finally {
      lock.current = false;
      if (active.current) setLoading(false);
    }
  };

  return <section className="instagram-preview" aria-label="Instagram 공개 원문">
    <Button variant="secondary" icon="instagram" loading={loading} onClick={() => void toggle()} aria-expanded={Boolean(html)}>
      {html ? 'Instagram 원문 접기' : 'Instagram 원문 표시'}
    </Button>
    <p className="help-text">표시하면 Instagram에 연결돼요. 공개 게시물만 지원하며, 원문은 이 화면에서만 보여드려요.</p>
    {error && <><Notice kind="error">{error}</Notice>{originalUrl && <a href={originalUrl} target="_blank" rel="noopener noreferrer" className="text-link">Instagram 원본 열기 <Icon name="external-link" /></a>}</>}
    {html && <iframe
      title="Instagram 공개 게시물"
      className="instagram-frame"
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      referrerPolicy="no-referrer"
      srcDoc={`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src https://www.instagram.com; style-src 'unsafe-inline'; img-src https: data:; frame-src https://www.instagram.com; connect-src https://www.instagram.com; base-uri 'none'; form-action 'none'"><style>body{margin:0}iframe{height:640px!important;position:relative!important;min-width:0!important}blockquote.instagram-media{display:none!important}</style></head><body>${html}<script async src="https://www.instagram.com/embed.js"></script></body></html>`}
    />}
  </section>;
}

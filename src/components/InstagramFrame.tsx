import { Linking } from 'react-native';
import { WebView } from 'react-native-webview';

export function InstagramFrame({ html }: { html: string }) {
  return <WebView source={{ html: `<!doctype html><html lang="ko"><meta name="viewport" content="width=device-width, initial-scale=1"><body style="margin:0">${html}<script async src="https://www.instagram.com/embed.js"></script></body></html>` }} style={{ height: 650, flex: 0 }} originWhitelist={['about:blank', 'https://*.instagram.com']} onShouldStartLoadWithRequest={request => {
    if (request.url === 'about:blank') return true;
    try { const target = new URL(request.url); if (target.protocol !== 'https:' || !(target.hostname === 'instagram.com' || target.hostname.endsWith('.instagram.com'))) return false; if (!request.isTopFrame) return true; Linking.openURL(target.href).catch(() => {}); } catch { /* Invalid navigation is blocked. */ }
    return false;
  }} />;
}

export function InstagramFrame({ html }: { html: string }) {
  // The opaque sandbox cannot use Instagram's parent-origin resize handshake.
  // Give the official nested frame its own scrollable display area instead.
  return <iframe title="Instagram 공개 게시물" srcDoc={`<!doctype html><html lang="ko"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0}iframe{height:640px!important;position:relative!important;min-width:0!important}blockquote.instagram-media{display:none!important}</style><body>${html}<script async src="https://www.instagram.com/embed.js"></script></body></html>`} sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" style={{ border: 0, width: '100%', height: 650 }} />;
}

/**
 * Proxy HLS për Netlify Functions (Node 18+, fetch i integruar).
 *
 * Instalim:
 *   1. Ruaje si  netlify/functions/proxy.js  në repo-n që deploy-on te Netlify.
 *   2. Netlify → Site settings → Environment variables: ALLOWED_ORIGINS=https://sajti-yt.netlify.app
 *   3. PROXY_URL = https://sajti-yt.netlify.app/.netlify/functions/proxy
 *
 * Përdorimi: GET /.netlify/functions/proxy?url=<URL e koduar>   |   ?ping=1
 *
 * Shënim: Netlify Functions kanë kufi kohe dhe madhësie përgjigjeje (~6 MB); i përshtatet
 * playlistave dhe segmenteve të vogla, por Cloudflare Worker është zgjedhje më e mirë për video.
 */
const BLOCKED_HOST = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1\]?$|\[?f[cd])/i;

exports.handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin || '';
  const allowedList = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const cors = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    Vary: 'Origin',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (origin && !(allowedList.includes('*') || allowedList.includes(origin))) {
    return { statusCode: 403, body: 'Forbidden origin' };
  }
  const q = event.queryStringParameters || {};
  if (q.ping === '1') return { statusCode: 200, headers: { ...cors, 'Content-Type': 'text/plain' }, body: 'mini-iptv-proxy' };

  let t;
  try { t = new URL(q.url); } catch { return { statusCode: 400, headers: cors, body: 'Missing or invalid url' }; }
  if (!/^https?:$/.test(t.protocol) || BLOCKED_HOST.test(t.hostname)) {
    return { statusCode: 400, headers: cors, body: 'Target not allowed' };
  }

  const self = `https://${event.headers.host}${event.path}`;
  const upstream = await fetch(t.toString(), {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MiniIPTV-Proxy)', Referer: `${t.origin}/` },
    redirect: 'follow',
  });
  const ctype = upstream.headers.get('content-type') || '';
  const isPlaylist = /mpegurl/i.test(ctype) || /\.m3u8?($|\?)/i.test(t.pathname);

  if (isPlaylist && upstream.ok) {
    const text = await upstream.text();
    if (!text.trimStart().startsWith('#EXTM3U')) return { statusCode: 502, headers: cors, body: 'Not a playlist' };
    const base = upstream.url || t.toString();
    const wrap = (u) => `${self}?url=${encodeURIComponent(new URL(u, base).toString())}`;
    const body = text.split(/\r?\n/).map((line) => {
      if (!line.trim()) return line;
      if (line.startsWith('#')) return line.replace(/URI="([^"]+)"/g, (_m, u) => `URI="${wrap(u)}"`);
      return wrap(line.trim());
    }).join('\n');
    return { statusCode: 200, headers: { ...cors, 'Content-Type': 'application/vnd.apple.mpegurl' }, body };
  }

  const buf = Buffer.from(await upstream.arrayBuffer());
  return {
    statusCode: upstream.status,
    headers: { ...cors, 'Content-Type': ctype || 'application/octet-stream' },
    body: buf.toString('base64'),
    isBase64Encoded: true,
  };
};

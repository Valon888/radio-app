/**
 * Proxy HLS për Cloudflare Workers (CORS + HTTP→HTTPS + rishkrim playlistash).
 *
 * Instalim:
 *   1. Cloudflare Dashboard → Workers & Pages → Create → Worker → ngjit këtë skedar.
 *      (ose nga terminali: cd proxy && npx wrangler deploy — shih wrangler.toml)
 *   2. ALLOWED_ORIGINS = https://valon888.github.io  (te wrangler.toml ose Settings → Variables; presje për shumë)
 *      MOS e lër bosh; përndryshe proxy-ja jote bëhet publike për kë të dojë.
 *   3. Vendos URL-në e Worker-it te config:  window.MINI_IPTV_CONFIG = { PROXY_URL: 'https://emri.workers.dev' }
 *
 * Përdorimi: GET https://emri.workers.dev/?url=<URL e koduar>     |   GET /?ping=1
 *
 * Kufizime: Worker-i falas ka kuotë ditore kërkesash; aplikacioni e përdor proxy-n vetëm kur
 * lidhja direkte nuk është e mundur (CORS / mixed content).
 */
const BLOCKED_HOST = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1\]?$|\[?f[cd])/i;

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Expose-Headers': '*',
    Vary: 'Origin',
  };
}

function allowed(env, origin) {
  const list = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!list.length) return false; // pa konfigurim = i mbyllur
  return list.includes('*') || (origin && list.includes(origin));
}

function rewrite(text, base, selfUrl, ref) {
  const abs = (u) => { try { return new URL(u, base).toString(); } catch { return u; } };
  const wrap = (u) => `${selfUrl}?url=${encodeURIComponent(abs(u))}${ref ? `&ref=${encodeURIComponent(ref)}` : ''}`;
  return text.split(/\r?\n/).map((line) => {
    if (!line.trim()) return line;
    if (line.startsWith('#')) return line.replace(/URI="([^"]+)"/g, (_m, u) => `URI="${wrap(u)}"`);
    return wrap(line.trim());
  }).join('\n');
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const reqUrl = new URL(request.url);
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (origin && !allowed(env, origin)) return new Response('Forbidden origin', { status: 403 });

    if (reqUrl.searchParams.get('ping') === '1') {
      return new Response('mini-iptv-proxy', { headers: { ...cors, 'Content-Type': 'text/plain' } });
    }

    const target = reqUrl.searchParams.get('url');
    let t;
    try { t = new URL(target); } catch { return new Response('Missing or invalid url', { status: 400, headers: cors }); }
    if (!/^https?:$/.test(t.protocol) || BLOCKED_HOST.test(t.hostname)) {
      return new Response('Target not allowed', { status: 400, headers: cors });
    }

    // Workers refuzojnë IP të zhveshura (error 1003); sslip.io zgjidhet te e njëjta IP
    if (t.protocol === 'http:' && /^\d{1,3}(\.\d{1,3}){3}$/.test(t.hostname)) {
      t.hostname = `${t.hostname.replace(/\./g, '-')}.sslip.io`;
    }

    // Referer opsional (nga #EXTVLCOPT:http-referrer), vetëm http(s)
    const refRaw = reqUrl.searchParams.get('ref') || '';
    const ref = /^https?:\/\//i.test(refRaw) ? refRaw : '';

    // niveli 0: me Referer (i dhënë ose origjina e burimit); niveli 1: pa Referer, pasi disa host-e
    // kthejnë 401/403 kur e shohin (njësoj si server.js)
    const range = request.headers.get('Range');
    const grab = (withReferer) => fetch(t.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MiniIPTV-Proxy)',
        ...(withReferer ? { Referer: ref || `${t.origin}/` } : {}),
        ...(range ? { Range: range } : {}),
      },
      redirect: 'follow',
    });
    let upstream;
    try {
      upstream = await grab(true);
      if ((upstream.status === 401 || upstream.status === 403) && !ref) upstream = await grab(false);
    } catch {
      return new Response('Upstream unreachable', { status: 502, headers: cors });
    }

    const ctype = upstream.headers.get('content-type') || '';
    const isPlaylist = /mpegurl/i.test(ctype) || /\.m3u8?($|\?)/i.test(t.pathname);
    if (isPlaylist && upstream.ok) {
      const body = await upstream.text();
      if (!body.trimStart().startsWith('#EXTM3U')) return new Response('Not a playlist', { status: 502, headers: cors });
      const self = `${reqUrl.origin}${reqUrl.pathname}`;
      return new Response(rewrite(body, upstream.url || t.toString(), self, ref), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/vnd.apple.mpegurl', 'Cache-Control': 'no-cache' },
      });
    }

    const headers = new Headers(upstream.headers);
    for (const [k, v] of Object.entries(cors)) headers.set(k, v);
    headers.delete('set-cookie');
    return new Response(upstream.body, { status: upstream.status, headers });
  },
};

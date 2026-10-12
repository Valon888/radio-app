/* ==========================================================================
   tools/proxy-worker.mjs - Proxy i vogël për Cloudflare Workers (shembull)

   Pse: zgjidh CORS dhe "mixed content" (burim http në faqe https) për burimet
   që nuk mund t'i luash drejtpërdrejt. Rishkruan playlist-at .m3u8 që edhe
   segmentet të kalojnë nga proxy.

   SIGURIA (e rëndësishme): nuk është proxy i hapur. Lejon vetëm hostet që i
   liston ti te ALLOWED_HOSTS dhe vetëm origjinat te ALLOWED_ORIGINS.
   Në Cloudflare -> Worker -> Settings -> Variables:
     ALLOWED_HOSTS   = live1.mediadesk.al,tv.panorama.com.al        (host pas hosti, pa hapësira)
     ALLOWED_ORIGINS = https://valon888.github.io                   (faqja jote)
   Burimet e segmenteve mund të jenë në host tjetër nga manifesti: shtoji edhe ata.

   Përdorimi në app (një nga të dyja):
     window.IPTV_PROXY_URL = 'https://emri-yt.workers.dev/?url=';   // në index.html
     localStorage.setItem('miniiptv_proxy', 'https://emri-yt.workers.dev/?url=');
   ========================================================================== */
const list = (v) => (v || '').split(',').map((s) => s.trim()).filter(Boolean);

export default {
  async fetch(request, env) {
    const origins = list(env.ALLOWED_ORIGINS);
    const hosts = list(env.ALLOWED_HOSTS);
    const origin = request.headers.get('Origin') || '';

    const cors = {
      'Access-Control-Allow-Origin': origins.includes(origin) ? origin : (origins[0] || 'null'),
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Content-Type',
      Vary: 'Origin'
    };
    const fail = (status, msg) => new Response(msg, { status, headers: cors });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'GET' && request.method !== 'HEAD') return fail(405, 'Metodë e palejuar');
    if (origin && origins.length && !origins.includes(origin)) return fail(403, 'Origjinë e palejuar');

    const self = new URL(request.url);
    let target;
    try { target = new URL(self.searchParams.get('url') || ''); } catch { return fail(400, 'Parametri url mungon ose është i gabuar'); }
    if (target.protocol !== 'http:' && target.protocol !== 'https:') return fail(400, 'Vetëm http/https');
    if (!hosts.includes(target.hostname)) return fail(403, 'Hosti nuk lejohet: ' + target.hostname);

    const headers = new Headers();
    const range = request.headers.get('Range');
    if (range) headers.set('Range', range);
    headers.set('User-Agent', 'Mozilla/5.0 (MiniIPTV proxy)');

    let upstream;
    try { upstream = await fetch(target.href, { method: request.method, headers, redirect: 'follow' }); }
    catch { return fail(502, 'Burimi nuk u përgjigj'); }

    const type = upstream.headers.get('Content-Type') || '';
    const isPlaylist = /mpegurl/i.test(type) || /\.m3u8$/i.test(target.pathname);
    const out = new Headers(cors);
    if (type) out.set('Content-Type', type);

    if (!isPlaylist || request.method === 'HEAD') {
      const len = upstream.headers.get('Content-Length');
      const cr = upstream.headers.get('Content-Range');
      if (len) out.set('Content-Length', len);
      if (cr) out.set('Content-Range', cr);
      return new Response(upstream.body, { status: upstream.status, headers: out });
    }

    const base = upstream.url || target.href;
    const wrap = (u) => `${self.origin}${self.pathname}?url=${encodeURIComponent(new URL(u, base).href)}`;
    const text = (await upstream.text())
      .split(/\r?\n/)
      .map((line) => {
        if (!line.trim()) return line;
        if (line.startsWith('#')) return line.replace(/URI="([^"]+)"/g, (_, u) => `URI="${wrap(u)}"`);
        return wrap(line.trim());
      })
      .join('\n');
    out.set('Cache-Control', 'no-store');
    return new Response(text, { status: upstream.status, headers: out });
  }
};

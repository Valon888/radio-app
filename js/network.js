/**
 * Zbulimi dhe përdorimi i proxy-t (CORS, certifikata të prishura, mixed content).
 *
 * Dy mënyra:
 *  - 'local'  : server.js i këtij projekti (/proxy?url=...), mund ta përdorim si rrugë të parë
 *  - 'remote' : PROXY_URL i konfiguruar nga ti (Cloudflare Worker / Netlify Function), përdoret
 *               si rezervë (për të kursyer kuotën) ose e vetmja rrugë për http:// në faqe https://
 */
import { CONFIG } from './config.js';

let state = { mode: null, base: null };
let detecting = null;

async function ping(base) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 4000);
    const r = await fetch(`${base}${base.includes('?') ? '&' : '?'}ping=1`, { cache: 'no-store', signal: ctl.signal });
    clearTimeout(t);
    return r.ok && (await r.text()).trim() === 'mini-iptv-proxy';
  } catch {
    return false;
  }
}

export function detectProxy() {
  if (detecting) return detecting;
  detecting = (async () => {
    if (CONFIG.PROXY_URL) {
      const base = CONFIG.PROXY_URL.replace(/\/+$/, '');
      if (await ping(base)) { state = { mode: 'remote', base }; return state; }
      console.warn('[proxy] PROXY_URL nuk u përgjigj te ping; po e injoroj.');
    }
    if (await ping('/proxy')) state = { mode: 'local', base: '/proxy' };
    return state;
  })();
  return detecting;
}

export const proxyState = () => state;

/** URL-ja e kalon përmes proxy-t, ose null nëse nuk ka proxy. */
export function viaProxy(url) {
  if (!state.base) return null;
  return `${state.base}?url=${encodeURIComponent(url)}`;
}

export const isHttp = (u) => /^http:\/\//i.test(u);
export const pageIsHttps = () => location.protocol === 'https:';

/**
 * Radhët e URL-ve që do provohen për një burim, sipas politikës:
 *  - mixed content (http në faqe https): vetëm proxy (ose asgjë)
 *  - proxy lokal: proxy fillimisht (kalon CORS dhe certifikata), pastaj direkt
 *  - proxy i largët: direkt fillimisht (kursen kuotën), pastaj proxy
 *  - pa proxy: vetëm direkt
 */
export function candidatesFor(url, kind) {
  const proxied = viaProxy(url);
  const mixed = pageIsHttps() && isHttp(url);
  if (mixed) return proxied ? [{ url: proxied, via: 'proxy' }] : [];
  if (!proxied) return [{ url, via: 'direct' }];
  // audio direkt luhet pa CORS, ndaj direkt është zakonisht më i mirë
  if (kind === 'audio') return [{ url, via: 'direct' }, { url: proxied, via: 'proxy' }];
  if (state.mode === 'local') return [{ url: proxied, via: 'proxy' }, { url, via: 'direct' }];
  return [{ url, via: 'direct' }, { url: proxied, via: 'proxy' }];
}

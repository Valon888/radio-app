/**
 * Konfigurimi i aplikacionit.
 * Mund ta mbivendosësh pa prekur kodin duke përcaktuar para skripteve:
 *   <script>window.MINI_IPTV_CONFIG = { PROXY_URL: 'https://proxy.shembull.workers.dev' };</script>
 */
const DEFAULTS = {
  // Proxy opsional për CORS / mixed content kur aplikacioni hostohet në HTTPS (shih README).
  // Bosh = përdor /proxy lokal të server.js nëse ekziston.
  // Formati i pritur: `${PROXY_URL}?url=<URL-ja e koduar>`
  PROXY_URL: '',

  // Bibliotekat e luajtjes (version i fiksuar)
  HLS_JS_URL: 'https://cdn.jsdelivr.net/npm/hls.js@1.5.7/dist/hls.min.js',
  MPEGTS_JS_URL: 'https://cdn.jsdelivr.net/npm/mpegts.js@1.7.3/dist/mpegts.js',

  // Të dhënat
  CHANNELS_URL: 'data/channels.json',
  HEALTH_URL: 'data/health.json',
  EPG_URL: 'data/epg.json',

  // Rilidhja automatike
  STARTUP_TIMEOUT_MS: 15000, // sa pritet për kuadrin e parë
  STALL_TIMEOUT_MS: 12000, // pa progres të luajtjes => rilidhu
  MAX_RECONNECTS: 4, // rilidhje për të njëjtin burim para se të kalojë te tjetri
  RECONNECT_BASE_MS: 1000, // 1s, 2s, 4s, 8s...
  RECONNECT_MAX_MS: 15000,

  // Health-check në shfletues
  HEALTH_CONCURRENCY: 5,
  HEALTH_TIMEOUT_MS: 8000,
  HEALTH_SLOW_MS: 4000,
  HEALTH_TTL_MS: 6 * 60 * 60 * 1000, // 6 orë
  HEALTH_AUTO_PRIORITY: true, // testo në sfond Kosovë/Shqipëri/të preferuarat

  // UI
  LIST_CHUNK: 120,
  NUMBER_KEY_TIMEOUT_MS: 1500,
};

export const CONFIG = Object.freeze({ ...DEFAULTS, ...(window.MINI_IPTV_CONFIG || {}) });

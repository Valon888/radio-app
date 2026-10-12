/**
 * Health-check i kanaleve: Online / Ngadalë / Offline (+ Bllokuar / E panjohur).
 *
 * Burimet e informacionit (në rend rritës të përparësisë):
 *   1. data/health.json         (gjeneruar nga tools/check-channels.js)
 *   2. localStorage me TTL       (rezultatet e testeve të mëparshme në këtë shfletues)
 *   3. testet e drejtpërdrejta   (në sfond, paralelizëm i kufizuar)
 *
 * Shënim: pa proxy, shfletuesi nuk mund të lexojë manifestet pa CORS; ato mbeten "unknown"
 * dhe NUK shënohen offline në mënyrë të gabuar.
 */
import { CONFIG } from './config.js';
import { storage } from './storage.js';
import { candidatesFor } from './network.js';

const RANK = { online: 0, slow: 1, unknown: 2, blocked: 3, offline: 4 };

export class HealthMonitor extends EventTarget {
  constructor() {
    super();
    /** @type {Map<string,{s:string,ms?:number,t:number,reason?:string}>} */
    this.results = new Map();
    this.queue = [];
    this.running = 0;
    this.total = 0;
    this.completed = 0;
    this._notifyTimer = null;
    this._token = 0;
  }

  async init() {
    // 1) skedari statik nga mjeti i terminalit
    try {
      const r = await fetch(CONFIG.HEALTH_URL, { cache: 'no-cache' });
      if (r.ok) {
        const data = await r.json();
        for (const [url, v] of Object.entries(data.results || {})) this.results.set(url, v);
      }
    } catch { /* nuk është e detyrueshme */ }
    // 2) cache lokal (mbivendos statik sepse është më i ri)
    const cached = storage.get('health', {});
    for (const [url, v] of Object.entries(cached)) {
      const cur = this.results.get(url);
      if (!cur || v.t > cur.t) this.results.set(url, v);
    }
    this._emit();
  }

  /** Gjendja e kombinuar e një kanali (burimi më i mirë). */
  statusOf(channel) {
    let best = null;
    let tested = 0;
    for (const s of channel.sources) {
      const v = this.results.get(s.url);
      if (!v) continue;
      tested++;
      if (best === null || (RANK[v.s] ?? RANK.unknown) < (RANK[best] ?? RANK.unknown)) best = v.s;
    }
    if (best === null) return 'unknown';
    // disa burime ende të patestuara: mos e shpall offline pa i provuar të gjitha
    if (best === 'offline' && tested < channel.sources.length) return 'unknown';
    return best;
  }

  sourceStatus(url) {
    return this.results.get(url)?.s || 'unknown';
  }

  /** Burimet e renditura: ato që punojnë fillimisht, ato offline në fund. */
  orderedSources(channel) {
    return channel.sources
      .map((s, i) => ({ s, i, r: RANK[this.sourceStatus(s.url)] ?? RANK.unknown }))
      .sort((a, b) => a.r - b.r || a.i - b.i)
      .map((x) => x.s);
  }

  markPlayback(url, ok, reason = '') {
    this.results.set(url, { s: ok ? 'online' : 'offline', t: Date.now(), ...(reason ? { reason } : {}) });
    this._persist();
    this._emit();
  }

  /** Vë në radhë kanalet për test (një URL për kanal, burimi i parë ende i patestuar/i vjetër). */
  enqueue(channels, { force = false } = {}) {
    const now = Date.now();
    let added = 0;
    for (const ch of channels) {
      for (const s of ch.sources) {
        const v = this.results.get(s.url);
        if (!force && v && now - v.t < CONFIG.HEALTH_TTL_MS && v.s !== 'unknown') continue;
        if (this.queue.some((q) => q.url === s.url)) continue;
        this.queue.push({ url: s.url, kind: s.kind });
        added++;
      }
    }
    this.total += added;
    this._pump();
    return added;
  }

  cancel() {
    this._token++;
    this.queue = [];
    this.total = this.completed = 0;
    this._emit();
  }

  get progress() {
    return { done: this.completed, total: this.total, active: this.running > 0 || this.queue.length > 0 };
  }

  _pump() {
    const token = this._token;
    while (this.running < CONFIG.HEALTH_CONCURRENCY && this.queue.length) {
      const job = this.queue.shift();
      this.running++;
      this._test(job).then((res) => {
        if (token !== this._token) return;
        this.results.set(job.url, { ...res, t: Date.now() });
      }).finally(() => {
        this.running--;
        this.completed++;
        this._persistSoon();
        this._emit();
        if (token === this._token) this._pump();
      });
    }
  }

  async _test({ url, kind }) {
    const cands = candidatesFor(url, kind);
    if (!cands.length) return { s: 'unknown', reason: 'http në faqe https pa proxy' };
    const cand = cands[0];
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), CONFIG.HEALTH_TIMEOUT_MS);
    const t0 = performance.now();
    try {
      const isAudio = kind === 'audio';
      const res = await fetch(cand.url, {
        signal: ctl.signal,
        cache: 'no-store',
        headers: isAudio ? { Range: 'bytes=0-1023' } : undefined,
      });
      const ms = Math.round(performance.now() - t0);
      if (res.status === 401 || res.status === 403) return { s: 'blocked', reason: `HTTP ${res.status}`, ms };
      if (!res.ok && res.status !== 206) return { s: 'offline', reason: `HTTP ${res.status}`, ms };
      if (isAudio) {
        ctl.abort();
        return { s: ms > CONFIG.HEALTH_SLOW_MS ? 'slow' : 'online', ms };
      }
      const text = await res.text();
      const total = Math.round(performance.now() - t0);
      if (!text.trimStart().startsWith('#EXTM3U')) return { s: 'offline', reason: 'jo playlist HLS', ms: total };
      return { s: total > CONFIG.HEALTH_SLOW_MS ? 'slow' : 'online', ms: total };
    } catch (e) {
      if (e.name === 'AbortError') {
        // timeout te proxy ose te burimi: nuk e dimë me siguri nga ana e klientit
        return { s: cand.via === 'proxy' ? 'offline' : 'unknown', reason: 'timeout' };
      }
      // TypeError = CORS ose rrjeti; pa proxy nuk mund ta dallojmë
      return { s: cand.via === 'proxy' ? 'offline' : 'unknown', reason: cand.via === 'proxy' ? 'proxy: gabim' : 'CORS/rrjet' };
    } finally {
      clearTimeout(timer);
    }
  }

  _persistSoon() {
    clearTimeout(this._persistTimer);
    this._persistTimer = setTimeout(() => this._persist(), 1500);
  }

  _persist() {
    const out = {};
    const cutoff = Date.now() - CONFIG.HEALTH_TTL_MS;
    for (const [url, v] of this.results) if (v.t > cutoff && v.s !== 'unknown') out[url] = v;
    storage.set('health', out, CONFIG.HEALTH_TTL_MS);
  }

  _emit() {
    if (this._notifyTimer) return;
    this._notifyTimer = setTimeout(() => {
      this._notifyTimer = null;
      this.dispatchEvent(new CustomEvent('change', { detail: this.progress }));
    }, 250);
  }
}

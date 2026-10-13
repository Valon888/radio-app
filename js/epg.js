/**
 * EPG bazik nga data/epg.json (opsional). Formati:
 *   { "<id kanali ose emri>": [ { "start": "2025-01-01T20:00:00Z", "end": "...", "title": "..." }, ... ] }
 * Çelësi mund të jetë id i kanalit (p.sh. "RTK1.xk"), id pa "@SD", ose emri i normalizuar.
 * Për XMLTV përdor: node tools/xmltv-to-json.js guide.xml > data/epg.json
 * Nëse skedari mungon, EPG thjesht nuk shfaqet.
 */
import { CONFIG } from './config.js';

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

export class Epg {
  constructor() { this.data = null; this.index = new Map(); }

  async load() {
    try {
      const r = await fetch(CONFIG.EPG_URL, { cache: 'no-cache' });
      if (!r.ok) return false;
      this.data = await r.json();
      for (const [k, v] of Object.entries(this.data)) {
        if (!Array.isArray(v)) continue;
        const prog = v.map((p) => ({ start: Date.parse(p.start), end: Date.parse(p.end), title: p.title }))
          .filter((p) => p.title && p.start && p.end).sort((a, b) => a.start - b.start);
        this.index.set(norm(k), prog);
        this.index.set(norm(k.replace(/@.*$/, '')), prog);
      }
      return this.index.size > 0;
    } catch {
      return false;
    }
  }

  /** @returns {{now:string|null,next:string|null}|null} */
  lookup(channel, at = Date.now()) {
    if (!this.index.size) return null;
    const keys = [channel.id, String(channel.id).replace(/@.*$/, ''), channel.name];
    for (const k of keys) {
      const prog = this.index.get(norm(k));
      if (!prog) continue;
      const i = prog.findIndex((p) => p.start <= at && at < p.end);
      if (i >= 0) return { now: prog[i].title, next: prog[i + 1] ? prog[i + 1].title : null };
      const upcoming = prog.find((p) => p.start > at);
      if (upcoming) return { now: null, next: upcoming.title };
    }
    return null;
  }
}

#!/usr/bin/env node
/**
 * Importon kanalet nga tvmak.com (faqe publike me stream falas, pa regjistrim):
 *   1) lexon faqen kryesore (listën e kanaleve), 2) çdo faqe kanali (titulli + videoSrc),
 *   3) heq query-n (është vetëm cache-buster), 4) testo me lidhje të vërtetë (manifest -> segment) dhe
 *      pranon vetëm transmetime LIVE (jo playlist me #EXT-X-ENDLIST, që janë klip/vendmbajtës).
 * Shkruan data/sources/tvmak/tvmak.m3u dhe SOURCE.json (pa tokena).
 *
 *   node tools/import-tvmak.js [--concurrency=8] [--timeout=12000]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { inspectUrl, isAdult, toM3U } = require('./lib/iptv-filters');

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v === undefined ? true : v];
}));
const CONCURRENCY = Number(args.concurrency) || 8;
const TIMEOUT = Number(args.timeout) || 12000;
const BASE = 'https://tvmak.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const OUT_DIR = path.resolve(__dirname, '..', 'data', 'sources', 'tvmak');

async function get(url, { text = true, range = false, referer } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const headers = { 'User-Agent': UA };
    if (referer) headers.Referer = referer;
    if (range) headers.Range = 'bytes=0-2047';
    const res = await fetch(url, { signal: ctl.signal, redirect: 'follow', headers });
    if (!text) { const b = Buffer.from(await res.arrayBuffer()); return { res, body: b }; }
    return { res, body: await res.text() };
  } finally { clearTimeout(timer); }
}

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();

async function probeLive(url, referer) {
  try {
    const { res, body } = await get(url, { referer });
    if (res.status !== 200) return { ok: false, why: `HTTP ${res.status}` };
    if (!body.trimStart().startsWith('#EXTM3U')) return { ok: false, why: 'jo playlist HLS' };
    const lines = body.split(/\r?\n/);
    let list = body;
    let base = res.url || url;
    let lastMod = res.headers.get('last-modified');
    const variant = lines.find((l) => l && !l.startsWith('#') && /\.m3u8/i.test(l));
    if (/#EXT-X-STREAM-INF/.test(body) && variant) {
      base = new URL(variant, base).toString();
      const v = await get(base, { referer });
      if (v.res.status !== 200) return { ok: false, why: `variant HTTP ${v.res.status}` };
      list = v.body;
      lastMod = v.res.headers.get('last-modified');
    }
    // playlist i ngrirë (pa ENDLIST por i pandryshuar prej muajsh) = klip statik, jo live
    if (lastMod && Date.now() - Date.parse(lastMod) > 24 * 3600e3) return { ok: false, why: 'playlist i ngrirë (Last-Modified > 24h)' };
    if (/#EXT-X-ENDLIST/.test(list)) return { ok: false, why: 'klip/VOD (ENDLIST), jo live' };
    const seg = list.split(/\r?\n/).find((l) => l && !l.startsWith('#'));
    if (!seg) return { ok: false, why: 'pa segmente' };
    const s = await get(new URL(seg, base).toString(), { text: false, range: true, referer });
    if (![200, 206].includes(s.res.status) || s.body.length < 512) return { ok: false, why: `segment HTTP ${s.res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, why: e.name === 'AbortError' ? 'timeout' : String((e.cause && e.cause.code) || e.message).slice(0, 40) };
  }
}

async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const it = items[i++]; await fn(it); }
  }));
}

(async () => {
  const home = (await get(BASE + '/')).body;
  const slugs = new Map(); // lowercase -> slug i parë
  for (const m of home.matchAll(/href="https?:\/\/(?:www\.)?tvmak\.com\/([A-Za-z0-9_-]+)"/g)) {
    const s = m[1];
    if (/^(img|kontakt|web|assets|index)$/i.test(s)) continue;
    if (!slugs.has(s.toLowerCase())) slugs.set(s.toLowerCase(), s);
  }
  console.log(`Faqe kanalesh: ${slugs.size}`);

  const found = [];
  const rejected = {};
  await pool([...slugs.values()], CONCURRENCY, async (slug) => {
    try {
      const { res, body } = await get(`${BASE}/${slug}`);
      if (res.status !== 200) { rejected[slug] = `faqe HTTP ${res.status}`; return; }
      const src = (/var videoSrc = '([^']+)'/.exec(body) || [])[1];
      const title = decode(((/<b>([^<]+)<\/b>\s*<\/div>/.exec(body) || [])[1]) || ((/<title>([^<]*?)\s*-\s*TvMAK/i.exec(body) || [])[1]) || slug);
      if (!src) { rejected[slug] = 'pa videoSrc'; return; }
      let url;
      try { const u = new URL(src, BASE); u.search = ''; url = u.toString(); } catch { rejected[slug] = 'URL e pavlefshme'; return; }
      const chk = inspectUrl(url);
      if (chk.error) { rejected[slug] = chk.error; return; }
      if (isAdult({ name: title })) { rejected[slug] = 'adult'; return; }
      found.push({ slug, name: title, url: chk.url });
    } catch (e) { rejected[slug] = e.name === 'AbortError' ? 'timeout faqe' : String(e.message).slice(0, 40); }
  });

  // dedupe sipas URL (disa slug-e e kanë të njëjtin stream)
  const byUrl = new Map();
  for (const f of found) if (!byUrl.has(f.url)) byUrl.set(f.url, f);
  const uniq = [...byUrl.values()];
  console.log(`URL unike: ${uniq.length}; po testoj...`);

  const good = [];
  await pool(uniq, CONCURRENCY * 2, async (f) => {
    const r = await probeLive(f.url);
    if (r.ok) good.push(f); else rejected[f.slug] = r.why;
  });
  good.sort((a, b) => a.name.localeCompare(b.name));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const entries = good.map((f) => ({ id: `tvmak.${f.slug.toLowerCase()}`, name: f.name, group: '', url: f.url }));
  fs.writeFileSync(path.join(OUT_DIR, 'tvmak.m3u'), toM3U(entries));
  const reasons = {};
  for (const v of Object.values(rejected)) reasons[v] = (reasons[v] || 0) + 1;
  fs.writeFileSync(path.join(OUT_DIR, 'SOURCE.json'), JSON.stringify({
    source: 'https://tvmak.com/ (faqe publike)', imported: new Date().toISOString().slice(0, 10),
    pages: slugs.size, uniqueUrls: uniq.length, live: good.length, rejected: reasons,
  }, null, 2));
  console.log(`Live: ${good.length}/${uniq.length}. Refuzuar:`, reasons);
  console.log(good.map((g) => g.name).join(', '));
})().catch((e) => { console.error(e); process.exit(1); });

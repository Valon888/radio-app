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
    // encoder-at e tvmak nisin sipas kërkesës: playlist-i fillon nga sekuenca 0 dhe rritet. Një pamje e vetme mund
    // të jetë klip që do mbyllet me ENDLIST, ndaj te fillimi rilexohet pas pak: duhet të rritet dhe të mos mbyllet.
    const seqOf = (t) => Number((/#EXT-X-MEDIA-SEQUENCE:(\d+)/.exec(t) || [])[1] || 0);
    const segCount = (t) => t.split(/\r?\n/).filter((l) => l && !l.startsWith('#')).length;
    // klipet e tvmak rriten deri në ~5 segmente e mbyllen me ENDLIST; live i vërtetë e lëviz dritaren (sekuenca rritet)
    if (seqOf(list) < 30) {
      let verdict = null;
      for (let i = 0; i < 8 && !verdict; i++) {
        await new Promise((r) => setTimeout(r, 10000));
        const again = (await get(base, { referer })).body;
        if (/#EXT-X-ENDLIST/.test(again)) verdict = { ok: false, why: 'klip/VOD (ENDLIST pas pak), jo live' };
        else if (seqOf(again) > 0 && seqOf(again) !== seqOf(list)) { list = again; verdict = { ok: true }; }
      }
      if (!verdict) return { ok: false, why: 'playlist pa ecuri (dritarja nuk lëviz)' };
      if (!verdict.ok) return verdict;
    }
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
  const optNames = new Map(); // lowercase slug -> emri nga lista zyrtare
  for (const m of home.matchAll(/href="https?:\/\/(?:www\.)?tvmak\.com\/([A-Za-z0-9_-]+)"/g)) {
    const s = m[1];
    if (/^(img|kontakt|web|assets|index)$/i.test(s)) continue;
    if (!slugs.has(s.toLowerCase())) slugs.set(s.toLowerCase(), s);
  }
  // web.aspx ("Për web programuesit") liston ID-të zyrtare të embed-it; disa s'janë te faqja kryesore
  try {
    const web = (await get(BASE + '/web.aspx')).body;
    for (const m of web.matchAll(/<option value='([A-Za-z0-9_-]+)'>([^<]*)<\/option>/g)) {
      if (!slugs.has(m[1].toLowerCase())) slugs.set(m[1].toLowerCase(), m[1]);
      optNames.set(m[1].toLowerCase(), decode(m[2]));
    }
  } catch (e) { console.warn('web.aspx nuk u lexua:', e.message); }
  console.log(`Faqe kanalesh: ${slugs.size}`);

  const cleanUrl = (src) => { const u = new URL(src, BASE); u.search = ''; return u.toString(); };
  const videoSrcOf = (body) => (/var videoSrc = '([^']+)'/.exec(body) || [])[1];
  const found = []; // një rresht për kandidat (slug mund të ketë faqe + embed)
  const rejected = {};
  await pool([...slugs.values()], CONCURRENCY, async (slug) => {
    const cands = [];
    let title = optNames.get(slug.toLowerCase()) || slug;
    try {
      const { res, body } = await get(`${BASE}/${slug}`);
      if (res.status === 200) {
        const src = videoSrcOf(body);
        const t = (/<b>([^<]+)<\/b>\s*<\/div>/.exec(body) || [])[1] || (/<title>([^<]*?)\s*-\s*TvMAK/i.exec(body) || [])[1];
        if (t) title = decode(t);
        if (src) cands.push(src);
      }
    } catch { /* provo embed */ }
    try {
      // embed-i kërkon Referer (ndryshe: "Nuk mund ta hapni linkun direkt") dhe shpesh përdor host tjetër (t2/t3)
      const { res, body } = await get(`${BASE}/embed.aspx?id=${encodeURIComponent(slug)}`, { referer: BASE + '/web.aspx' });
      if (res.status === 200) {
        const src = videoSrcOf(body);
        if (src) cands.push(src);
      }
    } catch { /* ignore */ }
    if (!cands.length) { rejected[slug] = 'pa videoSrc'; return; }
    if (isAdult({ name: title })) { rejected[slug] = 'adult'; return; }
    const seen = new Set();
    for (const src of cands) {
      let url;
      try { url = cleanUrl(src); } catch { continue; }
      if (seen.has(url)) continue;
      seen.add(url);
      const chk = inspectUrl(url);
      if (chk.error) { rejected[slug] = chk.error; continue; }
      found.push({ slug, name: title, url: chk.url });
    }
  });

  // testo çdo URL një herë; një slug pranohet me kandidatin e parë live, pa dublikuar stream-e (alias)
  const uniq = [...new Map(found.map((f) => [f.url, f])).values()];
  console.log(`URL unike: ${uniq.length}; po testoj...`);
  const probed = new Map();
  await pool(uniq, CONCURRENCY * 2, async (f) => { probed.set(f.url, await probeLive(f.url)); });
  const good = [];
  const usedUrls = new Set();
  const slugsDone = new Set();
  // rezultat i qëndrueshëm; kur dy slug-e japin të njëjtin stream, fiton ai që përputhet me emrin e skedarit
  const own = (f) => (new URL(f.url).pathname.split('/').pop().replace(/.m3u8$/i, '').toLowerCase() === f.slug.toLowerCase() ? 0 : 1);
  found.sort((x, y) => own(x) - own(y) || x.slug.toLowerCase().localeCompare(y.slug.toLowerCase()));
  for (const f of found) {
    const r = probed.get(f.url);
    if (r && r.ok) {
      const key = new URL(f.url).pathname.toLowerCase(); // i njëjti kanal në host-e të ndryshme (t1/t2/t3)
      if (slugsDone.has(f.slug) || usedUrls.has(key)) continue;
      slugsDone.add(f.slug); usedUrls.add(key); good.push(f);
    } else if (!slugsDone.has(f.slug)) rejected[f.slug] = (r && r.why) || 'dështoi';
  }
  for (const g of good) delete rejected[g.slug];
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

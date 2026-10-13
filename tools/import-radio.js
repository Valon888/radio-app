#!/usr/bin/env node
/**
 * Importon radio nga radio-browser.info (katalog publik, komunitar) për Kosovë, Shqipëri, Maqedoni e
 * Veriut, Mal të Zi, Kroaci, Slloveni dhe Serbi. Çdo stacion testohet me lidhje të vërtetë (përmbajtje audio
 * ose playlist HLS) dhe vetëm ato që punojnë futen në data/sources/radio/radio-browser.m3u.
 *
 *   node tools/import-radio.js [--per-country=60] [--concurrency=24] [--timeout=8000]
 *
 * Filtrat: pa token/çelës/kredenciale (tools/lib/iptv-filters), pa përmbajtje për të rritur, pa host privat.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { inspectUrl, isAdult, toM3U } = require('./lib/iptv-filters');

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v === undefined ? true : v];
}));
const PER_COUNTRY = Number(args['per-country']) || 60;
const CONCURRENCY = Number(args.concurrency) || 24;
const TIMEOUT = Number(args.timeout) || 8000;
const API = ['de1', 'de2', 'nl1'].map((h) => `https://${h}.api.radio-browser.info`);

/** kodi -> emri shqip (grupi në aplikacion) */
const COUNTRIES = {
  XK: 'Kosovë', AL: 'Shqipëri', MK: 'Maqedoni e Veriut', ME: 'Mali i Zi', HR: 'Kroaci', SI: 'Slloveni', RS: 'Serbi',
};
const OUT_DIR = path.resolve(__dirname, '..', 'data', 'sources', 'radio');

async function api(p) {
  let last;
  for (const base of API) {
    try {
      const r = await fetch(base + p, { headers: { 'User-Agent': 'mini-iptv/1.0' }, signal: AbortSignal.timeout(40000) });
      if (r.ok) return await r.json();
      last = new Error(`HTTP ${r.status}`);
    } catch (e) { last = e; }
  }
  throw last;
}

/** Lidhja e vërtetë: lexon deri 32 KB; pranon audio/*, ogg, ICY ose playlist HLS me segment. */
async function probe(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, { signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0', 'Icy-MetaData': '0' } });
    if (res.status !== 200) return { ok: false, why: `HTTP ${res.status}` };
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    const reader = res.body.getReader();
    const chunks = [];
    let size = 0;
    const limit = /mpegurl/.test(ct) ? 200000 : 32768;
    while (size < limit) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
      size += value.length;
    }
    try { await reader.cancel(); } catch { /* ok */ }
    const buf = Buffer.concat(chunks);
    const head = buf.slice(0, 16).toString('latin1');
    if (/^#EXTM3U/.test(buf.toString('utf8', 0, 10)) || /mpegurl/.test(ct)) {
      const text = buf.toString('utf8');
      const first = text.split(/\r?\n/).find((l) => l && !l.startsWith('#'));
      if (!first) return { ok: false, why: 'playlist bosh' };
      return { ok: true, hls: true };
    }
    if (/^(audio\/|application\/ogg|application\/octet-stream|video\/mp2t|binary\/octet)/.test(ct) || res.headers.get('icy-name')) {
      if (size < 2048) return { ok: false, why: 'pak të dhëna' };
      if (/^<(!doctype|html)/i.test(head.trim())) return { ok: false, why: 'faqe HTML' };
      return { ok: true };
    }
    return { ok: false, why: `lloj jo-audio (${ct || 'pa content-type'})` };
  } catch (e) {
    return { ok: false, why: e.name === 'AbortError' ? 'timeout' : String(e.cause && e.cause.code || e.message).slice(0, 40) };
  } finally {
    clearTimeout(timer);
    ctl.abort();
  }
}

async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const it = items[i++]; await fn(it); }
  }));
}

const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

(async () => {
  const entries = [];
  const report = {};
  for (const [cc, label] of Object.entries(COUNTRIES)) {
    const list = await api(`/json/stations/bycountrycodeexact/${cc}?hidebroken=true&order=clickcount&reverse=true`);
    // kandidatë: kontrollo disa herë më shumë se kuota, pastaj mbaj më të mirët që punojnë
    const cand = [];
    const seenName = new Set();
    for (const s of list) {
      const url = (s.url_resolved || s.url || '').trim();
      const name = String(s.name || '').replace(/\s+/g, ' ').trim();
      if (!name || !url) continue;
      const chk = inspectUrl(url);
      if (chk.error) continue;
      if (isAdult({ name, group: s.tags || '' })) continue;
      const key = slug(name);
      if (!key || seenName.has(key)) continue;
      seenName.add(key);
      cand.push({ name, url: chk.url, logo: /^https:/.test(s.favicon || '') ? s.favicon : '', votes: s.votes || 0, clicks: s.clickcount || 0 });
    }
    const top = cand.slice(0, PER_COUNTRY * 3);
    const good = [];
    await pool(top, CONCURRENCY, async (c) => {
      const r = await probe(c.url);
      if (r.ok) good.push(c);
    });
    good.sort((a, b) => b.clicks - a.clicks || b.votes - a.votes);
    const keep = good.slice(0, PER_COUNTRY);
    for (const c of keep) {
      entries.push({ id: `radio.${cc.toLowerCase()}.${slug(c.name)}`, name: c.name, logo: c.logo, group: label, url: c.url });
    }
    report[cc] = { api: list.length, candidates: cand.length, tested: top.length, working: good.length, kept: keep.length };
    console.log(`${cc} ${label}: API ${list.length}, testuar ${top.length}, punojnë ${good.length}, mbajtur ${keep.length}`);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'radio-browser.m3u'), toM3U(entries));
  fs.writeFileSync(path.join(OUT_DIR, 'SOURCE.json'), JSON.stringify({
    source: 'https://www.radio-browser.info/ (API publike)', imported: new Date().toISOString().slice(0, 10), perCountry: PER_COUNTRY, report,
  }, null, 2));
  console.log(`U shkruan ${entries.length} radio te data/sources/radio/radio-browser.m3u`);
})().catch((e) => { console.error(e); process.exit(1); });

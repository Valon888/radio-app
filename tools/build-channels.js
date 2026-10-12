#!/usr/bin/env node
/**
 * Ndërton data/channels.json nga burimet ekzistuese (listat JS dhe skedarët M3U).
 *
 *   node tools/build-channels.js
 *
 * - bashkon hyrjet me emër të njëjtë në një kanal me disa burime (sources[])
 * - hedh poshtë URL jo-HTTP, Twitch/YouTube (nuk luhen si stream) dhe përmbajtje +18
 * - radhit sipas prioritetit të grupeve (Kosovë, Shqipëri, ...)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'data', 'channels.json');

/* ---------- 1) Lista JS (ekzekutohen në sandbox, pa DOM) ---------- */
function loadJsLists() {
  const sandbox = {
    window: {},
    console: { log() {}, warn() {}, error() {} },
    document: {
      addEventListener() {}, readyState: 'loading',
      querySelector() { return null; }, getElementById() { return null; },
    },
    location: { protocol: 'http:' },
    setTimeout, clearTimeout,
    fetch: async () => { throw new Error('offline'); },
  };
  sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);
  for (const f of ['fallback-channels.js', 'radio-channels.js', 'turkish-channels.js', 'items.js']) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue;
    try { vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f }); }
    catch (e) { console.warn(`! ${f}: ${e.message}`); }
  }
  const pick = (name) => {
    try { return vm.runInContext(`typeof ${name} !== 'undefined' ? ${name} : []`, ctx) || []; }
    catch { return []; }
  };
  return [
    ['kosovoChannels', 'Kosovë'], ['albanianChannels', 'Shqipëri'], ['gemTVChannels', null],
    ['hardcodedChannels', null], ['importedFallbackChannels', null],
    ['radioChannels', null], ['alKanaleTV', 'Shqipëri'], ['turkishChannels', null],
  ].flatMap(([n, g]) => pick(n).map((c) => ({ ...c, group: c.group || g, _src: n })));
}

/* ---------- 2) M3U ---------- */
const SKIP_M3U = /^(index(\.country)?\.m3u|listen\.m3u)$|\(\d\)/i;
function parseM3U(file) {
  const lines = fs.readFileSync(path.join(ROOT, file), 'utf8').split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('#EXTINF')) continue;
    const meta = lines[i];
    let j = i + 1;
    while (j < lines.length && lines[j].startsWith('#')) j++;
    const url = (lines[j] || '').trim();
    const name = (meta.match(/,([^,]+)$/) || [])[1];
    if (!name || !url) continue;
    out.push({
      id: (meta.match(/tvg-id="([^"]*)"/) || [])[1] || '',
      name: name.trim(),
      url,
      logo: (meta.match(/tvg-logo="([^"]*)"/) || [])[1] || '',
      group: (meta.match(/group-title="([^"]*)"/) || [])[1] || '',
      type: 'tv',
      _src: file,
    });
    i = j;
  }
  return out;
}

/* ---------- 3) Normalizim ---------- */
const strip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
function cleanName(name) {
  return name
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\s*\((\d{3,4}[pi]|hd|sd|fhd|uhd)\)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countryOf(c) {
  const m = String(c.id || '').match(/\.([a-z]{2})(?:@|$)/i);
  return m ? m[1].toLowerCase() : '';
}
function qualityOf(c) {
  if (c.quality) return c.quality;
  return (String(c.name).match(/\((\d{3,4}p)\)/i) || [])[1] || '';
}
const QUALITY_RANK = { '2160p': 4, '1080p': 3, '720p': 2, '480p': 1 };

function kindOf(url, type) {
  const u = url.split('?')[0].toLowerCase();
  if (/\.m3u8?$/.test(u) || /m3u8/.test(url.toLowerCase())) return 'hls';
  if (/\.ts$/.test(u)) return 'ts';
  if (/\.flv$/.test(u)) return 'flv';
  if (/\.(mp3|aac|ogg|opus)$/.test(u)) return 'audio';
  return type === 'radio' ? 'audio' : 'hls';
}

const GROUP_ORDER = [
  [/kosov/i, 1], [/shqip|albania/i, 2], [/tring/i, 3], [/f[eë]mij|kids|çocuk/i, 6],
  [/t[uü]rk|turqi|turkish/i, 10], [/gem tv/i, 11], [/german|gjerman/i, 12],
  [/\busa?\b|amerik|united states/i, 13], [/\buk\b|angli|united kingdom/i, 14],
];
const orderOf = (g) => {
  for (const [re, n] of GROUP_ORDER) if (re.test(g || '')) return n;
  return 100;
};

/* ---------- 4) Bashkim ---------- */
function build() {
  const raw = [...loadJsLists()];
  for (const f of fs.readdirSync(ROOT)) {
    if (/\.m3u8?$/i.test(f) && !SKIP_M3U.test(f)) raw.push(...parseM3U(f));
  }
  // kanalet e tua: data/custom.m3u (nuk prek burimet e tjera)
  if (fs.existsSync(path.join(ROOT, 'data', 'custom.m3u'))) raw.push(...parseM3U('data/custom.m3u'));

  // Bashkim: (1) i njëjti URL = i njëjti kanal; (2) i njëjti emër + lloj (vendi përputhet ose mungon)
  const byName = new Map(); // lloj|emër -> [kanal]
  const byUrl = new Map(); // lloj|url -> kanal
  const list = [];
  let dropped = 0;
  for (const c of raw) {
    if (!c || typeof c.url !== 'string' || !/^https?:\/\//i.test(c.url)) { dropped++; continue; }
    if (/twitch\.tv|youtube\.com|youtu\.be/i.test(c.url)) { dropped++; continue; }
    // URL me token/çelës në query: nuk futen në repo (skadojnë dhe janë sekrete të ofruesit)
    if (/[?&](token|tkn|key|apikey|api_key|signature|sig|auth|password)=/i.test(c.url)) { dropped++; continue; }
    if (/adult|xxx|\+18|18\+/i.test(`${c.group} ${c.name}`)) { dropped++; continue; }
    // wrapper i vjetër që nuk ekziston më: mbaj URL-në e brendshme
    const url = c.url.replace(/^https:\/\/hls-proxy\.awsvps\.workers\.dev\/\?url=/i, '');
    const type = c.type === 'radio' ? 'radio' : (c.type === 'tv' || !c.type ? 'tv' : null);
    if (!type) { dropped++; continue; }
    const name = cleanName(c.name || c.title || '') || 'Kanal';
    const country = countryOf(c);
    const nameKey = `${type}|${strip(name).toLowerCase().replace(/[^a-z0-9]+/g, '')}`;

    let ch = byUrl.get(`${type}|${url}`);
    if (!ch) {
      ch = (byName.get(nameKey) || []).find((x) => !x.country || !country || x.country === country);
    }
    if (!ch) {
      ch = {
        id: String(c.id || nameKey).replace(/[^\w.@-]+/g, '_'),
        name, type, group: c.group || 'General', country, logo: c.logo || '',
        quality: qualityOf(c), order: orderOf(c.group), sources: [],
      };
      list.push(ch);
      if (!byName.has(nameKey)) byName.set(nameKey, []);
      byName.get(nameKey).push(ch);
    }
    if (!ch.country && country) ch.country = country;
    if (!ch.logo && c.logo) ch.logo = c.logo;
    if ((QUALITY_RANK[qualityOf(c)] || 0) > (QUALITY_RANK[ch.quality] || 0)) ch.quality = qualityOf(c);
    if (!ch.sources.some((x) => x.url === url)) ch.sources.push({ url, kind: kindOf(url, type) });
    byUrl.set(`${type}|${url}`, ch);
  }

  const channels = list;
  for (const ch of channels) {
    // HTTPS para HTTP; e ruan radhën tjetër
    ch.sources.sort((a, b) => (/^https:/.test(b.url) ? 1 : 0) - (/^https:/.test(a.url) ? 1 : 0));
  }
  const seen = new Set();
  for (const ch of channels) {
    let id = ch.id;
    let n = 2;
    while (seen.has(id)) id = `${ch.id}_${n++}`;
    ch.id = id;
    seen.add(id);
  }
  channels.sort((a, b) => a.order - b.order
    || (a.type === b.type ? 0 : a.type === 'tv' ? -1 : 1)
    || a.name.localeCompare(b.name));
  return { channels, dropped, rawCount: raw.length };
}

const { channels, dropped, rawCount } = build();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ generated: new Date().toISOString(), channels }));
const multi = channels.filter((c) => c.sources.length > 1).length;
console.log(`Hyrje të papërpunuara: ${rawCount}, të hedhura: ${dropped}`);
console.log(`Kanale: ${channels.length} (TV ${channels.filter((c) => c.type === 'tv').length}, `
  + `radio ${channels.filter((c) => c.type === 'radio').length}), me disa burime: ${multi}`);
console.log(`U shkrua ${path.relative(ROOT, OUT)}`);

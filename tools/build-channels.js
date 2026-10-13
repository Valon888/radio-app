#!/usr/bin/env node
/**
 * Ndërton data/index.json + data/countries/<kodi>.json nga burimet: listat JS, skedarët M3U,
 * data/custom.m3u dhe data/sources/iptv-org/ (krijohet nga tools/import-iptv-org.js).
 *
 *   node tools/build-channels.js
 *
 * - bashkon hyrjet me emër të njëjtë në një kanal me disa burime (sources[])
 * - hedh poshtë URL jo-HTTP, YouTube/Twitch, token/çelës/kredenciale dhe përmbajtje për të rritur
 * - ndan kanalet sipas shtetit që aplikacioni t'i ngarkojë ngadalë (lazy)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { inspectUrl, isAdult, parseM3U } = require('./lib/iptv-filters');

const ROOT = path.resolve(__dirname, '..');

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
const SKIP_M3U = /^(index(.country)?.m3u|listen.m3u)$|(d)/i;
function parseM3UFile(file) {
  return parseM3U(fs.readFileSync(path.join(ROOT, file), 'utf8')).map((e) => ({
    id: e.id, name: e.name, url: e.url, logo: e.logo, group: e.group, ref: e.ref, type: 'tv', _src: file,
  }));
}

/** Kategoritë e iptv-org -> etiketa shqip. */
const CATEGORY_LABEL = {
  animation: 'Animacion', auto: 'Auto', business: 'Biznes', classic: 'Klasike', comedy: 'Komedi',
  cooking: 'Gatim', culture: 'Kulturë', documentary: 'Dokumentarë', education: 'Arsim',
  entertainment: 'Argëtim', family: 'Familje', general: 'General', kids: 'Fëmijë', legislative: 'Parlament',
  lifestyle: 'Stil jetese', movies: 'Filma', music: 'Muzikë', news: 'Lajme', outdoor: 'Natyrë',
  public: 'Publike', relax: 'Relaks', religious: 'Fetare', science: 'Shkencë', series: 'Seriale',
  shop: 'Blerje', sports: 'Sport', travel: 'Udhëtim', weather: 'Moti', interactive: 'Interaktive',
};

/** Burimet e importuara nga iptv-org (data/sources/iptv-org, krijohen nga tools/import-iptv-org.js). */
function loadIptvOrg() {
  const dir = path.join(ROOT, 'data', 'sources', 'iptv-org');
  if (!fs.existsSync(dir)) return [];
  let meta = {};
  try { meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8')); } catch { /* pa meta */ }
  const out = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.m3u')).sort()) {
    for (const e of parseM3U(fs.readFileSync(path.join(dir, f), 'utf8'))) {
      const chId = (e.id || '').split('@')[0];
      const m = meta[chId] || {};
      const cat = (m.k || [])[0];
      out.push({
        id: e.id, name: e.name, url: e.url, ref: e.ref, type: 'tv', _src: 'iptv-org/' + f,
        logo: m.l || '', group: CATEGORY_LABEL[cat] || 'General', countryHint: m.c || '',
      });
    }
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
    if (/\.m3u8?$/i.test(f) && !SKIP_M3U.test(f)) raw.push(...parseM3UFile(f));
  }
  // kanalet e tua: data/custom.m3u (nuk prek burimet e tjera)
  if (fs.existsSync(path.join(ROOT, 'data', 'custom.m3u'))) raw.push(...parseM3UFile('data/custom.m3u'));
  // iptv-org i fundit: kanalet manuale e ruajnë grupin/emrin, iptv-org shton burime shtesë
  const iptvOrg = loadIptvOrg();
  raw.push(...iptvOrg);

  // Bashkim: (1) i njëjti URL = i njëjti kanal; (2) i njëjti emër + lloj (vendi përputhet ose mungon)
  const byName = new Map(); // lloj|emër -> [kanal]
  const byUrl = new Map(); // lloj|url -> kanal
  const list = [];
  const drops = {};
  const drop = (why) => { drops[why] = (drops[why] || 0) + 1; };
  for (const c of raw) {
    if (!c || typeof c.url !== 'string') { drop('pa-url'); continue; }
    // wrapper i vjetër që nuk ekziston më: mbaj URL-në e brendshme
    const unwrapped = c.url.replace(/^https:\/\/hls-proxy\.awsvps\.workers\.dev\/\?url=/i, '');
    // asnjë token/çelës/kredencial, asnjë protokoll jo-http(s), asnjë YouTube/Twitch/host privat
    const chk = inspectUrl(unwrapped);
    if (chk.error) { drop(chk.error); continue; }
    if (isAdult({ name: c.name || c.title, id: c.id, group: c.group })) { drop('adult'); continue; }
    const url = chk.url;
    const type = c.type === 'radio' ? 'radio' : (c.type === 'tv' || !c.type ? 'tv' : null);
    if (!type) { drop('lloj'); continue; }
    const name = cleanName(c.name || c.title || '') || 'Kanal';
    const country = String(c.countryHint || '').toLowerCase() || countryOf(c);
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
    if (!ch.sources.some((x) => x.url === url)) {
      ch.sources.push({ url, kind: kindOf(url, type), ...(c.ref ? { ref: c.ref } : {}) });
    }
    byUrl.set(`${type}|${url}`, ch);
  }

  const channels = list;
  for (const ch of channels) {
    // HTTPS para HTTP; e ruan radhën tjetër
    ch.sources.sort((a, b) => (/^https:/.test(b.url) ? 1 : 0) - (/^https:/.test(a.url) ? 1 : 0));
    ch.order = Math.min(ch.order, COUNTRY_ORDER[ch.country] || 100);
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
  return { channels, drops, rawCount: raw.length };
}

/* ---------- 5) Ndarja sipas shtetit ---------- */
const COUNTRY_ORDER = { xk: 1, al: 2, mk: 3, me: 3, rs: 3, gr: 3, tr: 4, it: 5, de: 5, ch: 5 };
// shtetet që ngarkohen në nisje (Kosovë, Shqipëri, fqinjët) + radio
const INITIAL = ['xk', 'al', 'mk', 'me', 'rs', 'gr', 'radio'];
const SPECIAL_NAMES = { xk: 'Kosovë', radio: 'Radio', other: 'Të tjera (VOD, të ndryshme)', uk: 'Mbretëria e Bashkuar' };

function bucketOf(ch) {
  if (ch.type === 'radio') return 'radio';
  if (ch.country) return ch.country;
  if (/kosov/i.test(ch.group)) return 'xk';
  if (/shqip|albania/i.test(ch.group)) return 'al';
  if (/t[uü]rk/i.test(ch.group)) return 'tr';
  return 'other';
}

function countryName(code) {
  if (SPECIAL_NAMES[code]) return SPECIAL_NAMES[code];
  try {
    const n = new Intl.DisplayNames(['sq'], { type: 'region' }).of(code.toUpperCase());
    if (n && n.toUpperCase() !== code.toUpperCase()) return n;
  } catch { /* kodi nuk njihet */ }
  return code.toUpperCase();
}

function writeSplit(channels) {
  const buckets = new Map();
  for (const ch of channels) {
    const b = bucketOf(ch);
    if (!buckets.has(b)) buckets.set(b, []);
    buckets.get(b).push(ch);
  }
  const dir = path.join(ROOT, 'data', 'countries');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const countries = [];
  for (const [code, list] of buckets) {
    fs.writeFileSync(path.join(dir, `${code}.json`), JSON.stringify({ code, channels: list }));
    countries.push({
      code, name: countryName(code),
      tv: list.filter((c) => c.type === 'tv').length,
      radio: list.filter((c) => c.type === 'radio').length,
    });
  }
  countries.sort((a, b) => {
    const ia = INITIAL.indexOf(a.code);
    const ib = INITIAL.indexOf(b.code);
    if (ia >= 0 || ib >= 0) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    return a.name.localeCompare(b.name, 'sq');
  });
  const index = { generated: new Date().toISOString(), initial: INITIAL.filter((c) => buckets.has(c)), countries };
  fs.writeFileSync(path.join(ROOT, 'data', 'index.json'), JSON.stringify(index));
  return countries;
}

const { channels, drops, rawCount } = build();
const countries = writeSplit(channels);
const dropped = Object.values(drops).reduce((a, b) => a + b, 0);
const multi = channels.filter((c) => c.sources.length > 1).length;
console.log(`Hyrje të papërpunuara: ${rawCount}, të hedhura: ${dropped} ${JSON.stringify(drops)}`);
console.log(`Kanale: ${channels.length} (TV ${channels.filter((c) => c.type === 'tv').length}, `
  + `radio ${channels.filter((c) => c.type === 'radio').length}), me disa burime: ${multi}`);
console.log(`U shkruan data/index.json + data/countries/*.json (${countries.length} shtete/grupe)`);

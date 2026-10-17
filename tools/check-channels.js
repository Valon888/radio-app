#!/usr/bin/env node
/**
 * Teston URL-të e kanaleve nga terminali (manifest -> niveli -> segmenti i parë) dhe krijon:
 *   - data/health/<kodi>.json   (rezultati për çdo URL, një skedar për shtet; përdoret nga aplikacioni)
 *   - channels-report.md        (përmbledhje + kanalet që nuk punojnë për shtetet kryesore)
 *
 * Përdorimi:
 *   node tools/check-channels.js [--concurrency=30] [--timeout=10000] [--country=xk,al]
 *                                [--type=tv|radio] [--group=Kosovë] [--limit=200]
 *
 * Gjendjet:  online | slow (>4s) | blocked (401/403/geo) | offline (404, DNS, refuzim, timeout, jo-valid)
 * Shënim: rezultati varet nga rrjeti nga i cili e ekzekuton (disa burime bllokohen sipas vendit).
 * Nuk ruhen URL me token (build-channels.js i hedh), kështu që health/*.json nuk përmban sekrete.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v === undefined ? true : v];
}));
// --proxy=<worker> --only-http: testo burimet http:// përmes worker-it (rruga e vetme e tyre në faqe https)
const PROXY = args.proxy ? String(args.proxy).replace(/\/+$/, '') : '';
const ONLY_HTTP = Boolean(args['only-http']);
const ALLOW_ORIGIN = String(args.origin || 'https://valon888.github.io');
const CONCURRENCY = Number(args.concurrency) || 30;
const TIMEOUT = Number(args.timeout) || 10000;
const SLOW_MS = 4000;
const MAX_BODY = 512 * 1024; // mjafton për playlist-a; segmentet lexohen vetëm 2 KB
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const REPORT_COUNTRIES = ['xk', 'al', 'mk', 'me', 'rs', 'gr', 'tr', 'radio'];

// shumë burime IPTV kanë certifikata të prishura; për test pranojmë gjithçka
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'index.json'), 'utf8'));
const wanted = args.country ? String(args.country).split(',') : index.countries.map((c) => c.code);
let channels = [];
const bucketOfUrl = new Map(); // url -> Set(kod shteti)
for (const code of wanted) {
  const p = path.join(ROOT, 'data', 'countries', `${code}.json`);
  if (!fs.existsSync(p)) { console.error(`! mungon ${p}`); continue; }
  for (const c of JSON.parse(fs.readFileSync(p, 'utf8')).channels) {
    c._bucket = code;
    channels.push(c);
  }
}
// vendmbajtësit "Së shpejti" (pa burim) nuk testohen dhe nuk hyjnë në statistika
channels = channels.filter((c) => c.sources.length);
if (args.type) channels = channels.filter((c) => c.type === args.type);
if (args.group) channels = channels.filter((c) => (c.group || '').toLowerCase().includes(String(args.group).toLowerCase()));
if (args.limit) channels = channels.slice(0, Number(args.limit));

const kindByUrl = new Map();
const refByUrl = new Map();
for (const c of channels) {
  for (const s of c.sources) {
    kindByUrl.set(s.url, s.kind);
    if (s.ref) refByUrl.set(s.url, s.ref);
    if (!bucketOfUrl.has(s.url)) bucketOfUrl.set(s.url, new Set());
    bucketOfUrl.get(s.url).add(c._bucket);
  }
}
const urls = [...kindByUrl.keys()].filter((u) => !ONLY_HTTP || /^http:\/\//i.test(u) || (PROXY && kindByUrl.get(u) === 'resolver'));

async function http(url, opts = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), opts.timeout || TIMEOUT);
  try {
    const origin = new URL(url).origin;
    const ref = refByUrl.get(url);
    if (PROXY && kindByUrl.get(url) === 'resolver') {
      // faqe kanali me adresë që skadon: Worker-i e zgjidh dhe kthen playlist-in e freskët
      const res = await fetch(`${PROXY}/?resolve=${encodeURIComponent(url)}`, { signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': UA, Origin: ALLOW_ORIGIN, ...(opts.headers || {}) } });
      return { res, timer, ctl };
    }
    if (PROXY && (url.startsWith(PROXY) || /^http:\/\//i.test(url))) {
      // worker-i rishkruan playlist-at, ndaj segmentet vijnë si URL të tij; Origin duhet të jetë i lejuari
      const target = url.startsWith(PROXY) ? url : `${PROXY}/?url=${encodeURIComponent(url)}${ref ? `&ref=${encodeURIComponent(ref)}` : ''}`;
      const res = await fetch(target, { signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': UA, Origin: ALLOW_ORIGIN, ...(opts.headers || {}) } });
      return { res, timer, ctl };
    }
    const go = (headers) => fetch(url, { signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': UA, ...headers, ...(opts.headers || {}) } });
    let res = await go({ Referer: ref || `${origin}/`, Origin: origin });
    // disa burime refuzojnë Referer/Origin ose kombinime kokash: provo pa ta (si proxy-ja)
    if ((res.status === 401 || res.status === 403) && !ref) {
      try { await res.body.cancel(); } catch { /* ok */ }
      res = await go({ Accept: '*/*' });
      if (res.status === 401 || res.status === 403) {
        try { await res.body.cancel(); } catch { /* ok */ }
        res = await go({});
      }
    }
    return { res, timer, ctl };
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

function classifyError(e) {
  const code = e.cause && e.cause.code ? e.cause.code : e.name;
  if (e.name === 'AbortError' || /TIMEOUT/.test(code)) return 'timeout';
  return String(code);
}

/** Lexon deri në `max` bajte pa pritur një stream të pafund. */
async function readLimited(res, ctl, max = MAX_BODY) {
  const chunks = [];
  let size = 0;
  const reader = res.body.getReader();
  try {
    while (size < max) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
      size += value.length;
    }
  } finally {
    try { await reader.cancel(); } catch { /* tashmë mbyllur */ }
    ctl.abort();
  }
  return Buffer.concat(chunks);
}

const isTsSync = (b) => b.length > 188 && b[0] === 0x47 && b[188] === 0x47;

async function checkHls(url) {
  const t0 = Date.now();
  const { res, timer, ctl } = await http(url);
  try {
    if (res.status === 401 || res.status === 403) return { s: 'blocked', reason: `HTTP ${res.status}` };
    if (res.status !== 200) return { s: 'offline', reason: `HTTP ${res.status}` };
    const buf = await readLimited(res, ctl);
    const text = buf.toString('utf8');
    if (!text.trimStart().startsWith('#EXTM3U')) {
      // disa URL pa .m3u8 japin drejtpërdrejt MPEG-TS
      if (isTsSync(buf)) {
        const ms = Date.now() - t0;
        return { s: ms > SLOW_MS ? 'slow' : 'online', ms, k: 'ts' };
      }
      return { s: 'offline', reason: 'jo playlist HLS' };
    }
    // zbrit në playlist-in e nivelit (një herë), pastaj provo segmentin e parë
    let base = res.url || url;
    let lines = text.split(/\r?\n/).filter((l) => l && !l.startsWith('#'));
    if (!lines.length) return { s: 'offline', reason: 'playlist bosh' };
    if (/#EXT-X-STREAM-INF/.test(text)) {
      base = new URL(lines[0], base).toString();
      const v = await http(base);
      try {
        if (v.res.status !== 200) return { s: v.res.status === 403 ? 'blocked' : 'offline', reason: `variant HTTP ${v.res.status}` };
        const vt = (await readLimited(v.res, v.ctl)).toString('utf8');
        lines = vt.split(/\r?\n/).filter((l) => l && !l.startsWith('#'));
        if (!lines.length) return { s: 'offline', reason: 'variant bosh' };
      } finally { clearTimeout(v.timer); }
    }
    const seg = new URL(lines[0], base).toString();
    const sr = await http(seg, { headers: { Range: 'bytes=0-2047' } });
    try {
      if (sr.res.status !== 200 && sr.res.status !== 206) {
        return { s: sr.res.status === 403 ? 'blocked' : 'offline', reason: `segment HTTP ${sr.res.status}` };
      }
      const ct = sr.res.headers.get('content-type') || '';
      if (/text\/html/i.test(ct)) return { s: 'offline', reason: 'segment HTML' };
    } finally {
      sr.ctl.abort();
      clearTimeout(sr.timer);
    }
    const ms = Date.now() - t0;
    return { s: ms > SLOW_MS ? 'slow' : 'online', ms };
  } finally {
    clearTimeout(timer);
  }
}

/** Audio / stream i drejtpërdrejtë (mp3, aac, ts, flv): mjafton përgjigja dhe lloji i përmbajtjes. */
async function checkStream(url) {
  const t0 = Date.now();
  const { res, timer, ctl } = await http(url, { headers: { Range: 'bytes=0-1023', 'Icy-MetaData': '0' } });
  try {
    if (res.status === 401 || res.status === 403) return { s: 'blocked', reason: `HTTP ${res.status}` };
    if (res.status !== 200 && res.status !== 206) return { s: 'offline', reason: `HTTP ${res.status}` };
    const ct = res.headers.get('content-type') || '';
    if (/text\/html/i.test(ct)) return { s: 'offline', reason: 'HTML në vend të streamit' };
    const ms = Date.now() - t0;
    return { s: ms > SLOW_MS ? 'slow' : 'online', ms };
  } finally {
    clearTimeout(timer);
    ctl.abort();
  }
}

async function check(url) {
  const kind = kindByUrl.get(url);
  if (kind === 'resolver' && !PROXY) return { s: 'unknown', reason: 'kërkon --proxy', t: Date.now() };
  try {
    const r = kind === 'audio' || kind === 'ts' || kind === 'flv' ? await checkStream(url) : await checkHls(url);
    return { ...r, t: Date.now() };
  } catch (e) {
    return { s: 'offline', reason: classifyError(e), t: Date.now() };
  }
}

const HEALTH_DIR = path.join(ROOT, 'data', 'health');
const readJsonSafe = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };

(async () => {
  fs.mkdirSync(HEALTH_DIR, { recursive: true });
  const results = {};
  // rezultatet e mëparshme (për testime pjesore)
  for (const f of fs.readdirSync(HEALTH_DIR).filter((x) => x.endsWith('.json') && !x.startsWith('.'))) {
    Object.assign(results, (readJsonSafe(path.join(HEALTH_DIR, f)) || {}).results || {});
  }
  const partialPath = path.join(HEALTH_DIR, '.partial.json');
  let done = 0;
  let idx = 0;
  const started = Date.now();
  console.log(`Po testoj ${urls.length} URL nga ${channels.length} kanale (paralelizëm ${CONCURRENCY}, timeout ${TIMEOUT}ms)...`);

  const writeSafe = (p, body) => {
    for (let i = 0; i < 10; i++) {
      try { fs.writeFileSync(p, body); return; } catch (e) {
        if (i === 9) throw e;
        const until = Date.now() + 300; // Windows: antivirusi e mban skedarin për çast
        while (Date.now() < until) { /* pritje */ }
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (idx < urls.length) {
      const url = urls[idx++];
      results[url] = await check(url);
      done++;
      if (done % 500 === 0) {
        console.log(`  ${done}/${urls.length}  (${Math.round((Date.now() - started) / 1000)}s)`);
        try { fs.writeFileSync(partialPath, JSON.stringify({ results })); } catch { /* jo kritike */ }
      }
    }
  }));

  /* ---- health/<kodi>.json: vetëm URL-të e atij shteti ---- */
  const generated = new Date().toISOString();
  const byCode = new Map();
  for (const [url, codes] of bucketOfUrl) {
    for (const code of codes) {
      if (!byCode.has(code)) byCode.set(code, {});
      if (results[url]) byCode.get(code)[url] = results[url];
    }
  }
  for (const [code, res] of byCode) {
    const file = path.join(HEALTH_DIR, `${code}.json`);
    // test pjesor (--only-http): ruaj rezultatet ekzistuese të URL-ve që nuk u testuan tani
    const prev = ONLY_HTTP ? (readJsonSafe(file) || {}).results || {} : {};
    writeSafe(file, JSON.stringify({ generated, results: { ...prev, ...res } }));
  }
  try { fs.unlinkSync(partialPath); } catch { /* nuk ekziston */ }
  if (ONLY_HTTP) {
    const c = { online: 0, slow: 0, blocked: 0, offline: 0 };
    for (const u of urls) c[results[u].s] = (c[results[u].s] || 0) + 1;
    console.log(`\nhttp:// përmes worker-it: ${urls.length} URL`, c);
    console.log('U shkruan data/health/*.json (channels-report.md nuk preket)');
    return;
  }

  /* ---- raporti ---- */
  const stat = (s) => (s === 'online' || s === 'slow' ? 'ok' : s);
  const classify = (c) => {
    const rs = c.sources.map((s) => ({ url: s.url, ...results[s.url] }));
    const okCount = rs.filter((r) => stat(r.s) === 'ok').length;
    if (okCount === rs.length) return { k: 'ok', c, rs };
    if (okCount > 0) return { k: 'partial', c, rs };
    if (rs.every((r) => r.s === 'blocked')) return { k: 'blocked', c, rs };
    return { k: 'dead', c, rs };
  };
  const all = channels.map(classify);
  const count = (arr, k) => arr.filter((x) => x.k === k).length;

  const perCountry = new Map();
  for (const x of all) {
    const code = x.c._bucket;
    if (!perCountry.has(code)) perCountry.set(code, []);
    perCountry.get(code).push(x);
  }
  const nameOf = new Map(index.countries.map((c) => [c.code, c.name]));
  const esc = (s) => String(s).replace(/\|/g, '\\|');
  const line = ({ c, rs }) => `| ${esc(c.name)} | ${esc(c.group)} | ${c.type} | `
    + rs.map((r) => `${r.s}${r.reason ? ` (${esc(r.reason)})` : ''}`).join('<br>')
    + ` | ${esc(rs[0].url.length > 90 ? rs[0].url.slice(0, 87) + '...' : rs[0].url)} |`;
  const header = '| Kanali | Grupi | Lloji | Gjendja | URL kryesore |\n|---|---|---|---|---|';

  const md = [
    '# Raporti i kanaleve',
    '',
    `Gjeneruar: ${generated}  `,
    'Rrjeti i testimit ndikon në rezultat (gjeo-bllokime, DNS).',
    '',
    `- Kanale të testuara: **${channels.length}** (URL: ${urls.length})`,
    `- Punojnë plotësisht: **${count(all, 'ok')}**`,
    `- Punojnë pjesërisht (një burim i vdekur, tjetri jo): **${count(all, 'partial')}**`,
    `- Të bllokuara (401/403, gjeo ose autorizim): **${count(all, 'blocked')}**`,
    `- Offline (të gjitha burimet): **${count(all, 'dead')}**`,
    '',
    '## Sipas shtetit',
    '',
    '| Shteti | Kanale | Punojnë | Pjesërisht | Bllokuar | Offline |',
    '|---|---|---|---|---|---|',
    ...[...perCountry.entries()].sort((a, b) => b[1].length - a[1].length).map(([code, arr]) =>
      `| ${nameOf.get(code) || code} (${code}) | ${arr.length} | ${count(arr, 'ok')} | ${count(arr, 'partial')} | ${count(arr, 'blocked')} | ${count(arr, 'dead')} |`),
    '',
  ];
  for (const code of REPORT_COUNTRIES) {
    const arr = (perCountry.get(code) || []).filter((x) => x.k !== 'ok');
    if (!arr.length) continue;
    md.push(`## ${nameOf.get(code) || code}: që nuk punojnë plotësisht`, '', header, ...arr.map(line), '');
  }
  fs.writeFileSync(path.join(ROOT, 'channels-report.md'), md.join('\n'));
  console.log(`\nPunojnë: ${count(all, 'ok')} | pjesërisht: ${count(all, 'partial')} | bllokuar: ${count(all, 'blocked')} | offline: ${count(all, 'dead')}`);
  console.log('U shkruan data/health/*.json dhe channels-report.md');
})();

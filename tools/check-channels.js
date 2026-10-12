#!/usr/bin/env node
/**
 * Teston të gjitha URL-të e kanaleve nga terminali dhe krijon:
 *   - data/health.json      (rezultati për çdo URL, përdoret nga aplikacioni)
 *   - channels-report.md    (raport për kanalet që nuk punojnë)
 *
 * Përdorimi:
 *   node tools/check-channels.js [--concurrency=30] [--timeout=10000]
 *                                [--type=tv|radio] [--group=Kosovë] [--limit=200]
 *
 * Gjendjet:  online | slow (>4s) | blocked (401/403/geo) | offline (404, DNS, refuzim, timeout, jo-valid)
 * Shënim: rezultati varet nga rrjeti nga i cili e ekzekuton (disa burime bllokohen sipas vendit).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v === undefined ? true : v];
}));
const CONCURRENCY = Number(args.concurrency) || 30;
const TIMEOUT = Number(args.timeout) || 10000;
const SLOW_MS = 4000;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// shumë burime IPTV kanë certifikata të prishura; për test pranojmë gjithçka
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'channels.json'), 'utf8'));
let channels = data.channels;
if (args.type) channels = channels.filter((c) => c.type === args.type);
if (args.group) channels = channels.filter((c) => (c.group || '').toLowerCase().includes(String(args.group).toLowerCase()));
if (args.limit) channels = channels.slice(0, Number(args.limit));

const urls = [...new Set(channels.flatMap((c) => c.sources.map((s) => s.url)))];

async function http(url, opts = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), opts.timeout || TIMEOUT);
  try {
    const origin = new URL(url).origin;
    const res = await fetch(url, {
      signal: ctl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': UA, Referer: `${origin}/`, Origin: origin, ...(opts.headers || {}) },
    });
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

async function checkHls(url) {
  const t0 = Date.now();
  const { res, timer } = await http(url);
  try {
    if (res.status === 401 || res.status === 403) return { s: 'blocked', reason: `HTTP ${res.status}` };
    if (res.status !== 200) return { s: 'offline', reason: `HTTP ${res.status}` };
    const text = await res.text();
    clearTimeout(timer);
    if (!text.trimStart().startsWith('#EXTM3U')) return { s: 'offline', reason: 'jo playlist HLS' };
    // zbrit në playlist-in e nivelit (një herë), pastaj provo segmentin e parë
    let base = res.url || url;
    let lines = text.split(/\r?\n/).filter((l) => l && !l.startsWith('#'));
    if (!lines.length) return { s: 'offline', reason: 'playlist bosh' };
    if (/#EXT-X-STREAM-INF/.test(text)) {
      base = new URL(lines[0], base).toString();
      const v = await http(base);
      if (v.res.status !== 200) { clearTimeout(v.timer); return { s: v.res.status === 403 ? 'blocked' : 'offline', reason: `variant HTTP ${v.res.status}` }; }
      const vt = await v.res.text();
      clearTimeout(v.timer);
      lines = vt.split(/\r?\n/).filter((l) => l && !l.startsWith('#'));
      if (!lines.length) return { s: 'offline', reason: 'variant bosh' };
    }
    const seg = new URL(lines[0], base).toString();
    const sr = await http(seg, { headers: { Range: 'bytes=0-2047' } });
    sr.ctl.abort();
    clearTimeout(sr.timer);
    if (sr.res.status !== 200 && sr.res.status !== 206) {
      return { s: sr.res.status === 403 ? 'blocked' : 'offline', reason: `segment HTTP ${sr.res.status}` };
    }
    const ms = Date.now() - t0;
    return { s: ms > SLOW_MS ? 'slow' : 'online', ms };
  } finally {
    clearTimeout(timer);
  }
}

async function checkAudio(url) {
  const t0 = Date.now();
  const { res, timer, ctl } = await http(url, { headers: { Range: 'bytes=0-1023', 'Icy-MetaData': '0' } });
  try {
    if (res.status === 401 || res.status === 403) return { s: 'blocked', reason: `HTTP ${res.status}` };
    if (res.status !== 200 && res.status !== 206) return { s: 'offline', reason: `HTTP ${res.status}` };
    const ct = res.headers.get('content-type') || '';
    if (/text\/html/i.test(ct)) return { s: 'offline', reason: 'HTML në vend të audios' };
    const ms = Date.now() - t0;
    return { s: ms > SLOW_MS ? 'slow' : 'online', ms };
  } finally {
    clearTimeout(timer);
    ctl.abort();
  }
}

const kindByUrl = new Map();
for (const c of channels) for (const s of c.sources) kindByUrl.set(s.url, s.kind);

async function check(url) {
  const kind = kindByUrl.get(url);
  try {
    const r = kind === 'audio' ? await checkAudio(url) : await checkHls(url);
    return { ...r, t: Date.now() };
  } catch (e) {
    return { s: 'offline', reason: classifyError(e), t: Date.now() };
  }
}

(async () => {
  const healthPath = path.join(ROOT, 'data', 'health.json');
  let previous = {};
  try { previous = JSON.parse(fs.readFileSync(healthPath, 'utf8')).results || {}; } catch { /* i ri */ }
  const results = { ...previous };
  let done = 0;
  let idx = 0;
  const started = Date.now();
  console.log(`Po testoj ${urls.length} URL nga ${channels.length} kanale (paralelizëm ${CONCURRENCY}, timeout ${TIMEOUT}ms)...`);

  // shkrim i sigurt: në Windows antivirusi/indeksuesi ndonjëherë e bllokon skedarin për çast
  const save = (final = false) => {
    const body = JSON.stringify({ generated: new Date().toISOString(), results });
    for (let i = 0; i < (final ? 10 : 1); i++) {
      try { fs.writeFileSync(healthPath, body); return; } catch (e) {
        if (final && i === 9) throw e;
        const until = Date.now() + 300;
        while (Date.now() < until) { /* pritje e shkurtër */ }
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (idx < urls.length) {
      const url = urls[idx++];
      results[url] = await check(url);
      done++;
      if (done % 100 === 0) {
        console.log(`  ${done}/${urls.length}  (${Math.round((Date.now() - started) / 1000)}s)`);
        save();
      }
    }
  }));
  save(true);

  /* ---- raporti ---- */
  const stat = (s) => (s === 'online' || s === 'slow' ? 'ok' : s);
  const rows = { ok: [], partial: [], dead: [], blocked: [] };
  for (const c of channels) {
    const rs = c.sources.map((s) => ({ url: s.url, ...results[s.url] }));
    const okCount = rs.filter((r) => stat(r.s) === 'ok').length;
    if (okCount === rs.length) rows.ok.push(c);
    else if (okCount > 0) rows.partial.push({ c, rs });
    else if (rs.every((r) => r.s === 'blocked')) rows.blocked.push({ c, rs });
    else rows.dead.push({ c, rs });
  }
  const esc = (s) => String(s).replace(/\|/g, '\\|');
  const line = ({ c, rs }) => `| ${esc(c.name)} | ${esc(c.group)} | ${c.type} | `
    + rs.map((r) => `${r.s}${r.reason ? ` (${esc(r.reason)})` : ''}`).join('<br>')
    + ` | ${esc(rs[0].url.length > 90 ? rs[0].url.slice(0, 87) + '...' : rs[0].url)} |`;
  const header = '| Kanali | Grupi | Lloji | Gjendja | URL kryesore |\n|---|---|---|---|---|';
  const md = [
    '# Raporti i kanaleve',
    '',
    `Gjeneruar: ${new Date().toISOString()}  `,
    `Rrjeti i testimit ndikon në rezultat (gjeo-bllokime, DNS).`,
    '',
    `- Kanale të testuara: **${channels.length}** (URL: ${urls.length})`,
    `- Punojnë plotësisht: **${rows.ok.length}**`,
    `- Punojnë pjesërisht (një burim i vdekur, tjetri jo): **${rows.partial.length}**`,
    `- Të bllokuara (401/403, gjeo ose autorizim): **${rows.blocked.length}**`,
    `- Offline (të gjitha burimet): **${rows.dead.length}**`,
    '',
    '## Offline',
    '',
    header,
    ...rows.dead.sort((a, b) => a.c.group.localeCompare(b.c.group)).map(line),
    '',
    '## Të bllokuara',
    '',
    header,
    ...rows.blocked.map(line),
    '',
    '## Pjesërisht',
    '',
    header,
    ...rows.partial.map(line),
    '',
  ].join('\n');
  fs.writeFileSync(path.join(ROOT, 'channels-report.md'), md);
  console.log(`\nPunojnë: ${rows.ok.length} | pjesërisht: ${rows.partial.length} | bllokuar: ${rows.blocked.length} | offline: ${rows.dead.length}`);
  console.log('U shkruan data/health.json dhe channels-report.md');
})();

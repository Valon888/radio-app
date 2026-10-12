#!/usr/bin/env node
/* ==========================================================================
   tools/check-channels.js - Teston kanalet nga terminali dhe krijon raport.

   Përdorimi:
     node tools/check-channels.js                      # skanon *.m3u, *.m3u8 dhe fallback-channels.js
     node tools/check-channels.js al.m3u xk.m3u        # vetëm skedarët e dhënë
     node tools/check-channels.js --concurrency=10 --timeout=12000 --slow=4000

   Rezultati: channels-report.md dhe channels-report.json
   Kërkon Node 18+ (fetch i integruar). Nuk instalon asgjë.
   Shënim: URL-të në raport shfaqen pa query string, që tokenat të mos dalin në git.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const opt = (name, def) => {
  const a = args.find(x => x.startsWith('--' + name + '='));
  return a ? Number(a.split('=')[1]) : def;
};
const CONCURRENCY = opt('concurrency', 8);
const TIMEOUT = opt('timeout', 10000);
const SLOW_MS = opt('slow', 4000);
const ROOT = path.resolve(__dirname, '..');
const UA = 'Mozilla/5.0 (MiniIPTV channel checker)';

/* ---------------------------- leximi i kanaleve ---------------------------- */
function parseM3U(text, file) {
  const out = []; let meta = null;
  for (const raw of text.split(/\r?\n/)) {
    const l = raw.trim();
    if (l.startsWith('#EXTINF')) {
      meta = { name: ((l.match(/,(.*)$/) || [])[1] || 'Pa emër').trim(), group: (l.match(/group-title="([^"]*)"/) || [])[1] || '' };
    } else if (l && !l.startsWith('#') && /^https?:\/\//i.test(l) && meta) {
      out.push({ ...meta, url: l, file }); meta = null;
    }
  }
  return out;
}

function parseJs(text, file) {
  const out = [];
  for (const m of text.matchAll(/\{[^{}]*?["']?url["']?\s*:\s*["'](https?:\/\/[^"']+)["'][^{}]*\}/g)) {
    const name = (m[0].match(/["']?name["']?\s*:\s*["']([^"']+)["']/) || [])[1] || 'Pa emër';
    const group = (m[0].match(/["']?group["']?\s*:\s*["']([^"']+)["']/) || [])[1] || '';
    out.push({ name, group, url: m[1], file });
  }
  return out;
}

function loadChannels(files) {
  const all = [];
  for (const f of files) {
    const full = path.resolve(ROOT, f);
    if (!fs.existsSync(full)) { console.warn('Nuk ekziston:', f); continue; }
    const text = fs.readFileSync(full, 'utf8');
    all.push(...(/\.m3u8?$/i.test(f) ? parseM3U(text, f) : parseJs(text, f)));
  }
  const seen = new Set();
  return all.filter(c => !seen.has(c.url) && seen.add(c.url));
}

/* ------------------------------- testimi ------------------------------- */
async function get(url, extra = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    return await fetch(url, { signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': UA, ...(extra.headers || {}) } });
  } finally { clearTimeout(timer); }
}

async function readHead(res, bytes) {
  const reader = res.body.getReader(); let got = 0; const chunks = [];
  while (got < bytes) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value); got += value.length;
  }
  try { await reader.cancel(); } catch { /* ignore */ }
  return Buffer.concat(chunks.map(c => Buffer.from(c)));
}

async function checkHls(url) {
  const res = await get(url);
  if (!res.ok) return { ok: false, reason: 'HTTP ' + res.status };
  let body = await res.text();
  if (!body.trimStart().startsWith('#EXTM3U')) return { ok: false, reason: 'Nuk është playlist HLS i vlefshëm' };
  let base = res.url || url;
  if (/#EXT-X-STREAM-INF/.test(body)) {            // master -> merr nivelin e parë
    const variant = body.split(/\r?\n/).find(l => l && !l.startsWith('#'));
    if (!variant) return { ok: false, reason: 'Master playlist pa nivele' };
    base = new URL(variant, base).href;
    const r2 = await get(base);
    if (!r2.ok) return { ok: false, reason: 'Niveli: HTTP ' + r2.status };
    body = await r2.text();
  }
  const seg = body.split(/\r?\n/).find(l => l && !l.startsWith('#'));
  if (!seg) return { ok: false, reason: 'Playlist pa segmente' };
  const r3 = await get(new URL(seg, base).href, { headers: { Range: 'bytes=0-2047' } });
  if (!r3.ok) return { ok: false, reason: 'Segmenti: HTTP ' + r3.status };
  await readHead(r3, 512);
  return { ok: true };
}

async function checkRaw(url) {
  const res = await get(url, { headers: { Range: 'bytes=0-4095' } });
  if (!res.ok) return { ok: false, reason: 'HTTP ' + res.status };
  const buf = await readHead(res, 1024);
  return buf.length ? { ok: true } : { ok: false, reason: 'Pa të dhëna' };
}

async function checkOne(ch) {
  const t0 = Date.now();
  let r;
  try {
    r = /m3u8/i.test(ch.url) ? await checkHls(ch.url) : await checkRaw(ch.url);
  } catch (e) {
    r = { ok: false, reason: e.name === 'AbortError' ? 'Timeout' : (e.cause && e.cause.code) || e.message };
  }
  const ms = Date.now() - t0;
  return { ...ch, ms, status: r.ok ? (ms > SLOW_MS ? 'slow' : 'online') : 'offline', reason: r.reason || '' };
}

async function pool(items, n, fn, onDone) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const idx = i++; items[idx] = await fn(items[idx]); onDone(idx); }
  }));
}

/* -------------------------------- raporti -------------------------------- */
const safeUrl = (u) => { try { const x = new URL(u); return x.origin + x.pathname; } catch { return '(URL i pavlefshëm)'; } };
const esc = (s) => String(s).replace(/\|/g, '\\|');

async function main() {
  const files = args.filter(a => !a.startsWith('--'));
  const targets = files.length ? files
    : [...fs.readdirSync(ROOT).filter(f => /\.m3u8?$/i.test(f)), 'fallback-channels.js'];
  const channels = loadChannels(targets);
  if (!channels.length) { console.error('Nuk u gjet asnjë kanal.'); process.exit(1); }
  console.log(`Duke testuar ${channels.length} kanale (paralelizëm ${CONCURRENCY}, timeout ${TIMEOUT}ms)...`);

  let done = 0;
  await pool(channels, CONCURRENCY, checkOne, () => {
    if (++done % 25 === 0 || done === channels.length) process.stdout.write(`\r${done}/${channels.length}`);
  });
  console.log();

  const by = s => channels.filter(c => c.status === s);

  // Nëse të gjitha dështojnë me gabim DNS/lidhjeje, problemi është rrjeti vendor, jo kanalet
  const netDown = by('offline').length === channels.length &&
    channels.every(c => /^(ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ENETUNREACH|fetch failed)$/.test(c.reason));
  if (netDown) {
    console.error('Të gjitha kanalet dështuan me gabim rrjeti (' + channels[0].reason + ').');
    console.error('Ky kompjuter nuk arrin dot internetin e jashtëm (DNS/firewall/proxy). Raporti NUK u krijua, sepse do të ishte i gabuar.');
    process.exit(2);
  }
  const lines = [
    '# Raporti i kanaleve', '',
    `Data: ${new Date().toISOString()}`, '',
    `- Online: **${by('online').length}**`,
    `- Ngadalë (> ${SLOW_MS} ms): **${by('slow').length}**`,
    `- Offline: **${by('offline').length}**`,
    `- Gjithsej: **${channels.length}**`, '',
    'Shënim: testi bëhet nga ky kompjuter, jo nga shfletuesi. Disa kanale mund të punojnë këtu por të bllokohen në shfletues nga CORS ose mixed content (shih README).', '',
    '## Kanalet offline', '', '| Kanali | Grupi | Burimi | Arsyeja |', '|---|---|---|---|',
    ...by('offline').map(c => `| ${esc(c.name)} | ${esc(c.group)} | ${esc(c.file)}: ${esc(safeUrl(c.url))} | ${esc(c.reason)} |`),
    '', '## Kanalet e ngadalta', '', '| Kanali | Koha | Burimi |', '|---|---|---|',
    ...by('slow').map(c => `| ${esc(c.name)} | ${c.ms} ms | ${esc(safeUrl(c.url))} |`)
  ];
  fs.writeFileSync(path.join(ROOT, 'channels-report.md'), lines.join('\n') + '\n');
  fs.writeFileSync(path.join(ROOT, 'channels-report.json'),
    JSON.stringify(channels.map(c => ({ name: c.name, group: c.group, file: c.file, url: safeUrl(c.url), status: c.status, ms: c.ms, reason: c.reason })), null, 2));
  console.log(`Online ${by('online').length} | Ngadalë ${by('slow').length} | Offline ${by('offline').length}`);
  console.log('Raporti: channels-report.md');
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
module.exports = { parseM3U, parseJs, safeUrl };

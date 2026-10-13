#!/usr/bin/env node
/**
 * Importon streams/*.m3u nga https://github.com/iptv-org/iptv (klon i përkohshëm jashtë repo-s)
 * në data/sources/iptv-org/ pasi i filtron.
 *
 *   git clone --depth 1 https://github.com/iptv-org/iptv D:/iptv-org-tmp
 *   # (opsionale, për kategori + logo)
 *   curl -L -o D:/iptv-org-tmp/api/channels.json https://iptv-org.github.io/api/channels.json
 *   curl -L -o D:/iptv-org-tmp/api/logos.json     https://iptv-org.github.io/api/logos.json
 *   node tools/import-iptv-org.js D:/iptv-org-tmp [--api=D:/iptv-org-tmp/api]
 *
 * Hiqet: përmbajtje për të rritur, YouTube/Twitch, URL me token/çelës/kredenciale,
 * protokolle jo-http(s), host-e private. Hyrjet e mbetura ruhen si M3U + meta.json
 * (kategoria, shteti, logoja) që build-channels.js t'i bashkojë me kanalet ekzistuese.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { inspectUrl, isAdult, parseM3U, toM3U } = require('./lib/iptv-filters');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'data', 'sources', 'iptv-org');

const argv = process.argv.slice(2);
const flag = (k) => (argv.find((a) => a.startsWith(`--${k}=`)) || '').slice(k.length + 3);
const repo = argv.find((a) => !a.startsWith('--'));
if (!repo) {
  console.error('Përdorimi: node tools/import-iptv-org.js <rruga e klonit iptv-org> [--api=<dosja me channels.json, logos.json>]');
  process.exit(1);
}
const streamsDir = path.join(repo, 'streams');
const apiDir = flag('api') || path.join(repo, 'api');

const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };
const apiChannels = readJson(path.join(apiDir, 'channels.json')) || [];
const apiLogos = readJson(path.join(apiDir, 'logos.json')) || [];
const metaById = new Map(apiChannels.map((c) => [c.id, c]));
// logoja kryesore: pa feed specifik dhe në përdorim, më e madhja fillimisht
const logoById = new Map();
for (const l of [...apiLogos].sort((a, b) => (b.width || 0) - (a.width || 0))) {
  if (!l.in_use || !/^https:/.test(l.url || '')) continue;
  const cur = logoById.get(l.channel);
  if (!cur || (cur.feed && !l.feed)) logoById.set(l.channel, l);
}

if (!fs.existsSync(streamsDir)) {
  console.error(`Nuk u gjet ${streamsDir}`);
  process.exit(1);
}
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const rejects = {};
let total = 0;
let kept = 0;
const meta = {};
const perFile = {};

for (const f of fs.readdirSync(streamsDir).filter((x) => x.endsWith('.m3u')).sort()) {
  const entries = parseM3U(fs.readFileSync(path.join(streamsDir, f), 'utf8'));
  const keep = [];
  const seen = new Set();
  for (const e of entries) {
    total++;
    const chId = (e.id || '').split('@')[0];
    const m = metaById.get(chId);
    const why = (() => {
      if (isAdult({ name: e.name, id: e.id, group: e.group, categories: m && m.categories, nsfw: m && m.is_nsfw })) return 'adult';
      const r = inspectUrl(e.url);
      if (r.error) return r.error;
      if (m && m.closed) return 'closed';
      if (seen.has(r.url)) return 'duplicate-url';
      e.url = r.url;
      return '';
    })();
    if (why) { rejects[why] = (rejects[why] || 0) + 1; continue; }
    seen.add(e.url);
    e.logo = ''; // logot vijnë nga meta.json (një kopje për kanal)
    keep.push(e);
    kept++;
    if (chId && !meta[chId]) {
      const logo = logoById.get(chId);
      meta[chId] = {
        ...(m ? { n: m.name, c: String(m.country || '').toLowerCase(), k: m.categories || [] } : {}),
        ...(logo ? { l: logo.url } : {}),
      };
    }
  }
  perFile[f] = keep.length;
  if (keep.length) fs.writeFileSync(path.join(OUT, f), toM3U(keep));
}

let commit = '';
try { commit = execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { /* jo repo */ }
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta));
fs.writeFileSync(path.join(OUT, 'SOURCE.json'), JSON.stringify({
  source: 'https://github.com/iptv-org/iptv/tree/master/streams',
  metadata: 'https://iptv-org.github.io/api/ (channels.json, logos.json)',
  commit,
  imported: new Date().toISOString().slice(0, 10),
  total,
  kept,
  rejected: rejects,
}, null, 2));

console.log(`Hyrje: ${total}, mbetën: ${kept}, u hodhën: ${total - kept}`);
console.log('Arsyet:', rejects);
console.log(`U shkruan ${Object.keys(perFile).length} skedarë te ${path.relative(ROOT, OUT)}`);

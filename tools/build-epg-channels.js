#!/usr/bin/env node
/**
 * Ndërton epg/channels.xml për iptv-org/epg nga kanalet e projektit (data/channels.json),
 * duke e përputhur emrin e kanalit me listat e gatshme të site-ve të iptv-org/epg.
 *
 *   node tools/build-epg-channels.js D:\epg [site1,site2] > epg/channels.xml
 *
 * Parazgjedhja: ipko.tv,tvim.tv (mbulojnë kanalet shqiptare/kosovare). Raporti shkon te stderr.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const epgDir = process.argv[2];
if (!epgDir) {
  console.error('Përdorimi: node tools/build-epg-channels.js <rruga e iptv-org/epg> [site1,site2] > epg/channels.xml');
  process.exit(1);
}
const sites = (process.argv[3] || 'ipko.tv,tvim.tv').split(',');

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/&amp;/g, 'and').replace(/[^a-z0-9]+/g, '');
const loose = (s) => norm(s).replace(/(hd|tv|televizion)$/g, '').replace(/^(tv|televizion)/, '');

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'channels.json'), 'utf8'));
const ours = (raw.channels || raw).filter((c) => c.type === 'tv');
const byNorm = new Map();
const byLoose = new Map();
for (const c of ours) {
  const add = (m, k) => { if (k) (m.get(k) || m.set(k, []).get(k)).push(c); };
  add(byNorm, norm(c.name));
  add(byLoose, loose(c.name));
}

const re = /<channel\s+site="([^"]+)"\s+site_id="([^"]+)"\s+lang="([^"]+)"\s+xmltv_id="([^"]+)">([^<]*)<\/channel>/g;
const seen = new Set();
const lines = [];
const matched = new Set();
for (const site of sites) {
  const file = path.join(epgDir, 'sites', site, `${site}.channels.xml`);
  const xml = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = re.exec(xml))) {
    const [, , siteId, lang, xmltvId, name] = m;
    const cc = (/\.([a-z]{2})@/i.exec(xmltvId) || [])[1];
    // vetëm kanale të së njëjtës shtet (shmang p.sh. 'Kanal 7' turk vs shqiptar)
    const cand = byNorm.get(norm(name)) || byLoose.get(loose(name)) || [];
    const hit = cand.filter((c) => !c.country || !cc || c.country.toLowerCase() === cc.toLowerCase());
    if (!hit.length) continue;
    if (seen.has(xmltvId)) continue; // një site për kanal (i pari fiton)
    seen.add(xmltvId);
    hit.forEach((c) => matched.add(c.id));
    lines.push(`  <channel site="${site}" site_id="${siteId}" lang="${lang}" xmltv_id="${xmltvId}">${name}</channel>`);
  }
}
process.stdout.write(`<?xml version="1.0" encoding="UTF-8"?>\n<channels>\n${lines.join('\n')}\n</channels>\n`);
console.error(`EPG: ${lines.length} hyrje në channels.xml, ${matched.size}/${ours.length} kanale TV të projektit përputhen.`);

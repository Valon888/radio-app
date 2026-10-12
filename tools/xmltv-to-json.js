#!/usr/bin/env node
/**
 * Shndërron një skedar XMLTV në data/epg.json (formati i lexuar nga js/epg.js).
 *
 *   node tools/xmltv-to-json.js guide.xml > data/epg.json
 *
 * Mbështet vetëm elementet bazë: <programme start="" stop="" channel=""><title>…</title></programme>.
 * Ruan vetëm programet e 36 orëve të ardhshme (+ 6 orë të shkuara) për të mbajtur skedarin të vogël.
 */
'use strict';
const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('Përdorimi: node tools/xmltv-to-json.js guide.xml > data/epg.json');
  process.exit(1);
}
const xml = fs.readFileSync(file, 'utf8');

function parseTime(s) {
  // 20250101200000 +0100
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{4})?/.exec(s || '');
  if (!m) return null;
  const tz = m[7] ? `${m[7].slice(0, 3)}:${m[7].slice(3)}` : 'Z';
  return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${tz}`);
}
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");

const now = Date.now();
const from = now - 6 * 3600e3;
const to = now + 36 * 3600e3;
const out = {};
const re = /<programme\s+([^>]*)>([\s\S]*?)<\/programme>/g;
let m;
while ((m = re.exec(xml))) {
  const attrs = Object.fromEntries([...m[1].matchAll(/(\w+)="([^"]*)"/g)].map((a) => [a[1], a[2]]));
  const title = (/<title[^>]*>([\s\S]*?)<\/title>/.exec(m[2]) || [])[1];
  const s = parseTime(attrs.start);
  const e = parseTime(attrs.stop);
  if (!attrs.channel || !title || !s || !e) continue;
  if (e.getTime() < from || s.getTime() > to) continue;
  (out[attrs.channel] = out[attrs.channel] || []).push({
    start: s.toISOString(), end: e.toISOString(), title: decode(title.trim()),
  });
}
process.stdout.write(JSON.stringify(out));

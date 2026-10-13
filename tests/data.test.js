'use strict';
// Kontrolle mbi të dhënat e gjeneruara (node tools/build-channels.js): asnjë token/adult/protokoll i gabuar.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { inspectUrl, isAdult } = require('../tools/lib/iptv-filters');

const DATA = path.join(__dirname, '..', 'data');
const index = JSON.parse(fs.readFileSync(path.join(DATA, 'index.json'), 'utf8'));
const all = [];
for (const c of index.countries) {
  const file = JSON.parse(fs.readFileSync(path.join(DATA, 'countries', `${c.code}.json`), 'utf8'));
  for (const ch of file.channels) all.push({ code: c.code, ch });
}

test('index.json përputhet me skedarët e shteteve', () => {
  assert.ok(index.countries.length > 10);
  for (const code of index.initial) assert.ok(index.countries.some((c) => c.code === code), code);
  for (const c of index.countries) {
    const n = all.filter((x) => x.code === c.code).length;
    assert.equal(n, c.tv + c.radio, c.code);
  }
});

test('asnjë burim nuk ka token, kredenciale, protokoll jo-http(s) ose host privat', () => {
  const bad = [];
  for (const { ch } of all) for (const s of ch.sources) {
    const r = inspectUrl(s.url);
    if (r.error) bad.push(`${ch.name}: ${r.error}`);
  }
  assert.deepEqual(bad.slice(0, 10), []);
});

test('asnjë kanal për të rritur', () => {
  const bad = all.filter(({ ch }) => isAdult({ name: ch.name, id: ch.id, group: ch.group })).map(({ ch }) => ch.name);
  assert.deepEqual(bad.slice(0, 10), []);
});

test('çdo kanal ka id unike dhe të paktën një burim', () => {
  const ids = new Set();
  for (const { ch } of all) {
    assert.ok(ch.sources.length > 0 || ch.soon, ch.name);
    assert.ok(!ids.has(ch.id), `id e përsëritur: ${ch.id}`);
    ids.add(ch.id);
  }
});

test('kanalet e Kosovës dhe radiot nuk humbën', () => {
  const xk = all.filter((x) => x.code === 'xk').length;
  const radio = all.filter((x) => x.code === 'radio').length;
  assert.ok(xk >= 10, `xk=${xk}`);
  assert.ok(radio >= 100, `radio=${radio}`);
});

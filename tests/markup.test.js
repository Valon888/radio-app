// Kontrollon që çdo id që ui.js kërkon me $('#id') ekziston në index.html,
// dhe që kontrollet e filtrave janë brenda #filters (paneli mobil).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');

test('çdo $(\'#id\') e ui.js ekziston në index.html', () => {
  const ids = [...new Set([...ui.matchAll(/\$\('#([\w-]+)'\)/g)].map((m) => m[1]))];
  assert.ok(ids.length > 10);
  for (const id of ids) assert.ok(html.includes(`id="${id}"`), `mungon #${id}`);
});

test('filtrat janë brenda #filters', () => {
  const block = html.match(/<div class="filters" id="filters">([\s\S]*?)<\/div>\s*<\/header>/);
  assert.ok(block, 'mungon #filters');
  for (const id of ['countrySelect', 'groupSelect', 'hideOffline', 'testBtn', 'installBtn']) {
    assert.ok(block[1].includes(`id="${id}"`), `#${id} nuk është në #filters`);
  }
});

test('skriptet e referuara ekzistojnë', () => {
  for (const m of html.matchAll(/<script[^>]*src="([^"]+)"/g)) {
    assert.doesNotThrow(() => readFileSync(new URL('../' + m[1], import.meta.url)), m[1]);
  }
});

'use strict';
// Zgjidhësi i Worker-it (proxy/cloudflare-worker.js): faqe kanali -> playlist i freskët; host-et e tjera refuzohen.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { pathToFileURL } = require('url');

const PAGE = 'https://play.mrt.com.mk/live/mrt2';
const STREAM = 'https://vod-c57.interspace.com:443/channel_abr/43/playlist.m3u8?wmsAuthSign=QUJDMTIz';
const ENV = { ALLOWED_ORIGINS: 'http://localhost:3002' };

async function load() {
  return (await import(pathToFileURL(path.join(__dirname, '..', 'proxy', 'cloudflare-worker.js')).href)).default;
}
const call = (w, qs) => w.fetch(new Request(`https://p.workers.dev/?${qs}`, { headers: { Origin: 'http://localhost:3002' } }), ENV);

test('resolve: nxjerr adresën nga faqja dhe rishkruan playlist-in përmes proxy-t', async () => {
  const w = await load();
  const real = globalThis.fetch;
  const seen = [];
  globalThis.fetch = async (u) => {
    seen.push(String(u));
    if (String(u) === PAGE) return new Response(`<script>var x=[[{"src":"${STREAM}"}]]</script>`, { status: 200 });
    return new Response('#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1\nlevel/chunks.m3u8?s=1\n', { status: 200, headers: { 'content-type': 'application/vnd.apple.mpegurl' } });
  };
  try {
    const r = await call(w, `resolve=${encodeURIComponent(PAGE)}`);
    assert.equal(r.status, 200);
    const body = await r.text();
    assert.match(body, /^#EXTM3U/);
    assert.match(body, /https:\/\/p\.workers\.dev\/\?url=https%3A%2F%2Fvod-c57\.interspace\.com/);
    assert.equal(seen[0], PAGE);
    assert.equal(seen[1], STREAM.replace(':443', '')); // URL() heq portin e paracaktuar
  } finally { globalThis.fetch = real; }
});

test('resolve: refuzon host-e dhe shtigje jashtë listës', async () => {
  const w = await load();
  for (const page of ['https://evil.example/live/x', 'https://play.mrt.com.mk/admin', 'http://play.mrt.com.mk/live/mrt2']) {
    const r = await call(w, `resolve=${encodeURIComponent(page)}`);
    assert.equal(r.status, 400, page);
  }
});

test('resolve: faqe pa adresë kthen 502', async () => {
  const w = await load();
  const real = globalThis.fetch;
  globalThis.fetch = async () => new Response('<html>pa stream</html>', { status: 200 });
  try { assert.equal((await call(w, `resolve=${encodeURIComponent(PAGE)}`)).status, 502); } finally { globalThis.fetch = real; }
});

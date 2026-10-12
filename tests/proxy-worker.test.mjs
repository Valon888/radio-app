import test from 'node:test';
import assert from 'node:assert';
import worker from '../tools/proxy-worker.mjs';

const env = { ALLOWED_HOSTS: 'cdn.example.com', ALLOWED_ORIGINS: 'https://app.example' };
const req = (u, origin = 'https://app.example') =>
  new Request('https://px.test/?url=' + encodeURIComponent(u), { headers: { Origin: origin } });

test('host jashtë listës refuzohet (nuk është proxy i hapur)', async () => {
  const r = await worker.fetch(req('https://evil.example.net/x.m3u8'), env);
  assert.strictEqual(r.status, 403);
});

test('origjinë e palejuar refuzohet', async () => {
  const r = await worker.fetch(req('https://cdn.example.com/x.m3u8', 'https://evil.test'), env);
  assert.strictEqual(r.status, 403);
});

test('pa ALLOWED_HOSTS gjithçka refuzohet', async () => {
  const r = await worker.fetch(req('https://cdn.example.com/x.m3u8'), { ALLOWED_ORIGINS: 'https://app.example' });
  assert.strictEqual(r.status, 403);
});

test('playlist rishkruhet: segmentet dhe URI="" kalojnë nga proxy', async () => {
  globalThis.fetch = async () => new Response(
    '#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="key.bin"\n#EXTINF:4,\nseg1.ts\n',
    { headers: { 'Content-Type': 'application/vnd.apple.mpegurl' } });
  const r = await worker.fetch(req('https://cdn.example.com/live/index.m3u8'), env);
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.headers.get('Access-Control-Allow-Origin'), 'https://app.example');
  const t = await r.text();
  assert.ok(t.includes('https://px.test/?url=' + encodeURIComponent('https://cdn.example.com/live/seg1.ts')));
  assert.ok(t.includes('URI="https://px.test/?url=' + encodeURIComponent('https://cdn.example.com/live/key.bin') + '"'));
});

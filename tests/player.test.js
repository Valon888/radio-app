/* Teste për StreamPlayer (pa shfletues) - ekzekuto: node --test tests/ */
const test = require('node:test');
const assert = require('node:assert');

// ---- Mock-e minimale ----
class FakeEl {
  constructor() { this.listeners = {}; this.paused = true; this.currentTime = 0; this.readyState = 0;
    this.buffered = { length: 0 }; this.duration = Infinity; this.src = ''; }
  addEventListener(n, fn) { (this.listeners[n] = this.listeners[n] || []).push(fn); }
  removeEventListener() {}
  emit(n) { (this.listeners[n] || []).forEach(f => f({})); }
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
  removeAttribute(a) { if (a === 'src') this.src = ''; }
  load() {}
  canPlayType() { return ''; }
}

const instances = [];
class FakeHls {
  static isSupported() { return true; }
  constructor(cfg) { this.cfg = cfg; this.h = {}; this.levels = []; this.started = 0; this.destroyed = false; instances.push(this); }
  on(e, fn) { (this.h[e] = this.h[e] || []).push(fn); }
  trigger(e, d) { (this.h[e] || []).forEach(f => f(e, d)); }
  attachMedia() { setImmediate(() => this.trigger('hlsMediaAttached')); }
  loadSource(u) { this.url = u; }
  startLoad() { this.started++; }
  recoverMediaError() { this.recovered = (this.recovered || 0) + 1; }
  swapAudioCodec() {}
  destroy() { this.destroyed = true; }
}
FakeHls.Events = { MEDIA_ATTACHED: 'hlsMediaAttached', MANIFEST_PARSED: 'hlsManifestParsed', ERROR: 'hlsError' };
FakeHls.ErrorTypes = { NETWORK_ERROR: 'networkError', MEDIA_ERROR: 'mediaError' };

global.Hls = FakeHls;
const StreamPlayer = require('../player.js');

const FAST = { backoffBaseMs: 1, backoffMaxMs: 2, backoffJitterMs: 0, startupTimeoutMs: 5000, upgradeTimeoutMs: 5000, statsIntervalMs: 60000 };
const wait = (ms) => new Promise(r => setTimeout(r, ms));
function make(extra) {
  instances.length = 0;
  const video = new FakeEl(), audio = new FakeEl();
  const log = { status: [], errors: [], sources: [] };
  const p = new StreamPlayer({
    video, audio, config: FAST, proxyUrl: (extra && extra.proxyUrl) || '',
    onStatus: (m, s) => log.status.push(s), onError: e => log.errors.push(e), onSource: s => log.sources.push(s)
  });
  return { p, video, audio, log };
}
const fatalNet = (code) => ({ fatal: true, type: 'networkError', details: 'manifestLoadError', response: code ? { code } : undefined });

test('candidatesFor: entry, fallback-et dhe binjakët pa dublikata', () => {
  const entry = { name: 'RTK 1', url: 'https://a/1.m3u8', type: 'tv', fallbackUrls: ['https://b/1.m3u8'] };
  const all = [entry,
    { name: 'rtk 1', url: 'https://c/1.m3u8', type: 'tv', quality: '1080p' },
    { name: 'RTK 1', url: 'https://a/1.m3u8', type: 'tv' },
    { name: 'RTK 1', url: 'https://d/radio.mp3', type: 'radio' }];
  assert.deepStrictEqual(StreamPlayer.candidatesFor(entry, all, 0),
    ['https://a/1.m3u8', 'https://b/1.m3u8', 'https://c/1.m3u8']);
  // me preferencë 1080p, binjaku 1080p del i pari
  assert.strictEqual(StreamPlayer.candidatesFor(entry, all, 1080)[0], 'https://c/1.m3u8');
});

test('HTTP 404 kalon menjëherë te burimi tjetër', async () => {
  const { p, log } = make();
  p.play({ name: 'X', type: 'tv', url: 'https://a/x.m3u8' }, ['https://a/x.m3u8', 'https://b/x.m3u8']);
  await wait(10);
  instances[0].trigger('hlsError', fatalNet(404));
  await wait(400);
  assert.strictEqual(log.sources.length, 2);
  assert.strictEqual(log.sources[1].url, 'https://b/x.m3u8');
  assert.ok(instances[0].destroyed, 'instanca e vjetër duhet shkatërruar');
  p.destroy();
});

test('Gabim rrjeti: retry me startLoad deri në limit, pastaj burimi tjetër', async () => {
  const { p, log } = make();
  p.play({ name: 'X', type: 'tv', url: 'https://a/x.m3u8' }, ['https://a/x.m3u8', 'https://b/x.m3u8']);
  await wait(10);
  const h = instances[0];
  for (let i = 0; i < 3; i++) { h.trigger('hlsError', fatalNet(0)); await wait(30); }
  assert.strictEqual(h.started, 3, 'startLoad 3 herë');
  h.trigger('hlsError', fatalNet(0));
  await wait(400);
  assert.strictEqual(log.sources[log.sources.length - 1].url, 'https://b/x.m3u8');
  p.destroy();
});

test('Gabim media: recoverMediaError pastaj burim tjetër', async () => {
  const { p, log } = make();
  p.play({ name: 'X', type: 'tv', url: 'https://a/x.m3u8' }, ['https://a/x.m3u8', 'https://b/x.m3u8']);
  await wait(10);
  const h = instances[0];
  const media = { fatal: true, type: 'mediaError', details: 'bufferAppendError' };
  h.trigger('hlsError', media); h.trigger('hlsError', media);
  assert.strictEqual(h.recovered, 2);
  h.trigger('hlsError', media);
  await wait(400);
  assert.strictEqual(log.sources.length, 2);
  p.destroy();
});

test('Të gjitha burimet dështojnë: error fatal pas 2 raundeve, pa cikël të pafund', async () => {
  const { p, log } = make();
  p.play({ name: 'X', type: 'tv', url: 'https://a/x.m3u8' }, ['https://a/x.m3u8']);
  for (let i = 0; i < 4 && !log.errors.length; i++) {
    await wait(2400);
    const h = instances[instances.length - 1];
    if (h && !h.destroyed) h.trigger('hlsError', fatalNet(404));
  }
  await wait(2400);
  assert.strictEqual(log.errors.length, 1);
  assert.strictEqual(log.errors[0].fatal, true);
  p.destroy();
});

test('Callback i vjetër pas ndërrimit të kanalit nuk bën asgjë (gen guard)', async () => {
  const { p, log } = make();
  p.play({ name: 'A', type: 'tv', url: 'https://a/a.m3u8' }, ['https://a/a.m3u8', 'https://a2/a.m3u8']);
  await wait(10);
  const old = instances[0];
  p.play({ name: 'B', type: 'tv', url: 'https://b/b.m3u8' }, ['https://b/b.m3u8']);
  await wait(10);
  const before = log.sources.length;
  old.trigger('hlsError', fatalNet(404));
  await wait(400);
  assert.strictEqual(log.sources.length, before);
  p.destroy();
});

test('Faqe HTTPS: http bëhet https-upgrade, proxy shtohet vetëm nëse konfigurohet', () => {
  global.location = { protocol: 'https:' };
  const a = make().p._expand(['http://1.2.3.4/live.ts']);
  assert.deepStrictEqual(a.map(s => s.via), ['https-upgrade']);
  const b = make({ proxyUrl: 'https://px.example/?url=' }).p._expand(['http://1.2.3.4/live.ts']);
  assert.deepStrictEqual(b.map(s => s.via), ['https-upgrade', 'proxy']);
  assert.ok(b[1].url.startsWith('https://px.example/?url=http%3A%2F%2F1.2.3.4'));
  delete global.location;
});

test('Cap cilësie zgjedh nivelin më të lartë nën tavan', () => {
  const { p } = make();
  p.hls = { levels: [{ height: 360 }, { height: 480 }, { height: 720 }, { height: 1080 }], currentLevel: 3 };
  p.setQualityHeight(720);
  assert.strictEqual(p.hls.autoLevelCapping, 2);
  assert.strictEqual(p.hls.nextLevel, 2);
  p.setQualityHeight(0);
  assert.strictEqual(p.hls.autoLevelCapping, -1);
  p.hls = null;
});

/**
 * Player i unifikuar: hls.js (HLS), mpegts.js (.ts/.flv), <audio>/<video> natyrë.
 *
 * Çdo kanal ka disa burime; çdo burim ka disa rrugë (direkt / proxy). Lojtari i provon me radhë,
 * rilidhet me backoff eksponencial kur stream-i ngec ose dështon, dhe vëzhgon progresin e luajtjes.
 *
 * Ngjarje ('state'): detail = { state, message, attempt: {sourceIndex, sourceCount, via} }
 *   states: idle | loading | buffering | playing | paused | reconnecting | error
 * Ngjarje ('levels'): detail = { levels:[{index,height,bitrate}], current, auto }
 * Ngjarje ('source'): detail = { url, via, kind, index, count }   (kur zgjidhet një rrugë)
 * Ngjarje ('result'): detail = { url, ok, reason }                (për health-in)
 */
import { CONFIG } from './config.js';
import { candidatesFor, detectProxy } from './network.js';

const scriptPromises = new Map();
function loadScript(url) {
  if (!scriptPromises.has(url)) {
    scriptPromises.set(url, new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = url;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => { scriptPromises.delete(url); reject(new Error(`Nuk u ngarkua ${url}`)); };
      document.head.appendChild(s);
    }));
  }
  return scriptPromises.get(url);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Konfigurimi i hls.js për stabilitet (live, rrjete të paqëndrueshme). */
function hlsConfig() {
  const policy = (maxRetries, base, max, timeoutMs) => ({
    default: {
      maxTimeToFirstByteMs: timeoutMs,
      maxLoadTimeMs: timeoutMs * 2,
      timeoutRetry: { maxNumRetry: maxRetries, retryDelayMs: base, maxRetryDelayMs: max, backoff: 'exponential' },
      errorRetry: { maxNumRetry: maxRetries, retryDelayMs: base, maxRetryDelayMs: max, backoff: 'exponential' },
    },
  });
  return {
    enableWorker: true,
    lowLatencyMode: false, // live klasik është më i qëndrueshëm pa LL-HLS
    startLevel: -1,
    capLevelToPlayerSize: true,
    maxBufferLength: 30,
    maxMaxBufferLength: 60,
    maxBufferSize: 60 * 1000 * 1000,
    backBufferLength: 30,
    liveSyncDurationCount: 3,
    liveMaxLatencyDurationCount: 10,
    startFragPrefetch: true,
    nudgeMaxRetry: 5,
    manifestLoadPolicy: policy(3, 1000, 8000, 10000),
    playlistLoadPolicy: policy(4, 1000, 8000, 10000),
    fragLoadPolicy: policy(5, 1000, 16000, 15000),
  };
}

export class Player extends EventTarget {
  /**
   * @param {{video:HTMLVideoElement, audio:HTMLAudioElement, health?:object}} opts
   */
  constructor({ video, audio, health = null }) {
    super();
    this.video = video;
    this.audio = audio;
    this.health = health;
    this.session = 0;
    this.channel = null;
    this.media = video; // elementi aktual
    this.hls = null;
    this.mpegts = null;
    this.cleanup = null;
    this.levels = [];
    this.preferredHeight = 0; // 0 = Auto
    this.volume = 1;
    this.muted = false;
    this.userPaused = false;
    this._lastState = 'idle';
    this._pending = null;
  }

  /* ---------------------- API publike ---------------------- */

  async play(channel, { sourceIndex = 0 } = {}) {
    this.stop(true);
    const session = ++this.session;
    this.channel = channel;
    this.userPaused = false;
    this.media = channel.type === 'radio' ? this.audio : this.video;
    const other = channel.type === 'radio' ? this.video : this.audio;
    other.pause();
    other.removeAttribute('src');
    other.load();
    this.media.volume = this.volume;
    this.media.muted = this.muted;

    this._emitState('loading', 'Duke u lidhur…', {});
    await detectProxy();
    if (session !== this.session) return;

    const sources = this.health ? this.health.orderedSources(channel) : channel.sources;
    const attempts = [];
    sources.forEach((src, si) => {
      candidatesFor(src.url, src.kind).forEach((c) => attempts.push({
        url: c.url, via: c.via, kind: src.kind, original: src.url, sourceIndex: si, sourceCount: sources.length,
      }));
    });
    if (!attempts.length) {
      this._emitState('error', 'Ky burim është HTTP dhe faqja është HTTPS. Konfiguro proxy (shih README).', {});
      return;
    }
    // sourceIndex i kërkuar nga përdoruesi ("Burimi tjetër")
    let ai = Math.max(0, attempts.findIndex((a) => a.sourceIndex >= sourceIndex));
    let reconnects = 0;

    while (session === this.session) {
      const attempt = attempts[ai];
      const meta = { sourceIndex: attempt.sourceIndex, sourceCount: attempt.sourceCount, via: attempt.via };
      this.dispatchEvent(new CustomEvent('source', { detail: { ...meta, url: attempt.original, kind: attempt.kind } }));
      const outcome = await this._attempt(session, attempt, meta, reconnects);
      if (session !== this.session) return;
      this._emitResult(attempt.original, outcome.wasPlaying, outcome.reason);

      // pasi ka luajtur së paku 1 minutë, numëruesi i rilidhjeve fillon nga e para
      if (outcome.playedMs > 60000) reconnects = 0;
      if (outcome.wasPlaying && reconnects < CONFIG.MAX_RECONNECTS) {
        // ishte duke luajtur: rilidhu te i njëjti burim me backoff
        reconnects++;
        const delay = Math.min(CONFIG.RECONNECT_BASE_MS * 2 ** (reconnects - 1), CONFIG.RECONNECT_MAX_MS);
        this._emitState('reconnecting', `Rilidhje (${reconnects}/${CONFIG.MAX_RECONNECTS}) pas ${Math.round(delay / 1000)}s…`, meta);
        await sleep(delay);
        continue;
      }
      reconnects = 0;
      ai++;
      if (ai >= attempts.length) {
        this._emitState('error', `Sinjali nuk është i disponueshëm (${outcome.reason || 'dështim'}).`, meta);
        return;
      }
      this._emitState('reconnecting', 'Duke provuar burim/rrugë tjetër…', attempts[ai]);
    }
  }

  stop(silent = false) {
    this.session++;
    this._teardown();
    if (!silent) this._emitState('idle', '', {});
  }

  /** Provo përsëri nga burimi i parë. */
  retry() {
    if (this.channel) return this.play(this.channel);
    return null;
  }

  /** Kalo te burimi tjetër i kanalit (cikël). */
  nextSource() {
    if (!this.channel) return;
    const cur = this._lastMeta?.sourceIndex ?? 0;
    const count = this.channel.sources.length;
    this.play(this.channel, { sourceIndex: (cur + 1) % count });
  }

  togglePause() {
    const m = this.media;
    if (m.paused) { this.userPaused = false; m.play().catch(() => {}); } else { this.userPaused = true; m.pause(); }
  }

  setVolume(v) {
    this.volume = Math.min(1, Math.max(0, v));
    this.video.volume = this.volume;
    this.audio.volume = this.volume;
  }

  setMuted(m) {
    this.muted = !!m;
    this.video.muted = this.muted;
    this.audio.muted = this.muted;
  }

  /** height = 0 për Auto, ose lartësia e dëshiruar (1080, 720, 480...). */
  setQuality(height) {
    this.preferredHeight = Number(height) || 0;
    this._applyQuality();
  }

  stats() {
    const m = this.media;
    let ahead = 0;
    try {
      for (let i = 0; i < m.buffered.length; i++) {
        if (m.currentTime >= m.buffered.start(i) && m.currentTime <= m.buffered.end(i)) {
          ahead = m.buffered.end(i) - m.currentTime;
        }
      }
    } catch { /* injoro */ }
    const lvl = this.hls && this.hls.currentLevel >= 0 ? this.hls.levels[this.hls.currentLevel] : null;
    const q = typeof m.getVideoPlaybackQuality === 'function' ? m.getVideoPlaybackQuality() : null;
    return {
      bufferAhead: ahead,
      bitrateKbps: this.hls && this.hls.bandwidthEstimate ? Math.round(this.hls.bandwidthEstimate / 1000)
        : (lvl ? Math.round(lvl.bitrate / 1000) : 0),
      height: lvl ? lvl.height : (m.videoHeight || 0),
      dropped: q ? q.droppedVideoFrames : 0,
      paused: m.paused,
    };
  }

  /** Ngroh lidhjen për kanalin pasardhës (DNS/TLS) pa e luajtur. */
  preload(channel) {
    try {
      const src = (this.health ? this.health.orderedSources(channel) : channel.sources)[0];
      if (!src) return;
      const origin = new URL(src.url).origin;
      if (!document.head.querySelector(`link[rel="preconnect"][href="${origin}"]`)) {
        const l = document.createElement('link');
        l.rel = 'preconnect';
        l.href = origin;
        l.crossOrigin = 'anonymous';
        document.head.appendChild(l);
        // mbaj vetëm disa preconnect
        const all = document.head.querySelectorAll('link[rel="preconnect"][data-iptv]');
        if (all.length > 4) all[0].remove();
        l.dataset.iptv = '1';
      }
    } catch { /* injoro */ }
  }

  /* ---------------------- brendshme ---------------------- */

  _emitState(state, message, meta) {
    this._lastState = state;
    this._lastMeta = meta && meta.sourceIndex !== undefined ? meta : this._lastMeta;
    this.dispatchEvent(new CustomEvent('state', { detail: { state, message, attempt: meta || {} } }));
  }

  _emitResult(url, ok, reason) {
    this.dispatchEvent(new CustomEvent('result', { detail: { url, ok, reason } }));
    if (this.health) this.health.markPlayback(url, ok, ok ? '' : reason);
  }

  _teardown() {
    if (this.cleanup) { try { this.cleanup(); } catch { /* injoro */ } this.cleanup = null; }
    if (this.hls) { try { this.hls.destroy(); } catch { /* injoro */ } this.hls = null; }
    if (this.mpegts) { try { this.mpegts.destroy(); } catch { /* injoro */ } this.mpegts = null; }
    this.levels = [];
    this.dispatchEvent(new CustomEvent('levels', { detail: { levels: [], current: -1, auto: true } }));
    for (const el of [this.video, this.audio]) {
      try { el.pause(); } catch { /* injoro */ }
    }
  }

  _applyQuality() {
    const hls = this.hls;
    if (!hls || !this.levels.length) return;
    if (!this.preferredHeight) { hls.currentLevel = -1; return; }
    // nivelin më të afërt që nuk e kalon lartësinë e kërkuar (ose më të ulëtin)
    const sorted = [...this.levels].sort((a, b) => a.height - b.height);
    let pick = sorted[0];
    for (const l of sorted) if (l.height <= this.preferredHeight) pick = l;
    hls.currentLevel = pick.index;
  }

  /**
   * Një përpjekje: rezultati zgjidhet kur përpjekja përfundon me dështim (ose seanca ndërpritet).
   * Gjatë saj dërgon gjendjet loading/buffering/playing.
   */
  _attempt(session, attempt, meta, reconnects) {
    return new Promise((resolve) => {
      const m = this.media;
      let finished = false;
      let wasPlaying = false;
      let playingSince = 0;
      let netRetries = 0;
      let mediaRetries = 0;
      let lastTime = -1;
      let lastProgressAt = Date.now();
      const startedAt = Date.now();
      const listeners = [];
      const on = (el, ev, fn) => { el.addEventListener(ev, fn); listeners.push(() => el.removeEventListener(ev, fn)); };

      const finish = (reason) => {
        if (finished) return;
        finished = true;
        clearInterval(watchdog);
        listeners.forEach((off) => off());
        this.cleanup = null;
        this._teardown();
        resolve({ wasPlaying, reason, playedMs: wasPlaying ? Date.now() - playingSince : 0 });
      };
      // seanca e re ose stop(): pastro pa raportuar si dështim
      this.cleanup = () => {
        if (finished) return;
        finished = true;
        clearInterval(watchdog);
        listeners.forEach((off) => off());
        resolve({ wasPlaying: false, reason: 'ndërprerë' });
      };

      const startup = reconnects ? 'Duke u rilidhur…' : 'Duke u lidhur…';
      this._emitState('loading', startup, meta);

      // vëzhguesi i progresit
      const watchdog = setInterval(() => {
        if (session !== this.session) { finish('seancë e re'); return; }
        const now = Date.now();
        if (!wasPlaying) {
          if (now - startedAt > CONFIG.STARTUP_TIMEOUT_MS) finish('timeout në nisje');
          return;
        }
        if (m.paused || m.ended) { lastProgressAt = now; return; }
        if (m.currentTime !== lastTime) { lastTime = m.currentTime; lastProgressAt = now; return; }
        if (now - lastProgressAt > CONFIG.STALL_TIMEOUT_MS) finish('stream i ngecur');
      }, 1000);

      const markPlaying = () => {
        if (!wasPlaying) {
          wasPlaying = true;
          playingSince = Date.now();
        }
        lastProgressAt = Date.now();
        this._emitState('playing', '', meta);
      };

      on(m, 'playing', markPlaying);
      on(m, 'waiting', () => { if (wasPlaying && !m.paused) this._emitState('buffering', 'Duke bufferuar…', meta); });
      on(m, 'pause', () => { if (wasPlaying && (this.userPaused || m.paused) && !m.ended) this._emitState('paused', '', meta); });
      on(m, 'error', () => finish(`gabim media (${m.error ? m.error.code : '?'})`));

      const kick = () => m.play().catch((e) => {
        if (e && e.name === 'NotAllowedError') this._emitState('paused', 'Prek për të luajtur', meta);
      });

      const url = attempt.url;
      const kind = attempt.kind;
      const native = (u) => { m.src = u; m.load(); kick(); };

      const start = async () => {
        try {
          if (kind === 'audio' && !/\.m3u8?(\?|$)/i.test(url)) {
            native(url);
            return;
          }
          if (kind === 'ts' || kind === 'flv') {
            await loadScript(CONFIG.MPEGTS_JS_URL);
            if (session !== this.session || finished) return;
            if (!window.mpegts || !window.mpegts.isSupported()) { native(url); return; }
            const p = window.mpegts.createPlayer({ type: kind === 'flv' ? 'flv' : 'mpegts', isLive: true, url },
              { enableWorker: true, liveBufferLatencyChasing: true, lazyLoad: false });
            this.mpegts = p;
            p.attachMediaElement(m);
            p.on(window.mpegts.Events.ERROR, (type, detail) => finish(`mpegts: ${type}/${detail}`));
            p.load();
            kick();
            return;
          }
          // HLS
          await loadScript(CONFIG.HLS_JS_URL).catch(() => {});
          if (session !== this.session || finished) return;
          if (window.Hls && window.Hls.isSupported()) {
            const Hls = window.Hls;
            const hls = new Hls(hlsConfig());
            this.hls = hls;
            hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
              this.levels = data.levels.map((l, i) => ({ index: i, height: l.height || 0, bitrate: l.bitrate || 0 }));
              this.dispatchEvent(new CustomEvent('levels', { detail: { levels: this.levels, current: -1, auto: !this.preferredHeight } }));
              this._applyQuality();
              kick();
            });
            hls.on(Hls.Events.LEVEL_SWITCHED, (_e, d) => {
              this.dispatchEvent(new CustomEvent('levels', {
                detail: { levels: this.levels, current: d.level, auto: hls.autoLevelEnabled },
              }));
            });
            hls.on(Hls.Events.ERROR, (_e, data) => {
              if (!data.fatal) return;
              if (data.type === Hls.ErrorTypes.NETWORK_ERROR && netRetries < 2
                  && !/manifestLoad|manifestParsing/.test(data.details || '')) {
                netRetries++;
                this._emitState('reconnecting', `Gabim rrjeti, provoj sërish (${netRetries}/2)…`, meta);
                setTimeout(() => { if (!finished && session === this.session) hls.startLoad(); }, 1000 * 2 ** (netRetries - 1));
              } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRetries < 2) {
                mediaRetries++;
                if (mediaRetries === 2) hls.swapAudioCodec();
                hls.recoverMediaError();
              } else {
                // fatal: shkatërro dhe rikrijo instancën (përpjekje e re)
                finish(`hls: ${data.details || data.type}`);
              }
            });
            hls.loadSource(url);
            hls.attachMedia(m);
            return;
          }
          if (m.canPlayType('application/vnd.apple.mpegurl')) { native(url); return; }
          finish('shfletuesi nuk mbështet HLS');
        } catch (e) {
          finish(e && e.message ? e.message : 'gabim i panjohur');
        }
      };
      start();
    });
  }
}

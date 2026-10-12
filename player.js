/* ==========================================================================
   player.js - Luajtës i qëndrueshëm për Mini IPTV + Radio
   --------------------------------------------------------------------------
   Çfarë bën:
   - hls.js për .m3u8 (native vetëm kur hls.js nuk mbështetet, p.sh. iOS Safari)
   - mpegts.js (ngarkohet vetëm kur duhet) për .ts / .flv
   - <audio> për radio, me të njëjtën logjikë rilidhjeje
   - Rilidhje automatike me backoff eksponencial dhe limit të qartë
   - Fallback automatik te burimet e tjera të të njëjtit kanal
   - Watchdog: nëse videoja ngec pa progres, rilidhet vetë
   - Kufizim cilësie (ABR automatik ose tavan 480p/720p/1080p)
   - Pa listener-a që grumbullohen kur ndërrohet kanali
   ========================================================================== */
(function (global) {
  'use strict';

  var DEFAULTS = {
    startupTimeoutMs: 15000,   // sa pritet para se burimi të quhet i vdekur
    upgradeTimeoutMs: 6000,    // http->https provohet shpejt
    stallTimeoutMs: 9000,      // sa sekonda pa progres = ngecje
    watchdogIntervalMs: 2000,
    stableAfterMs: 10000,      // pas sa kohe luajtjeje të pandërprerë rivendosen numëruesit
    maxRetriesPerSource: 3,
    maxRounds: 2,              // sa herë kalohet gjithë lista e burimeve
    backoffBaseMs: 1000,
    backoffMaxMs: 8000,
    backoffJitterMs: 400,
    statsIntervalMs: 1500,
    mpegtsUrl: 'https://cdn.jsdelivr.net/npm/mpegts.js@1.7.3/dist/mpegts.js'
  };

  function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }

  function qualityNumber(q) {
    var m = String(q || '').match(/(\d{3,4})/);
    return m ? parseInt(m[1], 10) : 0;
  }

  /* ------------------------------------------------------------------ */
  function StreamPlayer(opts) {
    opts = opts || {};
    this.video = opts.video;
    this.audio = opts.audio;
    this.cfg = Object.assign({}, DEFAULTS, opts.config || {});
    this.cb = {
      status: opts.onStatus || function () {},
      stats: opts.onStats || function () {},
      error: opts.onError || function () {},
      source: opts.onSource || function () {}
    };
    this.proxyUrl = opts.proxyUrl || '';
    this.qualityHeight = 0; // 0 = automatik (ABR i plotë)

    this._gen = 0;
    this._timers = {};
    this._ac = null;
    this._resetState();

    var self = this;
    // Kur kthehet interneti, provo përsëri nëse kemi dështuar ose po rilidhemi
    if (global.addEventListener) {
      this._onOnline = function () {
        if (self.entry && (self.failed || self.retries > 0 || self.netRetries > 0)) self.retry();
      };
      global.addEventListener('online', this._onOnline);
    }
  }

  StreamPlayer.prototype._resetState = function () {
    this.entry = null;
    this.el = null;
    this.sources = [];
    this.idx = 0;
    this.round = 0;
    this.retries = 0;
    this.netRetries = 0;
    this.mediaRecoveries = 0;
    this.failed = false;
    this.started = false;
    this.hls = null;
    this.mpegts = null;
    this.lastTime = -1;
    this.lastProgressAt = 0;
  };

  /* ------------------------- API publike ------------------------- */

  /**
   * Fillon luajtjen e një kanali.
   * @param {object} entry   kanali ({type:'tv'|'radio', name, url, ...})
   * @param {string[]} urls  burimet sipas përparësisë (i pari provohet i pari)
   */
  StreamPlayer.prototype.play = function (entry, urls) {
    this.stop();
    var gen = ++this._gen;
    this._resetState();
    this.entry = entry;
    this.isAudio = String(entry.type || 'tv').toLowerCase() === 'radio';
    this.el = this.isAudio ? this.audio : this.video;

    var other = this.isAudio ? this.video : this.audio;
    try { other.pause(); other.removeAttribute('src'); } catch (e) { /* ignore */ }

    this.sources = this._expand(urls || [entry.url]);
    this._bindElementEvents(gen);
    this._startStats(gen);

    if (!this.sources.length) {
      this._fail(gen, 'Asnjë burim i përdorshëm. Burimet HTTP bllokohen në faqe HTTPS - vendos një proxy në README.');
      return;
    }
    this._startSource(gen);
  };

  StreamPlayer.prototype.stop = function () {
    this._gen++;
    this._clearTimers();
    this._teardownEngine();
    if (this._ac) { try { this._ac.abort(); } catch (e) { /* ignore */ } this._ac = null; }
    if (this.el) {
      try { this.el.pause(); this.el.removeAttribute('src'); this.el.load(); } catch (e) { /* ignore */ }
    }
  };

  StreamPlayer.prototype.destroy = function () {
    this.stop();
    if (global.removeEventListener && this._onOnline) global.removeEventListener('online', this._onOnline);
  };

  /** Provo përsëri nga burimi i parë (butoni "Provo përsëri"). */
  StreamPlayer.prototype.retry = function () {
    if (!this.entry || !this.sources.length) return;
    var gen = ++this._gen;
    this._clearTimers();
    this.idx = 0; this.round = 0; this.retries = 0; this.netRetries = 0;
    this.mediaRecoveries = 0; this.failed = false; this.started = false;
    this._bindElementEvents(gen);
    this._startStats(gen);
    this._startSource(gen);
  };

  /** 0 = automatik, ose lartësia maksimale e dëshiruar (480, 720, 1080, 2160). */
  StreamPlayer.prototype.setQualityHeight = function (h) {
    this.qualityHeight = parseInt(h, 10) || 0;
    this._applyQualityCap();
  };

  StreamPlayer.prototype.getLevels = function () {
    if (!this.hls || !this.hls.levels) return [];
    return this.hls.levels.map(function (l, i) {
      return { index: i, height: l.height || 0, bitrateKbps: Math.round((l.bitrate || 0) / 1000) };
    });
  };

  StreamPlayer.prototype.getStats = function () {
    var el = this.el;
    var s = { score: 0, bitrateKbps: 0, bufferSec: 0, resolution: '', droppedPct: 0, playing: false };
    if (!el) return s;

    var t = el.currentTime || 0;
    try {
      for (var i = 0; i < el.buffered.length; i++) {
        if (t >= el.buffered.start(i) - 0.3 && t <= el.buffered.end(i) + 0.3) {
          s.bufferSec = Math.max(0, el.buffered.end(i) - t);
        }
      }
    } catch (e) { /* ignore */ }

    s.playing = !el.paused && !el.ended && el.readyState >= 3;
    if (!this.isAudio && el.videoWidth) s.resolution = el.videoWidth + 'x' + el.videoHeight;

    if (el.getVideoPlaybackQuality && !this.isAudio) {
      var q = el.getVideoPlaybackQuality();
      if (q && q.totalVideoFrames > 60) s.droppedPct = (q.droppedVideoFrames / q.totalVideoFrames) * 100;
    }

    var bwRatio = 1;
    if (this.hls) {
      var lvl = this.hls.levels && this.hls.levels[this.hls.currentLevel];
      if (lvl && lvl.bitrate) {
        s.bitrateKbps = Math.round(lvl.bitrate / 1000);
        if (this.hls.bandwidthEstimate) bwRatio = clamp(this.hls.bandwidthEstimate / lvl.bitrate / 1.5, 0, 1);
      }
    }

    // Vlerësim real nga buffer-i, brez-banda dhe frame-t e humbura (jo i simuluar)
    if (!s.playing) {
      s.score = this.started ? 25 : 10;
    } else {
      var buf = clamp(s.bufferSec / 12, 0, 1);
      var drop = clamp(1 - s.droppedPct / 20, 0, 1);
      s.score = Math.round(clamp(55 * buf + 30 * bwRatio + 15 * drop, 5, 100));
    }
    return s;
  };

  /* ---------------------- ndërtimi i burimeve ---------------------- */

  /** Radhit URL-të e mundshme: vetë kanali, fallback-et e tij, pastaj kanalet me të njëjtin emër. */
  StreamPlayer.candidatesFor = function (entry, allItems, preferredHeight) {
    var type = String(entry.type || 'tv').toLowerCase();
    var norm = function (s) { return String(s || '').trim().toLowerCase(); };
    var twins = (allItems || []).filter(function (x) {
      return x && x !== entry && norm(x.name) === norm(entry.name) &&
        String(x.type || 'tv').toLowerCase() === type && x.url && x.url !== entry.url;
    });
    var group = [entry].concat(twins);
    if (preferredHeight) {
      var dist = function (x) { var q = qualityNumber(x.quality); return q ? Math.abs(q - preferredHeight) : 100000; };
      group = group.map(function (x, i) { return { x: x, i: i, d: dist(x) }; })
        .sort(function (a, b) { return a.d - b.d || a.i - b.i; })
        .map(function (o) { return o.x; });
    }
    var out = [], seen = {};
    var add = function (u) { if (u && !seen[u]) { seen[u] = 1; out.push(u); } };
    group.forEach(function (x) {
      add(x.url);
      [].concat(x.fallbackUrls || x.urls || []).forEach(add);
    });
    return out.slice(0, 8);
  };

  StreamPlayer.prototype._proxify = function (u) {
    var p = this.proxyUrl, enc = encodeURIComponent(u);
    if (p.indexOf('{url}') !== -1) return p.replace('{url}', enc);
    if (/[?&][^=&]+=$/.test(p)) return p + enc;            // p.sh. https://px.example/?url=
    return p + (p.indexOf('?') === -1 ? '?' : '&') + 'url=' + enc;
  };

  StreamPlayer.prototype._expand = function (urls) {
    var pageHttps = global.location && global.location.protocol === 'https:';
    var out = [], self = this;
    urls.forEach(function (u) {
      if (!/^https?:\/\//i.test(u || '')) return;
      var isHttp = /^http:\/\//i.test(u);
      if (pageHttps && isHttp) {
        // Faqe HTTPS nuk lejon burime HTTP: provo versionin https, pastaj proxy-n (nëse ka)
        out.push({ url: 'https://' + u.slice(7), via: 'https-upgrade' });
        if (self.proxyUrl) out.push({ url: self._proxify(u), via: 'proxy' });
      } else {
        out.push({ url: u, via: 'direct' });
        if (self.proxyUrl) out.push({ url: self._proxify(u), via: 'proxy' });
      }
    });
    return out;
  };

  /* ------------------------ ciklet e burimit ------------------------ */

  StreamPlayer.prototype._startSource = function (gen) {
    if (gen !== this._gen) return;
    var src = this.sources[this.idx];
    var self = this;
    this._teardownEngine();
    this.started = false;
    this.lastTime = -1;
    this.lastProgressAt = Date.now();
    this._clear('startup');
    this._clear('retry');
    this._clear('stable');

    this.cb.source({ index: this.idx, total: this.sources.length, via: src.via, url: src.url });
    this.cb.status('Duke u lidhur (' + (this.idx + 1) + '/' + this.sources.length + ')...', 'connecting');

    var timeout = src.via === 'https-upgrade' ? this.cfg.upgradeTimeoutMs : this.cfg.startupTimeoutMs;
    this._timers.startup = setTimeout(function () {
      if (gen !== self._gen || self.started) return;
      self._nextSource(gen, 'Burimi nuk u përgjigj');
    }, timeout);

    Promise.resolve()
      .then(function () { return self._attach(src, gen); })
      .catch(function (err) {
        if (gen !== self._gen) return;
        self._nextSource(gen, (err && err.message) || 'Gabim në burim');
      });
  };

  StreamPlayer.prototype._attach = function (src, gen) {
    var self = this, el = this.el, url = src.url;
    var bare = url.split('?')[0].toLowerCase();
    var isHls = /\.m3u8$/.test(bare) || /m3u8/i.test(url);
    var isTs = /\.(ts|flv|mts)$/.test(bare);
    var isPlaylist = /\.(pls|m3u)$/.test(bare);

    if (isPlaylist && this.isAudio) {
      return this._resolvePlaylist(url).then(function (real) {
        if (gen !== self._gen) return;
        if (!real) throw new Error('Playlist-a nuk u lexua');
        self._attachNative(real, gen);
      });
    }
    if (isHls) {
      if (global.Hls && global.Hls.isSupported()) { this._attachHls(url, gen); return; }
      if (el.canPlayType('application/vnd.apple.mpegurl')) { this._attachNative(url, gen); return; }
      throw new Error('Shfletuesi nuk mbështet HLS');
    }
    if (isTs && !this.isAudio) {
      return this._ensureMpegts().then(function (ok) {
        if (gen !== self._gen) return;
        if (ok && global.mpegts.isSupported()) self._attachMpegts(url, gen);
        else self._attachNative(url, gen);
      });
    }
    this._attachNative(url, gen);
  };

  StreamPlayer.prototype._attachNative = function (url, gen) {
    var el = this.el;
    el.src = url;
    this._safePlay(gen);
  };

  StreamPlayer.prototype._attachHls = function (url, gen) {
    var self = this, el = this.el, Hls = global.Hls;
    var hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false,           // stabilitet para latencës së ulët
      backBufferLength: 30,
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      maxBufferSize: 60 * 1000 * 1000,
      maxBufferHole: 0.5,
      liveSyncDurationCount: 3,
      liveMaxLatencyDurationCount: 10,
      nudgeMaxRetry: 6,
      manifestLoadingMaxRetry: 3,
      manifestLoadingRetryDelay: 1000,
      manifestLoadingMaxRetryTimeout: 8000,
      levelLoadingMaxRetry: 4,
      levelLoadingRetryDelay: 1000,
      levelLoadingMaxRetryTimeout: 8000,
      fragLoadingMaxRetry: 6,
      fragLoadingRetryDelay: 1000,
      fragLoadingMaxRetryTimeout: 16000,
      startLevel: -1,
      abrEwmaDefaultEstimate: 1500000
    });
    this.hls = hls;

    hls.on(Hls.Events.MEDIA_ATTACHED, function () {
      if (gen === self._gen) hls.loadSource(url);
    });
    hls.on(Hls.Events.MANIFEST_PARSED, function () {
      if (gen !== self._gen) return;
      self._applyQualityCap();
      self._safePlay(gen);
    });
    hls.on(Hls.Events.ERROR, function (ev, data) { self._onHlsError(gen, data); });
    hls.attachMedia(el);
  };

  StreamPlayer.prototype._onHlsError = function (gen, data) {
    if (gen !== this._gen || !data || !data.fatal) return; // jo-fatalet i trajton vetë hls.js
    var hls = this.hls, Hls = global.Hls, self = this;
    var code = data.response && data.response.code;

    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
      // 4xx të qëndrueshme (jo 408/429) nuk ndreqen me retry
      if (code >= 400 && code < 500 && code !== 408 && code !== 429) {
        this._nextSource(gen, 'HTTP ' + code);
        return;
      }
      var maxNet = this._maxRetries();
      if (++this.netRetries <= maxNet) {
        this.cb.status('Rilidhje ' + this.netRetries + '/' + maxNet + '...', 'reconnecting');
        this._later('retry', this._backoff(this.netRetries - 1), function () {
          if (gen === self._gen && self.hls === hls) hls.startLoad();
        });
      } else {
        this._nextSource(gen, 'Rrjeti dështoi');
      }
      return;
    }
    if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
      this.mediaRecoveries++;
      if (this.mediaRecoveries === 1) {
        this.cb.status('Duke riparuar stream-in...', 'repairing');
        hls.recoverMediaError();
      } else if (this.mediaRecoveries === 2) {
        this.cb.status('Duke riparuar stream-in (audio)...', 'repairing');
        hls.swapAudioCodec();
        hls.recoverMediaError();
      } else {
        this._nextSource(gen, 'Gabim media');
      }
      return;
    }
    this._nextSource(gen, data.details || 'Gabim i panjohur');
  };

  StreamPlayer.prototype._ensureMpegts = function () {
    var self = this;
    if (global.mpegts) return Promise.resolve(true);
    if (this._mpegtsLoading) return this._mpegtsLoading;
    this._mpegtsLoading = new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = self.cfg.mpegtsUrl;
      s.onload = function () { resolve(!!global.mpegts); };
      s.onerror = function () { resolve(false); };
      document.head.appendChild(s);
    });
    return this._mpegtsLoading;
  };

  StreamPlayer.prototype._attachMpegts = function (url, gen) {
    var self = this;
    var p = global.mpegts.createPlayer(
      { type: url.split('?')[0].toLowerCase().endsWith('.flv') ? 'flv' : 'mpegts', isLive: true, url: url },
      { enableWorker: true, liveBufferLatencyChasing: true, liveBufferLatencyMaxLatency: 8, liveBufferLatencyMinRemain: 1 }
    );
    this.mpegts = p;
    p.on(global.mpegts.Events.ERROR, function (type, detail) {
      if (gen === self._gen) self._nextSource(gen, 'MPEG-TS: ' + (detail || type));
    });
    p.attachMediaElement(this.el);
    p.load();
    this._safePlay(gen);
  };

  StreamPlayer.prototype._resolvePlaylist = function (url) {
    return fetch(url, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (txt) {
        var m = txt.match(/^\s*File\d+\s*=\s*(https?:\/\/\S+)/mi) || txt.match(/^\s*(https?:\/\/\S+)/m);
        return m ? m[1].trim() : '';
      })
      .catch(function () { return ''; });
  };

  StreamPlayer.prototype._safePlay = function (gen) {
    var self = this, p;
    try { p = this.el.play(); } catch (e) { return; }
    if (p && p.catch) {
      p.catch(function (err) {
        if (gen !== self._gen) return;
        if (err && err.name === 'NotAllowedError') {
          // Autoplay i bllokuar: nuk është gabim i burimit, pret klikimin e përdoruesit
          self._clear('startup');
          self.cb.status('Kliko Play për të nisur', 'paused');
        }
        // AbortError del kur ndërrohet burimi - normale
      });
    }
  };

  /* ------------------ ngjarjet e elementit + watchdog ------------------ */

  StreamPlayer.prototype._bindElementEvents = function (gen) {
    var self = this, el = this.el;
    if (this._ac) { try { this._ac.abort(); } catch (e) { /* ignore */ } }
    this._ac = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var opt = this._ac ? { signal: this._ac.signal } : false;
    var on = function (name, fn) { el.addEventListener(name, function (e) { if (gen === self._gen) fn(e); }, opt); };

    on('playing', function () {
      self.started = true;
      self.failed = false;
      self._clear('startup');
      self.lastProgressAt = Date.now();
      self.cb.status('Duke luajtur', 'connected');
      self._clear('stable');
      self._timers.stable = setTimeout(function () {
        if (gen !== self._gen) return;
        self.retries = 0; self.netRetries = 0; self.mediaRecoveries = 0; self.round = 0;
      }, self.cfg.stableAfterMs);
      self._startWatchdog(gen);
    });
    on('waiting', function () {
      if (self.started) self.cb.status('Duke bufferuar...', 'buffering');
      self._clear('stable');
    });
    on('pause', function () { if (self.started && !el.ended) self.cb.status('Pauzë', 'paused'); });
    on('error', function () {
      // Për burimet native (audio/video pa hls.js)
      if (self.hls || self.mpegts) return;
      var err = el.error;
      self._recover(gen, 'Gabim media' + (err && err.code ? ' (' + err.code + ')' : ''));
    });
    on('ended', function () {
      // Vetëm streamet live (duration i pafund) rilidhen; filmat/VOD mund të mbarojnë normalisht
      if (self.started && !isFinite(el.duration)) self._recover(gen, 'Stream-i përfundoi');
    });
  };

  StreamPlayer.prototype._startWatchdog = function (gen) {
    var self = this, el = this.el;
    this._clear('watchdog');
    this._timers.watchdog = setInterval(function () {
      if (gen !== self._gen) return;
      if (el.paused || el.ended) { self.lastProgressAt = Date.now(); return; }
      if (!self.isAudio && typeof document !== 'undefined' && document.hidden) { self.lastProgressAt = Date.now(); return; }
      var t = el.currentTime;
      if (Math.abs(t - self.lastTime) > 0.05) {
        self.lastTime = t;
        self.lastProgressAt = Date.now();
        return;
      }
      if (Date.now() - self.lastProgressAt >= self.cfg.stallTimeoutMs) {
        self.lastProgressAt = Date.now();
        self._recover(gen, 'Stream-i ngeci');
      }
    }, this.cfg.watchdogIntervalMs);
  };

  /** Rilidhje e burimit aktual me backoff; kur mbarojnë provat kalon te burimi tjetër. */
  StreamPlayer.prototype._recover = function (gen, reason) {
    if (gen !== this._gen) return;
    var self = this;
    var max = this._maxRetries();
    if (this.retries >= max) { this._nextSource(gen, reason); return; }
    var attempt = this.retries++;
    this.cb.status(reason + ' - rilidhje ' + this.retries + '/' + max + '...', 'reconnecting');
    this._clear('watchdog');
    this._later('retry', this._backoff(attempt), function () {
      if (gen === self._gen) self._startSource(gen);
    });
  };

  StreamPlayer.prototype._nextSource = function (gen, reason) {
    if (gen !== this._gen) return;
    var self = this;
    this._clear('startup');
    this._clear('watchdog');
    this._clear('retry');
    this.retries = 0; this.netRetries = 0; this.mediaRecoveries = 0;
    this.idx++;
    var wrapped = false;
    if (this.idx >= this.sources.length) {
      this.idx = 0;
      this.round++;
      wrapped = true;
      if (this.round >= this.cfg.maxRounds) {
        this._fail(gen, reason || 'Asnjë burim nuk punon');
        return;
      }
    }
    if (this.sources.length > 1 || wrapped) {
      this.cb.status((reason ? reason + ' - ' : '') + 'duke provuar burimin tjetër...', 'reconnecting');
    }
    this._later('retry', wrapped ? 2000 : 300, function () {
      if (gen === self._gen) self._startSource(gen);
    });
  };

  StreamPlayer.prototype._fail = function (gen, message) {
    if (gen !== this._gen) return;
    this.failed = true;
    this._clearTimers();
    this._teardownEngine();
    this.cb.status(message, 'error');
    this.cb.error({ fatal: true, message: message, entry: this.entry });
  };

  /* --------------------------- statistika --------------------------- */

  StreamPlayer.prototype._startStats = function (gen) {
    var self = this;
    this._clear('stats');
    this._timers.stats = setInterval(function () {
      if (gen !== self._gen) return;
      self.cb.stats(self.getStats());
    }, this.cfg.statsIntervalMs);
  };

  StreamPlayer.prototype._applyQualityCap = function () {
    var hls = this.hls;
    if (!hls || !hls.levels || !hls.levels.length) return;
    if (!this.qualityHeight) { hls.autoLevelCapping = -1; return; }
    var best = -1, lowest = 0, lowestH = Infinity;
    hls.levels.forEach(function (l, i) {
      var h = l.height || 0;
      if (h && h < lowestH) { lowestH = h; lowest = i; }
    });
    var bestH = -1;
    hls.levels.forEach(function (l, i) {
      var h = l.height || 0;
      if (h && h <= this.qualityHeight && h > bestH) { bestH = h; best = i; }
    }, this);
    if (best < 0) best = lowest;
    hls.autoLevelCapping = best;
    if (hls.currentLevel > best) hls.nextLevel = best;
  };

  /* ----------------------------- ndihmëse ----------------------------- */

  // Provat http->https dështojnë shpejt (certifikata) - mos humb kohë me retry
  StreamPlayer.prototype._maxRetries = function () {
    return this._currentVia() === 'https-upgrade' ? 0 : this.cfg.maxRetriesPerSource;
  };

  StreamPlayer.prototype._currentVia = function () {
    var s = this.sources[this.idx];
    return s ? s.via : '';
  };

  StreamPlayer.prototype._backoff = function (attempt) {
    var d = Math.min(this.cfg.backoffMaxMs, this.cfg.backoffBaseMs * Math.pow(2, attempt));
    return d + Math.floor(Math.random() * this.cfg.backoffJitterMs);
  };

  StreamPlayer.prototype._later = function (name, ms, fn) {
    this._clear(name);
    this._timers[name] = setTimeout(fn, ms);
  };

  StreamPlayer.prototype._clear = function (name) {
    if (this._timers[name]) {
      clearTimeout(this._timers[name]);
      clearInterval(this._timers[name]);
      this._timers[name] = null;
    }
  };

  StreamPlayer.prototype._clearTimers = function () {
    for (var k in this._timers) { if (Object.prototype.hasOwnProperty.call(this._timers, k)) this._clear(k); }
  };

  StreamPlayer.prototype._teardownEngine = function () {
    if (this.hls) { try { this.hls.destroy(); } catch (e) { /* ignore */ } this.hls = null; }
    if (this.mpegts) {
      try { this.mpegts.unload(); this.mpegts.detachMediaElement(); this.mpegts.destroy(); } catch (e) { /* ignore */ }
      this.mpegts = null;
    }
  };

  StreamPlayer.DEFAULTS = DEFAULTS;
  global.StreamPlayer = StreamPlayer;
  if (typeof module !== 'undefined' && module.exports) module.exports = StreamPlayer;
})(typeof window !== 'undefined' ? window : globalThis);

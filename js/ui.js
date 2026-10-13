/** Ndërfaqja: lista e kanaleve, kontrollet, mbivendosjet dhe shkurtoret e tastierës. */
import { CONFIG } from './config.js';
import { favorites, history, storage } from './storage.js';
import { filterChannels, offlineLast, groupsOf, sortChannels } from './channels.js';

const $ = (sel) => document.querySelector(sel);
const STATUS_LABEL = { online: 'Online', slow: 'Ngadalë', offline: 'Offline', blocked: 'I bllokuar', unknown: 'E panjohur', soon: 'Së shpejti' };

export class UI {
  /**
   * @param {{channels:any[], player:any, health:any, epg:any}} deps
   */
  constructor({ channels, player, health, epg, catalog }) {
    this.all = channels;
    this.catalog = catalog || { index: { countries: [] }, loaded: new Set(), load: async () => [] };
    this.country = storage.get('country', '');
    if (this.country && this.country !== '*' && !this.catalog.loaded.has(this.country)) this.country = '';
    this.player = player;
    this.health = health;
    this.epg = epg;

    this.view = [];
    this.focusIndex = -1;
    this.activeId = storage.get('lastChannel', null);
    this.rendered = 0;
    this.tab = storage.get('tab', 'all');
    this.group = '';
    this.hideOffline = storage.get('hideOffline', false);
    this.numberBuffer = '';
    this.numberTimer = null;
    this.toastTimer = null;

    this.el = {
      list: $('#channelList'), search: $('#search'), tabs: $('#tabs'), group: $('#groupSelect'), countrySel: $('#countrySelect'),
      hide: $('#hideOffline'), testBtn: $('#testBtn'), installBtn: $('#installBtn'),
      video: $('#video'), audio: $('#audio'), screen: $('#screen'),
      overlay: $('#overlay'), spinner: $('#spinner'), oTitle: $('#overlayTitle'), oText: $('#overlayText'),
      oActions: $('#overlayActions'), retry: $('#retryBtn'), alt: $('#altSourceBtn'), nextChan: $('#nextChannelBtn'),
      chanNumber: $('#chanNumber'), toast: $('#toast'),
      play: $('#playBtn'), prev: $('#prevBtn'), next: $('#nextBtn'), mute: $('#muteBtn'), volume: $('#volume'),
      quality: $('#qualitySelect'), star: $('#starBtn'), cast: $('#castBtn'), pip: $('#pipBtn'), fs: $('#fsBtn'),
      nowName: $('#nowName'), nowSub: $('#nowSub'), nowLogo: $('#nowLogo'),
      signal: $('#signal'), statusText: $('#statusText'), statsText: $('#statsText'),
      epg: $('#epg'), epgNow: $('#epgNow'), epgNext: $('#epgNext'),
      radioArt: $('#radioArt'), radioLogo: $('#radioLogo'), logoMask: $('#logoMask'),
      count: $('#countText'), healthText: $('#healthText'), progress: $('#healthProgress'),
    };
  }

  init() {
    this._buildCountries();
    this._buildGroups();
    this._restorePrefs();
    this._bindEvents();
    this.applyFilters();
    this._startStatsLoop();
    this._setupCapabilities();
    // vendos kanalin e fundit si të zgjedhur (pa e nisur automatikisht)
    const last = this.all.find((c) => c.id === this.activeId);
    if (last) this._showNow(last);
  }

  /* ---------------- përgatitje ---------------- */

  _buildGroups() {
    const g = this.el.group;
    g.innerHTML = '<option value="">Të gjitha grupet</option>';
    const scope = this.country && this.country !== '*' ? this.all.filter((c) => c._cc === this.country) : this.all;
    for (const [name, n] of groupsOf(scope).slice(0, 80)) {
      const o = document.createElement('option');
      o.value = name;
      o.textContent = `${name} (${n})`;
      g.appendChild(o);
    }
  }

  _restorePrefs() {
    const vol = storage.get('volume', 1);
    const muted = storage.get('muted', false);
    this.player.setVolume(vol);
    this.player.setMuted(muted);
    this.el.volume.value = String(vol);
    this._renderMute();
    this.player.preferredHeight = Number(storage.get('quality', 0)) || 0;
    this.el.hide.checked = this.hideOffline;
    for (const b of this.el.tabs.querySelectorAll('.tab')) b.classList.toggle('active', b.dataset.tab === this.tab);
  }

  _setupCapabilities() {
    const v = this.el.video;
    if (document.pictureInPictureEnabled || typeof v.webkitSetPresentationMode === 'function') this.el.pip.hidden = false;
    if (v.remote || typeof v.webkitShowPlaybackTargetPicker === 'function') this.el.cast.hidden = false;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this._installEvent = e;
      this.el.installBtn.hidden = false;
    });
    window.addEventListener('appinstalled', () => { this.el.installBtn.hidden = true; });
  }

  /* ---------------- shtetet (lazy-load) ---------------- */

  _buildCountries() {
    const sel = this.el.countrySel;
    const { countries } = this.catalog.index;
    const loaded = this.catalog.loaded;
    const opt = (value, text) => {
      const o = document.createElement('option');
      o.value = value;
      o.textContent = text;
      return o;
    };
    sel.innerHTML = '';
    sel.appendChild(opt('', 'Të ngarkuarat'));
    for (const c of countries) {
      sel.appendChild(opt(c.code, `${loaded.has(c.code) ? '' : '⬇ '}${c.name} (${c.tv + c.radio})`));
    }
    sel.appendChild(opt('*', '⬇ Të gjitha shtetet (ngarko gjithçka)'));
    sel.value = this.country;
    if (sel.value !== this.country) { this.country = ''; sel.value = ''; }
  }

  async setCountry(code) {
    const { index, loaded } = this.catalog;
    const targets = code === '*' ? index.countries.map((c) => c.code) : (code ? [code] : []);
    const missing = targets.filter((c) => !loaded.has(c));
    if (missing.length) {
      this.toast(missing.length > 1 ? `Po ngarkoj ${missing.length} shtete…` : 'Po ngarkoj kanalet…', 4000);
      this.el.countrySel.disabled = true;
      try {
        const lists = await Promise.all(missing.map(async (c) => {
          const [list] = await Promise.all([this.catalog.load(c), this.health.loadCountry(c, { emit: false })]);
          loaded.add(c);
          return list;
        }));
        this.all = sortChannels([...this.all, ...lists.flat()]);
      } catch (e) {
        this.toast(`Nuk u ngarkua: ${e.message}`, 4000);
        this.country = '';
        this.el.countrySel.value = '';
        this.el.countrySel.disabled = false;
        return;
      }
      this.el.countrySel.disabled = false;
      this.health.refresh();
    }
    this.country = code;
    storage.set('country', code);
    this.group = '';
    this._buildCountries();
    this._buildGroups();
    this.applyFilters();
    this.refreshStatuses();
  }

  _rememberCountry(c) {
    if (!c._cc) return;
    const map = storage.get('chanCountry', {});
    if (map[c.id] === c._cc) return;
    map[c.id] = c._cc;
    const keys = Object.keys(map);
    if (keys.length > 500) for (const k of keys.slice(0, keys.length - 500)) delete map[k];
    storage.set('chanCountry', map);
  }

  /* ---------------- filtrimi + lista ---------------- */

  applyFilters() {
    const hideOff = this.hideOffline;
    const statusOf = (c) => this.health.statusOf(c);
    let list = filterChannels(this.all, {
      tab: this.tab,
      group: this.group,
      country: this.country === '*' ? '' : this.country,
      query: this.el.search.value,
      favs: favorites.all(),
      hist: history.all(),
      hideOffline: hideOff,
      statusOf,
    });
    if (!hideOff && this.tab !== 'history') list = offlineLast(list, statusOf);
    this.view = list;
    this.rendered = 0;
    this.el.list.innerHTML = '';
    const idx = list.findIndex((c) => c.id === this.activeId);
    this.focusIndex = idx >= 0 ? idx : (list.length ? 0 : -1);
    this._renderChunk(Math.max(CONFIG.LIST_CHUNK, idx + 20));
    this.el.count.textContent = `${list.length} kanale`;
    if (!list.length) {
      this.el.list.innerHTML = `<li class="empty">${this.tab === 'favorites'
        ? 'S\'ke asnjë të preferuar. Prek ☆ pranë një kanali.'
        : 'Nuk u gjet asnjë kanal.'}${this._unloadedCount() ? `<br><button class="link" data-load-all="1">Kërko në të gjitha shtetet (${this._unloadedCount()} të pangarkuar)</button>` : ''}</li>`;
    }
    this._scrollToFocus();
  }

  _renderChunk(upTo) {
    const end = Math.min(this.view.length, upTo);
    const frag = document.createDocumentFragment();
    for (let i = this.rendered; i < end; i++) frag.appendChild(this._row(this.view[i], i));
    this.el.list.appendChild(frag);
    this.rendered = end;
  }

  _row(c, i) {
    const li = document.createElement('li');
    li.dataset.index = String(i);
    li.setAttribute('role', 'option');
    const st = this.health.statusOf(c);
    li.className = [
      c.id === this.activeId ? 'active' : '',
      i === this.focusIndex ? 'focused' : '',
      st === 'offline' ? 'offline' : '',
    ].filter(Boolean).join(' ');

    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = String(i + 1);

    let logo;
    if (c.logo) {
      logo = document.createElement('img');
      logo.className = 'logo';
      logo.loading = 'lazy';
      logo.referrerPolicy = 'no-referrer';
      logo.alt = '';
      logo.src = c.logo;
      logo.onerror = () => { logo.replaceWith(this._placeholder(c)); };
    } else {
      logo = this._placeholder(c);
    }

    const body = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = c.name + (c.quality ? ` · ${c.quality}` : '');
    const group = document.createElement('div');
    group.className = 'group';
    group.textContent = `${c.type === 'radio' ? '📻 ' : ''}${c.group || ''}${c.sources.length > 1 ? ` · ${c.sources.length} burime` : ''}`;
    body.append(name, group);

    const dot = document.createElement('span');
    dot.className = `dot ${st}`;
    dot.title = STATUS_LABEL[st] || '';

    const star = document.createElement('button');
    star.className = 'star' + (favorites.has(c.id) ? ' on' : '');
    star.textContent = favorites.has(c.id) ? '★' : '☆';
    star.title = 'Të preferuarat';
    star.setAttribute('aria-label', 'Të preferuarat');
    star.tabIndex = -1;
    star.dataset.star = '1';

    li.append(num, logo, body, dot, star);
    return li;
  }

  _placeholder(c) {
    const d = document.createElement('div');
    d.className = 'logo ph';
    d.textContent = c.type === 'radio' ? '📻' : '📺';
    return d;
  }

  _setFocus(i, { scroll = true } = {}) {
    if (!this.view.length) return;
    i = Math.max(0, Math.min(this.view.length - 1, i));
    if (i >= this.rendered) this._renderChunk(i + CONFIG.LIST_CHUNK);
    const prev = this.el.list.querySelector('li.focused');
    if (prev) prev.classList.remove('focused');
    this.focusIndex = i;
    const li = this.el.list.querySelector(`li[data-index="${i}"]`);
    if (li) li.classList.add('focused');
    if (scroll) this._scrollToFocus();
  }

  _scrollToFocus() {
    const li = this.el.list.querySelector('li.focused');
    if (li) li.scrollIntoView({ block: 'nearest' });
  }

  refreshStatuses() {
    // kanali "së shpejti" filloi të transmetojë: luaje
    if (this._soonId) {
      const sc = this.all.find((x) => x.id === this._soonId);
      if (sc && this.activeId === sc.id && this.health.statusOf(sc) !== 'soon') this.playChannel(sc);
    }
    // përditëso vetëm pikat e shëndetit pa rindërtuar listën
    for (const li of this.el.list.querySelectorAll('li[data-index]')) {
      const c = this.view[Number(li.dataset.index)];
      if (!c) continue;
      const st = this.health.statusOf(c);
      const dot = li.querySelector('.dot');
      if (dot) { dot.className = `dot ${st}`; dot.title = STATUS_LABEL[st] || ''; }
      li.classList.toggle('offline', st === 'offline');
    }
    const { done, total, active } = this.health.progress;
    this.el.progress.hidden = !active;
    if (active && total) this.el.progress.firstElementChild.style.width = `${Math.round((done / total) * 100)}%`;
    this.el.healthText.textContent = active ? `Test: ${done}/${total}` : '';
    this.el.testBtn.disabled = active;
  }

  _unloadedCount() {
    return this.catalog.index.countries.filter((c) => !this.catalog.loaded.has(c.code)).length;
  }

  /* ---------------- luajtja ---------------- */

  playChannel(c, { sourceIndex = 0 } = {}) {
    if (!c) return;
    this.activeId = c.id;
    storage.set('lastChannel', c.id);
    history.add(c.id);
    this._showNow(c);
    for (const li of this.el.list.querySelectorAll('li.active')) li.classList.remove('active');
    const idx = this.view.findIndex((x) => x.id === c.id);
    if (idx >= 0) {
      this._setFocus(idx);
      const li = this.el.list.querySelector(`li[data-index="${idx}"]`);
      if (li) li.classList.add('active');
    }
    this._rememberCountry(c);
    if (c.soon && this.health.statusOf(c) === 'soon') {
      // ende pa transmetim: mos e provo; testo në sfond dhe luaj automatikisht kur të nisë
      this._soonId = c.id;
      this.el.logoMask.hidden = true;
      this.player.stop(true);
      this.el.overlay.hidden = false;
      this.el.spinner.hidden = true;
      this.el.oActions.hidden = true;
      this.el.oTitle.textContent = 'Së shpejti';
      this.el.oText.textContent = `Transmetimi i ${c.name} do të nisë së shpejti.`;
      this.el.statusText.className = 'status-text warn';
      this.el.statusText.textContent = 'Së shpejti';
      this.health.enqueue([c], { force: true });
      return;
    }
    this._soonId = null;
    // burimet nga tvmak.com kanë logon e tyre në video: e mbulojmë me logon e Mini IPTV
    this.el.logoMask.hidden = !(c.type !== 'radio' && c.sources.some((s) => /(^|\/\/|\.)tvmak\.com[/:]/i.test(s.url)));
    this.player.play(c, { sourceIndex });
    // preload i kanalit pasardhës
    const next = this.view[(idx + 1) % Math.max(1, this.view.length)];
    if (next && next.id !== c.id) this.player.preload(next);
    document.title = `${c.name} · Mini IPTV`;
    this._mediaSession(c);
  }

  /** Media Session: titulli/logo në ekranin e kyçur dhe tastet e kufjeve/njoftimeve. */
  _mediaSession(c) {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: c.name,
        artist: [c.group, c.type === 'radio' ? 'Radio' : 'TV'].filter(Boolean).join(' · '),
        album: 'Mini IPTV',
        artwork: c.logo ? [{ src: c.logo }] : [],
      });
      if (this._msBound) return;
      this._msBound = true;
      const set = (a, fn) => { try { navigator.mediaSession.setActionHandler(a, fn); } catch { /* nuk mbështetet */ } };
      set('play', () => { if (this.player.media && this.player.media.paused) this.player.togglePause(); });
      set('pause', () => { if (this.player.media && !this.player.media.paused) this.player.togglePause(); });
      set('previoustrack', () => this.step(-1));
      set('nexttrack', () => this.step(1));
    } catch { /* Media Session opsional */ }
  }

  _showNow(c) {
    this.el.nowName.textContent = c.name;
    const parts = [c.group, c.quality, c.type === 'radio' ? 'Radio' : 'TV'].filter(Boolean);
    this.el.nowSub.textContent = parts.join(' · ');
    if (c.logo) {
      this.el.nowLogo.src = c.logo;
      this.el.nowLogo.hidden = false;
      this.el.nowLogo.onerror = () => { this.el.nowLogo.hidden = true; };
    } else {
      this.el.nowLogo.hidden = true;
    }
    const isRadio = c.type === 'radio';
    this.el.radioArt.hidden = !isRadio;
    this.el.video.style.visibility = isRadio ? 'hidden' : '';
    if (isRadio) this.el.radioLogo.src = c.logo || 'icons/icon.svg';
    this._renderStar();
    this._renderEpg(c);
  }

  _renderEpg(c) {
    const info = this.epg && this.epg.lookup(c);
    this.el.epg.hidden = !info;
    if (info) {
      this.el.epgNow.textContent = info.now || '—';
      this.el.epgNext.textContent = info.next || '—';
    }
  }

  get current() { return this.all.find((c) => c.id === this.activeId) || null; }

  step(delta) {
    if (!this.view.length) return;
    const idx = this.view.findIndex((c) => c.id === this.activeId);
    const next = (idx + delta + this.view.length) % this.view.length;
    this.playChannel(this.view[next]);
  }

  /** Përditëson mbivendosjen dhe tekstin e statusit nga gjendjet e lojtarit. */
  onPlayerState({ state, message, attempt }) {
    const o = this.el;
    const showOverlay = ['loading', 'reconnecting', 'error'].includes(state)
      || (state === 'paused' && message);
    o.overlay.hidden = !showOverlay;
    o.spinner.hidden = !(state === 'loading' || state === 'reconnecting' || state === 'buffering');
    o.oActions.hidden = state !== 'error';
    o.screen.classList.toggle('paused', state === 'paused');
    const cls = { playing: 'ok', buffering: 'warn', reconnecting: 'warn', loading: 'warn', error: 'bad' }[state] || '';
    o.statusText.className = `status-text ${cls}`;

    const src = attempt && attempt.sourceCount > 1 ? ` · burimi ${attempt.sourceIndex + 1}/${attempt.sourceCount}` : '';
    switch (state) {
      case 'loading':
        o.oTitle.textContent = 'Duke u lidhur…';
        o.oText.textContent = (message || '') + src;
        o.statusText.textContent = 'Duke u lidhur';
        break;
      case 'reconnecting':
        o.oTitle.textContent = 'Rilidhje automatike';
        o.oText.textContent = message || '';
        o.statusText.textContent = 'Rilidhje…';
        break;
      case 'buffering':
        o.statusText.textContent = 'Duke bufferuar…';
        break;
      case 'playing':
        o.statusText.textContent = `Duke luajtur${attempt && attempt.via === 'proxy' ? ' (proxy)' : ''}`;
        break;
      case 'paused':
        o.oTitle.textContent = 'Pauzë';
        o.oText.textContent = message || '';
        o.statusText.textContent = 'Pauzë';
        break;
      case 'error':
        o.oTitle.textContent = 'Nuk ka sinjal';
        o.oText.textContent = message || 'Kanali nuk është i disponueshëm.';
        o.statusText.textContent = 'Gabim';
        o.alt.hidden = !(this.current && this.current.sources.length > 1);
        break;
      default:
        o.statusText.textContent = 'Gati';
    }
    o.play.textContent = state === 'playing' || state === 'buffering' ? '⏸' : '▶';
    if (state === 'playing') this.toast(this.current ? this.current.name : '');
  }

  onLevels({ levels, current, auto }) {
    const sel = this.el.quality;
    const heights = [...new Set(levels.map((l) => l.height).filter(Boolean))].sort((a, b) => b - a);
    const sig = heights.join(',');
    if (sel.dataset.sig !== sig) {
      sel.dataset.sig = sig;
      sel.innerHTML = '<option value="0">Auto</option>' + heights.map((h) => `<option value="${h}">${h}p</option>`).join('');
      sel.value = String(this.player.preferredHeight || 0);
      if (sel.value !== String(this.player.preferredHeight || 0)) sel.value = '0';
    }
    sel.disabled = heights.length < 2;
    if (current >= 0 && levels[current] && auto) {
      sel.options[0].textContent = levels[current].height ? `Auto (${levels[current].height}p)` : 'Auto';
    } else if (sel.options[0]) {
      sel.options[0].textContent = 'Auto';
    }
  }

  /* ---------------- statistika ---------------- */

  _startStatsLoop() {
    setInterval(() => {
      if (!this.activeId) return;
      const s = this.player.stats();
      let level = 0;
      if (!s.paused || this.player._lastState === 'playing') {
        if (s.bufferAhead >= 12) level = 4;
        else if (s.bufferAhead >= 6) level = 3;
        else if (s.bufferAhead >= 2) level = 2;
        else if (this.player._lastState === 'playing') level = 1;
      }
      if (this.player._lastState === 'idle' || this.player._lastState === 'error') level = 0;
      this.el.signal.dataset.level = String(level);
      const bits = [];
      if (s.height) bits.push(`${s.height}p`);
      if (s.bitrateKbps) bits.push(`${(s.bitrateKbps / 1000).toFixed(1)} Mbps`);
      if (s.bufferAhead) bits.push(`buffer ${s.bufferAhead.toFixed(0)}s`);
      this.el.statsText.textContent = bits.join(' · ');
    }, 1000);
  }

  /* ---------------- komponentë të vegjël ---------------- */

  toast(text, ms = 1800) {
    if (!text) return;
    const t = this.el.toast;
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => t.classList.remove('show'), ms);
  }

  _renderStar() {
    const c = this.current;
    const on = !!c && favorites.has(c.id);
    this.el.star.textContent = on ? '★' : '☆';
    this.el.star.classList.toggle('on', on);
  }

  _renderMute() {
    const muted = this.player.muted || this.player.volume === 0;
    this.el.mute.textContent = muted ? '🔇' : '🔊';
  }

  toggleFavorite(c) {
    if (!c) return;
    const on = favorites.toggle(c.id);
    if (on) this._rememberCountry(c);
    this.toast(on ? `★ ${c.name} u shtua te të preferuarat` : `${c.name} u hoq nga të preferuarat`);
    this._renderStar();
    if (this.tab === 'favorites') this.applyFilters();
    else {
      const idx = this.view.findIndex((x) => x.id === c.id);
      const li = this.el.list.querySelector(`li[data-index="${idx}"] .star`);
      if (li) { li.classList.toggle('on', on); li.textContent = on ? '★' : '☆'; }
    }
  }

  togglePip() {
    const v = this.el.video;
    if (document.pictureInPictureElement) { document.exitPictureInPicture().catch(() => {}); return; }
    if (v.requestPictureInPicture) v.requestPictureInPicture().catch(() => this.toast('PiP nuk është i disponueshëm'));
    else if (v.webkitSetPresentationMode) {
      v.webkitSetPresentationMode(v.webkitPresentationMode === 'picture-in-picture' ? 'inline' : 'picture-in-picture');
    }
  }

  toggleFullscreen() {
    const el = this.el.screen;
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (this.el.video.webkitEnterFullscreen) this.el.video.webkitEnterFullscreen();
  }

  cast() {
    const v = this.el.video;
    if (typeof v.webkitShowPlaybackTargetPicker === 'function') { v.webkitShowPlaybackTargetPicker(); return; }
    if (v.remote && typeof v.remote.prompt === 'function') {
      v.remote.prompt().catch((e) => {
        this.toast(e && e.name === 'NotSupportedError'
          ? 'Cast nuk mbështetet për këtë stream (përdor Cast nga menyja e Chrome)'
          : 'Cast nuk u hap');
      });
    }
  }

  _gotoNumber(n) {
    if (n >= 1 && n <= this.view.length) this.playChannel(this.view[n - 1]);
    else this.toast(`Nuk ka kanal me numër ${n}`);
  }

  _numberKey(d) {
    this.numberBuffer += d;
    const box = this.el.chanNumber;
    box.textContent = this.numberBuffer;
    box.hidden = false;
    clearTimeout(this.numberTimer);
    this.numberTimer = setTimeout(() => {
      const n = Number(this.numberBuffer);
      this.numberBuffer = '';
      box.hidden = true;
      this._gotoNumber(n);
    }, CONFIG.NUMBER_KEY_TIMEOUT_MS);
  }

  /* ---------------- ngjarjet ---------------- */

  _bindEvents() {
    const e = this.el;
    let searchTimer;
    e.search.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => this.applyFilters(), 150);
    });
    e.tabs.addEventListener('click', (ev) => {
      const b = ev.target.closest('.tab');
      if (!b) return;
      this.tab = b.dataset.tab;
      storage.set('tab', this.tab);
      for (const t of e.tabs.querySelectorAll('.tab')) t.classList.toggle('active', t === b);
      this.applyFilters();
    });
    e.countrySel.addEventListener('change', () => this.setCountry(e.countrySel.value));
    e.group.addEventListener('change', () => { this.group = e.group.value; this.applyFilters(); });
    e.hide.addEventListener('change', () => {
      this.hideOffline = e.hide.checked;
      storage.set('hideOffline', this.hideOffline);
      this.applyFilters();
    });
    e.testBtn.addEventListener('click', () => {
      const n = this.health.enqueue(this.view, { force: true });
      this.toast(n ? `Po testoj ${n} burime…` : 'Asgjë për të testuar');
    });
    e.installBtn.addEventListener('click', async () => {
      if (!this._installEvent) return;
      this._installEvent.prompt();
      await this._installEvent.userChoice.catch(() => {});
      this._installEvent = null;
      e.installBtn.hidden = true;
    });

    // lista
    e.list.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-load-all]')) { this.setCountry('*'); return; }
      const li = ev.target.closest('li[data-index]');
      if (!li) return;
      const c = this.view[Number(li.dataset.index)];
      if (ev.target.closest('[data-star]')) { this.toggleFavorite(c); return; }
      this._setFocus(Number(li.dataset.index), { scroll: false });
      this.playChannel(c);
    });
    e.list.addEventListener('scroll', () => {
      const l = e.list;
      if (this.rendered < this.view.length && l.scrollTop + l.clientHeight > l.scrollHeight - 300) {
        this._renderChunk(this.rendered + CONFIG.LIST_CHUNK);
      }
    });

    // kontrollet
    e.play.addEventListener('click', () => {
      if (!this.current) { if (this.view[0]) this.playChannel(this.view[0]); return; }
      if (['idle', 'error'].includes(this.player._lastState)) this.player.retry();
      else this.player.togglePause();
    });
    e.prev.addEventListener('click', () => this.step(-1));
    e.next.addEventListener('click', () => this.step(1));
    e.mute.addEventListener('click', () => this._toggleMute());
    e.volume.addEventListener('input', () => this._setVolume(Number(e.volume.value)));
    e.quality.addEventListener('change', () => {
      const h = Number(e.quality.value) || 0;
      this.player.setQuality(h);
      storage.set('quality', h);
    });
    e.star.addEventListener('click', () => this.toggleFavorite(this.current));
    e.pip.addEventListener('click', () => this.togglePip());
    e.fs.addEventListener('click', () => this.toggleFullscreen());
    e.cast.addEventListener('click', () => this.cast());
    e.retry.addEventListener('click', () => this.player.retry());
    e.alt.addEventListener('click', () => this.player.nextSource());
    e.nextChan.addEventListener('click', () => this.step(1));
    e.overlay.addEventListener('click', (ev) => {
      // prek mbi "Pauzë"/"Prek për të luajtur"
      if (this.player._lastState === 'paused' && !ev.target.closest('button')) this.player.togglePause();
    });
    e.screen.addEventListener('dblclick', () => this.toggleFullscreen());

    document.addEventListener('keydown', (ev) => this._onKey(ev));
  }

  _setVolume(v) {
    this.player.setVolume(v);
    this.player.setMuted(false);
    this.el.volume.value = String(v);
    storage.set('volume', v);
    storage.set('muted', false);
    this._renderMute();
  }

  _toggleMute() {
    this.player.setMuted(!this.player.muted);
    storage.set('muted', this.player.muted);
    this._renderMute();
  }

  _onKey(ev) {
    const t = ev.target;
    const typing = t && (t.tagName === 'INPUT' && t.type !== 'range' && t.type !== 'checkbox' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA');
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (typing) {
      if (ev.key === 'Escape') t.blur();
      if (ev.key === 'Enter' && t === this.el.search) { t.blur(); this._playFocused(); }
      return;
    }
    const k = ev.key;
    if (/^[0-9]$/.test(k)) { ev.preventDefault(); this._numberKey(k); return; }
    switch (k) {
      case 'ArrowDown': ev.preventDefault(); this._setFocus(this.focusIndex + 1); break;
      case 'ArrowUp': ev.preventDefault(); this._setFocus(this.focusIndex - 1); break;
      case 'PageDown': ev.preventDefault(); this._setFocus(this.focusIndex + 10); break;
      case 'PageUp': ev.preventDefault(); this._setFocus(this.focusIndex - 10); break;
      case 'Home': ev.preventDefault(); this._setFocus(0); break;
      case 'End': ev.preventDefault(); this._setFocus(this.view.length - 1); break;
      case 'Enter': ev.preventDefault(); this._playFocused(); break;
      case 'ArrowRight': case 'ChannelUp': ev.preventDefault(); this.step(1); break;
      case 'ArrowLeft': case 'ChannelDown': ev.preventDefault(); this.step(-1); break;
      case ' ': case 'MediaPlayPause': ev.preventDefault(); this.el.play.click(); break;
      case 'f': case 'F': this.toggleFullscreen(); break;
      case 'm': case 'M': this._toggleMute(); break;
      case 'p': case 'P': this.togglePip(); break;
      case 's': case 'S': this.toggleFavorite(this.view[this.focusIndex] || this.current); break;
      case 'n': case 'N': this.player.nextSource(); break;
      case 'r': case 'R': this.player.retry(); break;
      case '+': case '=': this._setVolume(Math.min(1, this.player.volume + 0.05)); break;
      case '-': this._setVolume(Math.max(0, this.player.volume - 0.05)); break;
      case '/': ev.preventDefault(); this.el.search.focus(); break;
      default: break;
    }
  }

  _playFocused() {
    const c = this.view[this.focusIndex];
    if (c) this.playChannel(c);
  }
}

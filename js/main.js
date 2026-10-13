/** Pika e hyrjes: lidh modulet (kanalet, shëndeti, lojtari, UI). */
import { loadIndex, loadCountry, sortChannels } from './channels.js';
import { favorites, history, storage } from './storage.js';
import { HealthMonitor } from './health.js';
import { Player } from './player.js';
import { UI } from './ui.js';
import { Epg } from './epg.js';
import { detectProxy, proxyState } from './network.js';
import { CONFIG } from './config.js';

async function boot() {
  const listEl = document.getElementById('channelList');
  listEl.innerHTML = '<li class="empty">Duke ngarkuar kanalet…</li>';

  let index;
  let channels = [];
  const loaded = new Set();
  try {
    index = await loadIndex();
    // fillimisht: Kosovë, Shqipëri, fqinjët + radio, plus shtetet e kanaleve të preferuara/historikut/të fundit
    const want = new Set(index.initial);
    const known = new Set(index.countries.map((c) => c.code));
    const chanCountry = storage.get('chanCountry', {});
    for (const id of [...favorites.all(), ...history.all(), storage.get('lastChannel', null)]) {
      if (id && known.has(chanCountry[id])) want.add(chanCountry[id]);
    }
    const lists = await Promise.all([...want].map((code) => loadCountry(code).then((l) => { loaded.add(code); return l; })));
    channels = sortChannels(lists.flat());
  } catch (e) {
    listEl.innerHTML = `<li class="empty">Nuk u ngarkuan kanalet: ${e.message}.<br>
      Nise: <code>node tools/build-channels.js</code></li>`;
    throw e;
  }

  const health = new HealthMonitor();
  const epg = new Epg();
  // Mos e blloko UI-n në rrjet të ngadaltë (telefon): prit maksimumi 3s, pastaj vazhdo me listën
  // dhe ri-aplikoj filtrat kur mbarojnë health/EPG/proxy.
  const background = Promise.all([health.init([...loaded]), detectProxy(), epg.load()]).catch(() => {});
  const finishedInTime = await Promise.race([
    background.then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), 3000)),
  ]);

  const player = new Player({
    video: document.getElementById('video'),
    audio: document.getElementById('audio'),
    health,
  });
  const catalog = { index, loaded, load: loadCountry };
  const ui = new UI({ channels, player, health, epg, catalog });

  player.addEventListener('state', (e) => ui.onPlayerState(e.detail));
  player.addEventListener('levels', (e) => ui.onLevels(e.detail));
  health.addEventListener('change', () => ui.refreshStatuses());

  ui.init();
  ui.refreshStatuses();
  if (!finishedInTime) background.then(() => { ui.applyFilters(); ui.refreshStatuses(); });

  // faqja shërbehet nga një server statik (p.sh. Live Server) pa /proxy: shumë burime do të bllokohen nga CORS
  if (!proxyState().mode && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    setTimeout(() => ui.toast('Nuk u gjet proxy: hape me `npm start` (http://localhost:3002) që të luajnë më shumë kanale.', 9000), 2500);
  }

  // test në sfond: Kosovë/Shqipëri, të preferuarat, historiku (burime të pa-testuara ose të vjetra)
  if (CONFIG.HEALTH_AUTO_PRIORITY) {
    const priority = channels.filter((c) => c.order <= 2).slice(0, 80);
    setTimeout(() => health.enqueue(priority), 1500);
  }

  // PWA
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // për korrigjim nga konsola
  window.miniIptv = { channels, player, health, ui };
}

boot().catch((e) => console.error('[Mini IPTV] Dështoi nisja:', e));

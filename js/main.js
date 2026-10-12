/** Pika e hyrjes: lidh modulet (kanalet, shëndeti, lojtari, UI). */
import { loadChannels } from './channels.js';
import { HealthMonitor } from './health.js';
import { Player } from './player.js';
import { UI } from './ui.js';
import { Epg } from './epg.js';
import { detectProxy } from './network.js';
import { CONFIG } from './config.js';

async function boot() {
  const listEl = document.getElementById('channelList');
  listEl.innerHTML = '<li class="empty">Duke ngarkuar kanalet…</li>';

  let channels;
  try {
    channels = await loadChannels();
  } catch (e) {
    listEl.innerHTML = `<li class="empty">Nuk u ngarkuan kanalet: ${e.message}.<br>
      Nise: <code>node tools/build-channels.js</code></li>`;
    throw e;
  }

  const health = new HealthMonitor();
  const epg = new Epg();
  const [, , epgOk] = await Promise.all([health.init(), detectProxy(), epg.load()]);
  void epgOk;

  const player = new Player({
    video: document.getElementById('video'),
    audio: document.getElementById('audio'),
    health,
  });
  const ui = new UI({ channels, player, health, epg });

  player.addEventListener('state', (e) => ui.onPlayerState(e.detail));
  player.addEventListener('levels', (e) => ui.onLevels(e.detail));
  health.addEventListener('change', () => ui.refreshStatuses());

  ui.init();
  ui.refreshStatuses();

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

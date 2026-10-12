/** Ngarkimi dhe kërkimi i kanaleve (data/channels.json). */
import { CONFIG } from './config.js';

const strip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export async function loadChannels() {
  const res = await fetch(CONFIG.CHANNELS_URL, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Nuk u ngarkua ${CONFIG.CHANNELS_URL} (HTTP ${res.status})`);
  const data = await res.json();
  const list = (data.channels || []).filter((c) => c && c.name && Array.isArray(c.sources) && c.sources.length);
  for (const c of list) c._search = strip(`${c.name} ${c.group || ''} ${c.country || ''}`);
  return list;
}

export function groupsOf(channels) {
  const counts = new Map();
  for (const c of channels) counts.set(c.group || 'General', (counts.get(c.group || 'General') || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

/**
 * Filtron sipas: tab ('all'|'tv'|'radio'|'favorites'|'history'), grupit, tekstit dhe
 * (opsionale) statusit të shëndetit.
 */
export function filterChannels(channels, { tab = 'all', group = '', query = '', favs = [], hist = [], hideOffline = false, statusOf = null }) {
  const q = strip(query.trim());
  const favSet = new Set(favs);
  let list = channels;
  if (tab === 'tv' || tab === 'radio') list = list.filter((c) => c.type === tab);
  else if (tab === 'favorites') list = list.filter((c) => favSet.has(c.id));
  else if (tab === 'history') {
    const byId = new Map(channels.map((c) => [c.id, c]));
    list = hist.map((id) => byId.get(id)).filter(Boolean);
  }
  if (group) list = list.filter((c) => (c.group || 'General') === group);
  if (q) list = list.filter((c) => c._search.includes(q));
  if (hideOffline && statusOf) list = list.filter((c) => statusOf(c) !== 'offline');
  return list;
}

/** Radhit kanalet offline në fund, pa prishur radhën e brendshme. */
export function offlineLast(list, statusOf) {
  const rank = (c) => (statusOf(c) === 'offline' ? 1 : 0);
  return list.map((c, i) => [c, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map((x) => x[0]);
}

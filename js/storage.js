/** Mbështjellës i sigurt për localStorage (mund të jetë i çaktivizuar), me TTL opsional. */
const PREFIX = 'miniiptv.';

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return fallback;
      const obj = JSON.parse(raw);
      if (obj && obj.__exp && Date.now() > obj.__exp) {
        localStorage.removeItem(PREFIX + key);
        return fallback;
      }
      return obj && Object.prototype.hasOwnProperty.call(obj, '__v') ? obj.__v : fallback;
    } catch {
      return fallback;
    }
  },

  set(key, value, ttlMs = 0) {
    try {
      const obj = { __v: value };
      if (ttlMs > 0) obj.__exp = Date.now() + ttlMs;
      localStorage.setItem(PREFIX + key, JSON.stringify(obj));
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    try { localStorage.removeItem(PREFIX + key); } catch { /* injoro */ }
  },
};

/** Të preferuarat dhe historiku (ruhen sipas id të kanalit). */
export const favorites = {
  _set: null,
  _load() {
    if (!this._set) this._set = new Set(storage.get('favorites', []));
    return this._set;
  },
  has(id) { return this._load().has(id); },
  toggle(id) {
    const s = this._load();
    if (s.has(id)) s.delete(id); else s.add(id);
    storage.set('favorites', [...s]);
    return s.has(id);
  },
  all() { return [...this._load()]; },
};

export const history = {
  MAX: 30,
  all() { return storage.get('history', []); },
  add(id) {
    const list = this.all().filter((x) => x !== id);
    list.unshift(id);
    storage.set('history', list.slice(0, this.MAX));
  },
  clear() { storage.remove('history'); },
};

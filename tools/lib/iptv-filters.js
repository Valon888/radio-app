/**
 * Parser M3U dhe filtrat e sigurisë/përmbajtjes që përdoren nga import-iptv-org.js dhe build-channels.js.
 * Asnjë URL me token/çelës/kredenciale, asnjë përmbajtje për të rritur, asnjë protokoll jo-http(s).
 */
'use strict';

/** Parametra query që tregojnë sekret/token/sesion (skadojnë ose janë kredenciale të ofruesit). */
const SECRET_PARAM = /(?:^|[?&;])(token|tkn|key|apikey|api_key|access_token|accesstoken|signature|sig|auth|authorization|wmsauthsign|hdnts|hdntl|__token__|password|passwd|pass|pwd|secret|session|sessionid|jwt|acl|exp|expires)=/i;
/** Token/sekret në rrugë (p.sh. /token=abc/). */
const SECRET_PATH = /\/(?:token|tkn|auth|authorization|password|secret)=/i;
const ADULT = /(?:\bxxx\b|\badult(?:s|o)?\b|\bporn(?:o|ography)?\b|\berotic[a-z]*\b|\bsex(?:y|tv|o)?\b|\bplayboy\b|\bpenthouse\b|\bhustler\b|\bbrazzers\b|\bdorcel\b|\bbabestation\b|\bred ?light\b|\bnsfw\b|\b18\s*\+|\+\s*18\b|\bhentai\b|\bfetish\b)/i;
const VIDEO_SITE = /(?:^|\.)(youtube\.com|youtu\.be|twitch\.tv|facebook\.com|fb\.watch|dailymotion\.com|vimeo\.com|rumble\.com)$/i;
const PRIVATE_HOST = /^(?:localhost|.*\.local|127\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.|0\.|\[?::1\]?$|\[?f[cd][0-9a-f]{2}:)/i;

/**
 * Segment rruge që duket si çelës/token i fshehtë: >= 32 shenja base64url me shkronja të mëdha, të vogla
 * dhe shifra (hex-i i pastër lejohet: është zakonisht ID publike e stream-it). Shërbimet me pagesë i fusin kredencialet në rrugë (/play/<çelës>).
 */
function looksSecretSegment(seg) {
  if (seg.length < 32 || !/^[A-Za-z0-9_-]+$/.test(seg)) return false;
  return /[a-z]/.test(seg) && /[A-Z]/.test(seg) && /[0-9]/.test(seg);
}

/** @returns {{url:string,error?:string}} */
function inspectUrl(raw) {
  const s = String(raw).trim();
  let u;
  try { u = new URL(s); } catch { return { url: s, error: 'url-invalid' }; }
  if (!/^https?:$/.test(u.protocol)) return { url: s, error: 'protocol' };
  if (u.username || u.password) return { url: s, error: 'credentials' };
  if (VIDEO_SITE.test(u.hostname)) return { url: s, error: 'video-site' };
  if (PRIVATE_HOST.test(u.hostname)) return { url: s, error: 'private-host' };
  if (SECRET_PARAM.test(u.search) || SECRET_PATH.test(decodeURIComponentSafe(u.pathname))) {
    return { url: s, error: 'secret-param' };
  }
  if (u.pathname.split('/').some(looksSecretSegment)) return { url: s, error: 'secret-path' };
  return { url: s };
}

function decodeURIComponentSafe(s) {
  try { return decodeURIComponent(s); } catch { return s; }
}

/** Përmbajtje për të rritur sipas emrit/id/grupit/kategorive/flamurit nsfw. */
function isAdult({ name = '', id = '', group = '', categories = [], nsfw = false } = {}) {
  if (nsfw) return true;
  if ((categories || []).some((c) => /^xxx$/i.test(c))) return true;
  return ADULT.test(`${name} ${id} ${group}`);
}

/**
 * Parson M3U në hyrje {name, id, logo, group, url, ref, ua}.
 * Lexon edhe #EXTVLCOPT:http-referrer / http-user-agent.
 */
function parseM3U(text) {
  const lines = String(text).split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('#EXTINF')) continue;
    const attr = (k) => (new RegExp(`${k}="([^"]*)"`, 'i').exec(line) || [])[1] || '';
    // emri = gjithçka pas presjes së parë jashtë thonjëzave (atributet mund të përmbajnë presje)
    const masked = line.replace(/"[^"]*"/g, (m) => m.replace(/,/g, '\u0001'));
    const name = line.slice(masked.indexOf(',') + 1).trim();
    let ref = '';
    let ua = '';
    let j = i + 1;
    while (j < lines.length && lines[j].startsWith('#')) {
      const o = /^#EXTVLCOPT:http-(referrer|user-agent)=(.*)$/i.exec(lines[j]);
      if (o) {
        if (/^referrer$/i.test(o[1])) ref = o[2].trim();
        else ua = o[2].trim();
      }
      j++;
    }
    const url = (lines[j] || '').trim();
    if (!name || !url) { i = j; continue; }
    out.push({ name, id: attr('tvg-id'), logo: attr('tvg-logo'), group: attr('group-title'), url, ref, ua });
    i = j;
  }
  return out;
}

/** Shkruan hyrjet përsëri si M3U (me #EXTVLCOPT). */
function toM3U(entries) {
  const out = ['#EXTM3U'];
  for (const e of entries) {
    const attrs = [`tvg-id="${e.id || ''}"`];
    if (e.logo) attrs.push(`tvg-logo="${e.logo}"`);
    if (e.group) attrs.push(`group-title="${e.group}"`);
    out.push(`#EXTINF:-1 ${attrs.join(' ')},${e.name}`);
    if (e.ref) out.push(`#EXTVLCOPT:http-referrer=${e.ref}`);
    if (e.ua) out.push(`#EXTVLCOPT:http-user-agent=${e.ua}`);
    out.push(e.url);
  }
  return `${out.join('\n')}\n`;
}

module.exports = { inspectUrl, isAdult, parseM3U, toM3U, SECRET_PARAM };

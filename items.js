/* ================== Mini IPTV + Radio (main.js) ================== */
/* -------- Helpers (duhet të jenë PARA përdorimit) -------- */
// Importo kanalet e reja nga M3U files (për browser)
// importedChannels duhet të jetë i disponueshëm në window.importedChannels

// Kthe [] nëse v s'është array
const safe = (v) => Array.isArray(v) ? v : [];

// URL që luhen nga <video>/<audio> pa integrime shtesë
const isPlayableUrl = (u = "") =>
  /^https?:\/\/.+\.(m3u8|mp3|aac)($|\?)/i.test(u) ||
  /\/(master|index|playlist)\.m3u8(\?|$)/i.test(u);

// Heq dublikatat sipas id (ruan të parën)
function byIdFirstWins(arr) {
  const seen = new Set();
  return (Array.isArray(arr) ? arr : []).filter(it => {
    if (!it || !it.id) return false;
    if (seen.has(it.id)) return false;
    seen.add(it.id);
    return true;
  });
}

// Funksion për të lexuar dhe analizuar M3U file (për browser)
async function parseM3UFile(filePath) {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      console.warn(`Nuk mund të lexohet ${filePath}: ${response.status}`);
      return [];
    }
    const content = await response.text();
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    const channels = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXTINF')) {
        const nameMatch = line.match(/,(.+)$/);
        const tvgIdMatch = line.match(/tvg-id="([^"]+)"/);
        const logoMatch = line.match(/tvg-logo="([^"]+)"/);
        const groupMatch = line.match(/group-title="([^"]+)"/);
        const qualityMatch = line.match(/\((\d+p)\)/);

        if (nameMatch && i + 1 < lines.length) {
          const url = lines[i + 1].trim();
          if (url && !url.startsWith('#')) {
            const channel = {
              id: tvgIdMatch ? tvgIdMatch[1] : `m3u_${channels.length}_${Date.now()}`,
              name: nameMatch[1].trim(),
              url: url,
              type: 'tv',
              group: groupMatch ? groupMatch[1] : 'General',
              logo: logoMatch ? logoMatch[1] : '',
              quality: qualityMatch ? qualityMatch[1] : ''
            };
            channels.push(channel);
          }
        }
      }
    }
    return channels;
  } catch (error) {
    console.warn(`Gabim në leximin e ${filePath}:`, error.message);
    return [];
  }
}

// (Opsionale) Proxy për Mixed-Content kur hoston në HTTPS (p.sh. GitHub Pages)
const PROXY_HOST = ""; // p.sh. "https://stream-proxy.example.com"
const onHTTPS = typeof location !== "undefined" && location.protocol === "https:";
const needsProxy = () => onHTTPS && !!PROXY_HOST;
const viaProxy = (u) => `${PROXY_HOST}/proxy?url=${encodeURIComponent(u)}`;
const normalizeUrlForContext = (u) => {
  if (!u) return u;
  if (/^http:\/\//i.test(u) && needsProxy()) return viaProxy(u);
  return u;
};

// Switch për përfshirjen e kanaleve +18
const ENABLE_ADULT = false;

/* ------------------ Playlists tua (si i ke) ------------------ */

// Kanale X1, X2, X3 + 18 adult
const adultChannels = [
  { id: 'x3', name: 'X3 Adult', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', type: 'tv', group: 'Adult', logo: '', quality: '1080p' },
  { id: '18plus', name: '18+ Adult', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', type: 'tv', group: 'Adult', logo: '', quality: '1080p' }
];

// --- Shqipëri
const albanianChannels = [
  // Kanale të përgjithshme dhe lajme
  { id: "news24", name: "News 24", url: "https://tv.balkanweb.com/news24/livestream/playlist.m3u8", type: "tv", group: "Shqipëri", logo: "https://i.imgur.com/eG33jue.png", quality: "720p" },
  { id: "oranews", name: "Ora News", url: "https://live1.mediadesk.al/oranews.m3u8", type: "tv", group: "Shqipëri", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Ora_News_%28Albania%29.svg/512px-Ora_News_%28Albania%29.svg.png", quality: "1080p" },
  { id: "panoramatv", name: "Panorama TV", url: "https://159.69.221.56/panorama/livestream/playlist.m3u8", type: "tv", group: "Shqipëri", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Panorama_logo.svg/512px-Panorama_logo.svg.png", quality: "1080p" },
  { id: "mcntv", name: "MCN TV", url: "https://mcn24.tv/hidden_stream/mcntv.m3u8", type: "tv", group: "Shqipëri", logo: "https://i.imgur.com/bcAMVVk.png", quality: "1080p" },
  { id: "vizionplus", name: "Zjarr TV", url: "https://zjarr.future.al/hls/playlist.m3u8", type: "tv", group: "Shqipëri", logo: "https://i.imgur.com/hNuWZWe.png", quality: "720p" },
  { id: "a2cnn", name: "A2 CNN Albania", url: "https://tv.a2news.com/live/smil:a2cnnweb.stream.smil/playlist.m3u8", type: "tv", group: "Shqipëri", logo: "https://i.imgur.com/TgO3Lzi.png", quality: "720p" },
  { id: "syritv", name: "Syri TV (Shqipëri)", url: "https://stream.syritv.al/live/syritv/playlist.m3u8", type: "tv", group: "Shqipëri", logo: "https://i.imgur.com/4zVyj1M.png", quality: "720p" },
  { id: "tropojatv", name: "Tropoja Televizion", url: "https://live.prostream.al/al/smil:tropojatv.smil/playlist.m3u8", type: "tv", group: "Shqipëri", logo: "https://i.imgur.com/D3hNOVS.png", quality: "720p" },
  { id: "tv7albania", name: "TV 7 Albania", url: "https://rpn3.bozztv.com/albaniatv/Med7-TV7Tirana/index.m3u8", type: "tv", group: "Shqipëri", logo: "https://i.imgur.com/k9WqPLZ.png", quality: "720p" },
  { id: "tvapollon", name: "TV Apollon", url: "https://live.apollon.tv/Apollon-Web/video.m3u8?token=tnt9u76reF0d1", type: "tv", group: "Shqipëri", logo: "https://i.imgur.com/gUz2AjM.png", quality: "720p" },
  { id: "albkanalemusic", name: "AlbKanale Music TV", url: "https://albportal.net/albkanalemusic.m3u8", type: "tv", group: "Shqipëri-Muzikë", logo: "https://i.imgur.com/JdKxscs.png", quality: "720p" },
  { id: "cnaalbania", name: "CNA", url: "https://live1.mediadesk.al/cnatvlive.m3u8", type: "tv", group: "Shqipëri", logo: "https://codeit.al/wp-content/uploads/2020/08/cna.png", quality: "720p" },
  { id: "vizionplus_tv", name: "Vizion Plus", url: "https://tringliveviz.akamaized.net/delta/105/out/u/qwaszxerdfcvrtryuy.m3u8", type: "tv", group: "Shqipëri", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Vizion_Plus.svg/512px-Vizion_Plus.svg.png", quality: "1080p" },
];

// Kanale muzikore
// --- TV Channels from al.m3u (Albania, tested) ---
const albaniaTvChannels = [
  { id: "AlbKanaleMusicTV.al@SD", name: "AlbKanale Music TV (720p)", url: "https://albportal.net/albkanalemusic.m3u8", type: "tv", group: "Shqipëri", logo: "", quality: "720p", signal: "perfect" },
  { id: "CNA.al@SD", name: "CNA (1080p)", url: "https://live1.mediadesk.al/cnatvlive.m3u8", type: "tv", group: "Shqipëri", logo: "", quality: "1080p", signal: "perfect" },
  { id: "MCNTV.al@SD", name: "MCN TV (720p)", url: "https://mcn24.tv/hidden_stream/mcntv.m3u8", type: "tv", group: "Shqipëri", logo: "", quality: "720p", signal: "perfect" },
  { id: "News24.al@SD", name: "News 24 (392p)", url: "https://tv.balkanweb.com/news24/livestream/playlist.m3u8", type: "tv", group: "Shqipëri", logo: "", quality: "392p", signal: "perfect" },
  { id: "News24.al@SD_2", name: "News 24 Albania (392p)", url: "http://tv.balkanweb.com:8081/news24/livestream/playlist.m3u8", type: "tv", group: "Shqipëri", logo: "", quality: "392p", signal: "perfect" },
  { id: "OraNews.al@SD", name: "Ora News (720p)", url: "https://live1.mediadesk.al/oranews.m3u8", type: "tv", group: "Shqipëri", logo: "", quality: "720p", signal: "perfect" },
  { id: "PanoramaTV.al@SD", name: "Panorama TV (720p)", url: "https://159.69.221.56/panorama/livestream/playlist.m3u8", type: "tv", group: "Shqipëri", logo: "", quality: "720p", signal: "perfect" },
  { id: "VizionPlus.al@HD", name: "Vizion Plus (HD)", url: "https://tringliveviz.akamaized.net/delta/105/out/u/qwaszxerdfcvrtryuy.m3u8", type: "tv", group: "General", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Vizion_Plus.svg/512px-Vizion_Plus.svg.png", quality: "HD", signal: "perfect" },
  { id: "ZjarrTV.al@SD", name: "Zjarr TV (360p)", url: "https://zjarr.future.al/hls/playlist.m3u8", type: "tv", group: "Shqipëri", logo: "", quality: "360p", signal: "perfect" },
  { id: "RTSHShqip.al@SD", name: "RTSH Shqip (1080p)", url: "http://178.33.11.6:8696/live/rtshshqip/playlist.m3u8", type: "tv", group: "Shqipëri", logo: "", quality: "1080p", signal: "perfect" },
  { id: "RTSHSport.al@SD", name: "RTSH Sport (1080p)", url: "http://178.33.11.6:8696/live/rtshsport/playlist.m3u8", type: "tv", group: "Shqipëri", logo: "", quality: "1080p", signal: "perfect" },
  { id: "RTSH24.al@SD", name: "RTSH 24 (1080p)", url: "http://178.33.11.6:8696/live/rtsh24/playlist.m3u8", type: "tv", group: "Shqipëri", logo: "", quality: "1080p", signal: "perfect" },
  { id: "RTSH2.al@SD", name: "RTSH 2 (1080p)", url: "http://178.33.11.6:8696/live/rtsh2/playlist.m3u8", type: "tv", group: "Shqipëri", logo: "", quality: "1080p", signal: "perfect" },
  { id: "RTSH1.al@SD", name: "RTSH 1 (1080p)", url: "http://178.33.11.6:8696/live/rtsh1ott/playlist.m3u8", type: "tv", group: "Shqipëri", logo: "", quality: "1080p", signal: "perfect" },
];
// Shto në listën kryesore të kanaleve TV
if (typeof allTvChannels !== 'undefined') {
  allTvChannels = [...allTvChannels, ...albaniaTvChannels];
}

// --- Shqipëri (kanale të reja dhe të përditësuara)
const newAlbanianChannels = [
  // Kanale të përgjithshme dhe lajme
  // Kanale me URL që fillojnë me 'http://185.226.88.6:11026/' janë hequr për shkak të gabimeve të lidhjes
  { id: "cna", name: "CNA", url: "https://live1.mediadesk.al/cnatvlive.m3u8", type: "tv", group: "Shqipëri", logo: "https://codeit.al/wp-content/uploads/2020/08/cna.png", quality: "1080p" },
  { id: "news24", name: "News 24", url: "https://tv.balkanweb.com/news24/livestream/playlist.m3u8", type: "tv", group: "Shqipëri", logo: "https://i.imgur.com/eG33jue.png", quality: "720p" },
  { id: "oranews", name: "Ora News", url: "https://live1.mediadesk.al/oranews.m3u8", type: "tv", group: "Shqipëri", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Ora_News_%28Albania%29.svg/512px-Ora_News_%28Albania%29.svg.png", quality: "1080p" },
  { id: "panoramatv", name: "Panorama TV", url: "https://159.69.221.56/panorama/livestream/playlist.m3u8", type: "tv", group: "Shqipëri", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Panorama_logo.svg/512px-Panorama_logo.svg.png", quality: "1080p" },
  { id: "mcntv", name: "MCN TV", url: "https://mcn24.tv/hidden_stream/mcntv.m3u8", type: "tv", group: "Shqipëri", logo: "https://i.imgur.com/bcAMVVk.png", quality: "1080p" },
  { id: "vizionplus", name: "Zjarr TV", url: "https://zjarr.future.al/hls/playlist.m3u8", type: "tv", group: "Shqipëri", logo: "https://i.imgur.com/hNuWZWe.png", quality: "720p" },
];

// --- Shqipëri (kanale të reja dhe të përditësuara)
// (Duplicate declaration removed. See previous definition of newAlbanianChannels above.)
const tringAlbaniaChannels = [
  // Kanalet sportive
  // Kanalet me URL që fillojnë me 'http://185.226.88.6:11026/' janë hequr për shkak të gabimeve të lidhjes
  // ...empty...
  // Kanalet e filmave
  // ...empty...
  // Kanalet per fëmijë
  // ...empty...
  // Kanalet e argëtimit
  // ...empty...
];

// --- Kanalet GEM TV (kanale për argëtim dhe filma)
const gemTVChannels = [
];

// --- Kosovë
const kosovoChannels = [
  // Kanale nga xk.m3u (shtuar në fillim të listës)
  { id: "kohavision", name: "Kohavision", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-livestream/lj9-pxm-o53-rp0/tracks-v4a1/mono.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/LOi9yma.png", quality: "1080p", signal: "perfect" },
  { id: "rtk2", name: "RTK 2", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-livestream/rtk2/index.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/g6k6xyO.png", quality: "1080p", signal: "perfect" },
  { id: "rtk3", name: "RTK 3", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-livestream/rtk3/index.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/Ut9VcT3.png", quality: "1080p", signal: "perfect" },
  { id: "rtv21", name: "RTV21", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-live/2cz-npl-jfn-9he/tracks-v2a1/mono.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/AqQltGh.png", quality: "1080p", signal: "perfect" },
  { id: "t7", name: "T7", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-livestream-specific/1z8-byc-4ee-lc9/index.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/b7FvSJj.png", quality: "1080p", signal: "perfect" },
  { id: "tvarta", name: "TV Arta", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-live/mps-vgx-u9p-qv1/index.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/MAhJkK9.png", quality: "1080p", signal: "perfect" },
  { id: "tvdielli", name: "TV Dielli", url: "http://stream.tvdielli.com:8081/dielli/index.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/kLl3ar5.png", quality: "1080p", signal: "perfect" },
  { id: "tvopoja", name: "TV Opoja", url: "http://ip.opoja.tv:1935/tvopoja/tvopoja/playlist.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/hxi4Qiq.png", quality: "1080p", signal: "perfect" },
  { id: "tvprizreni", name: "TV Prizreni", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-live/5m0-cok-g5z-1xi/index.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/hvtJwOO.png", quality: "1080p", signal: "perfect" },
  { id: "tvsyri", name: "TV Syri", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-live/xej-xnb-ba0-kup/index.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/ZQuFosn.png", quality: "1080p", signal: "perfect" }
];

// --- Radio channels placeholder (will be populated from window.radioChannels)
// Avoid redeclaring radioChannels since it's already defined in radio-channels.js
let internalRadioChannels = [];

// --- Arab, Georgia, Italy (nga M3U files) ---
let arabChannels = [];
let georgiaChannels = [];
let italyChannels = [];

// --- Shembulli i përzier (DE/TR etj.)
let channels = [];

// --- Lista "turkishChannels" → normalizuar
// Don't redeclare turkishChannels as it's already declared in turkish-channels.js
// Instead, we'll use turkishChannelsInternal to avoid conflicts
let turkishChannelsInternal = [];
// turkishChannelsFixed will be populated from window.turkishChannels which is defined in turkish-channels.js
let turkishChannelsFixed = [];

// --- Pluto TV Germany (shembujt e tu)
let plutoGermanyChannels = [];

// --- Albania playlist
let playlistAlbaniaChannels = [];

// --- Deklarime bosh për lista të përmendura diku tjetër (garantuar gjithmonë array)
let religiousChannels = [];
let sloveniaChannels = [];
let southAfricaChannels = [];
let internationalKidsChannels = [];
let germanyChannels = [];
let usChannels = [];
let ukChannels = [];

// Funksion për të ngarkuar të gjitha kanalet duke përdorur playlist-loader
async function loadAllChannels() {
  try {
    console.log('[Mini IPTV] Duke ngarkuar kanalet nga të gjitha M3U files...');
    
    // Kontrollo nëse playlist-loader është i gatshëm
    if (typeof window.playlistLoader === 'undefined') {
      console.warn('[Mini IPTV] playlist-loader nuk është i disponueshëm. Duke përdorur metodën fallback.');
      
      // Funksion helper për të ngarkuar një file dhe emëruar rezultatin
      const loadChannels = async (fileName, logName = fileName) => {
        try {
          return await parseM3UFile(fileName);
        } catch (e) {
          console.warn(`Gabim në ngarkimin e ${logName}:`, e);
          return [];
        }
      };
      
      // Ngarko kanalet nga M3U files me metodën fallback
      arabChannels = await loadChannels('./arab.m3u');
      georgiaChannels = await loadChannels('./ge.m3u');
      italyChannels = await loadChannels('./it.m3u');

      // Ngarko listat e tjera me metodën fallback
      const deChannels = await loadChannels('./de.m3u');
      const ukChannelsData = await loadChannels('./uk.m3u');
      ukChannels = [...ukChannelsData];
      
      // Mbush channels me disa kanale bazike
      // Shto kanalet radio arabe nga Arabia Saudite në fillim të listës së radios
      const saudiRadios = safe(externalRadioChannels).filter(ch => ch.type === 'radio' && ch.group && ch.group.toLowerCase().includes('arabia saudite'));
      const allRaw = [].concat(
        saudiRadios,
        // Kanalet prioritare sipas kërkesës
        safe(kosovoChannels),     // 1. Kosovë
        safe(albanianChannels),   // 2. Shqipëri
        safe(tringAlbaniaChannels), // 3. Tring TV Albania (shtuar rishtazi)
        safe(typeof turkishKidsChannels !== "undefined" ? turkishKidsChannels : []), // 4. Kanale turke për fëmijë
        safe(typeof turkishMainChannels !== "undefined" ? turkishMainChannels : []), // 5. Kanale kryesore turke
        safe(turkishChannelsFixed), // 6. Të gjitha kanalet turke (259 kanale)
        safe(gemTVChannels),      // 7. Kanale GEM TV
        safe(germanyChannels),    // 8. Gjermani
        safe(usChannels),         // 9. Amerikë
        safe(ukChannels),         // 10. Angli
        // Kanalet e reja të importuara (us_canelatv, us_cineversetv, us_xumo, us_plex, tt, hr)
        safe(window.importedChannels || []),
  // Kanalet e radios përfshirë Arabia Saudite
  safe(externalRadioChannels),
        // Të gjitha kanalet e tjera nga file-t M3U
        safe(channels),
        // Kanalet specifike për vende
        safe(arabChannels),
        safe(georgiaChannels),
        safe(italyChannels),    
        safe(plutoGermanyChannels),
        safe(religiousChannels),
        safe(sloveniaChannels),
        safe(southAfricaChannels),
        safe(internationalKidsChannels),
        safe(playlistAlbaniaChannels),
        // Kanalet për adult (nëse janë të aktivizuara)
        ENABLE_ADULT ? safe(adultChannels) : []
      );
      usChannels = allChannels.filter(ch => ch.group && (ch.group.includes('USA') || ch.source.includes('us.m3u')));
      turkishChannelsInternal = allChannels.filter(ch => ch.group && (ch.group.includes('Türkiye') || ch.group.includes('Turqi') || ch.source.includes('tr.m3u') || ch.source.includes('tur.m3u')));
      
      // Për kompatiblitet me kodin ekzistues
      turkishChannelsFixed = turkishChannels;
      plutoGermanyChannels = allChannels.filter(ch => ch.group && ch.group.includes('Pluto TV'));
      playlistAlbaniaChannels = allChannels.filter(ch => ch.group && (ch.group.includes('Shqipëri') || ch.source.includes('playlist_albania.m3u8')));
      religiousChannels = allChannels.filter(ch => ch.group && (ch.group.includes('Fetare') || ch.source.includes('religious.m3u')));
      sloveniaChannels = allChannels.filter(ch => ch.group && (ch.group.includes('Slovenia') || ch.source.includes('si_xploretv.m3u')));
      southAfricaChannels = allChannels.filter(ch => ch.group && (ch.group.includes('South Africa') || ch.source.includes('za_freevisiontv.m3u')));
      internationalKidsChannels = allChannels.filter(ch => ch.group && ch.group.includes('Fëmijë'));
      
      // Rivendos statusin pas ngarkimit
      if (statusEl) {
        statusEl.textContent = `Ngarkuar me sukses ${allChannels.length} kanale nga ${window.playlistLoader.playlistFiles.length} lista.`;
      }
      
      console.log('[Mini IPTV] Kanale të ngarkuara me playlist-loader:', channels.length);
    }
  } catch (error) {
    console.error('[Mini IPTV] Gabim në ngarkimin e kanaleve:', error);
    // Përdor kanalet e hardkoduar në rast dështimi
    channels = safe(albanianChannels)
      .concat(safe(kosovoChannels))
      .concat(safe(typeof turkishKidsChannels !== "undefined" ? turkishKidsChannels : []))
      .concat(safe(typeof turkishMainChannels !== "undefined" ? turkishMainChannels : []));
    
    console.log('[Mini IPTV] Duke përdorur kanalet hardcoded pas dështimit:', channels.length);
  }
}

/* ------------------ Agregimi profesional ------------------ */
// Funksion async për të përgatitur kanalet
async function prepareChannels() {
  // Ngarko të gjitha kanalet nga M3U files
  await loadAllChannels();

  // Get radio channels from window.radioChannels if available
  const externalRadioChannels = typeof window.radioChannels !== 'undefined' && Array.isArray(window.radioChannels) ? 
    window.radioChannels : internalRadioChannels;
  
  console.log('[Mini IPTV] Radio channels loaded:', externalRadioChannels.length);

  // Get Turkish channels from window.turkishChannels if available
  turkishChannelsFixed = typeof window.turkishChannels !== 'undefined' && Array.isArray(window.turkishChannels) ? 
    window.turkishChannels : [];
  
  console.log('[Mini IPTV] Turkish channels loaded:', turkishChannelsFixed.length);

  // Bashko të gjitha listat në një array të vetme
  const allRaw = [].concat(
    // Kanalet prioritare sipas kërkesës
    safe(kosovoChannels),     // 1. Kosovë
    safe(albanianChannels),   // 2. Shqipëri
    safe(tringAlbaniaChannels), // 3. Tring TV Albania (shtuar rishtazi)
    safe(typeof turkishKidsChannels !== "undefined" ? turkishKidsChannels : []), // 4. Kanale turke për fëmijë
    safe(typeof turkishMainChannels !== "undefined" ? turkishMainChannels : []), // 5. Kanale kryesore turke
    safe(turkishChannelsFixed), // 6. Të gjitha kanalet turke (259 kanale)
    safe(gemTVChannels),      // 7. Kanale GEM TV
    safe(germanyChannels),    // 8. Gjermani
    safe(usChannels),         // 9. Amerikë
    safe(ukChannels),         // 10. Angli
    
    // Kanalet e reja të importuara (us_canelatv, us_cineversetv, us_xumo, us_plex, tt, hr)
    safe(window.importedChannels || []),
    
    // Kanalet e radios
    safe(externalRadioChannels),
    
    // Të gjitha kanalet e tjera nga file-t M3U
    safe(channels),
    
    // Kanalet specifike për vende
    safe(arabChannels),
    safe(georgiaChannels),
    safe(italyChannels),    
    safe(plutoGermanyChannels),
    safe(religiousChannels),
    safe(sloveniaChannels),
    safe(southAfricaChannels),
    safe(internationalKidsChannels),
    safe(playlistAlbaniaChannels),
    
    // Kanalet për adult (nëse janë të aktivizuara)
    ENABLE_ADULT ? safe(adultChannels) : []
  );

  // Shfaq numrin total të kanaleve të papërpunuara
  console.log('[Mini IPTV] Numri total i kanaleve të papërpunuara:', allRaw.length);

  // Filtrim, normalizim, deduplikim dhe fallback
  const playable = allRaw
    .filter(it => it && typeof it.url === 'string' && it.url.startsWith('http') && isPlayableUrl(it.url))
    .map(it => {
      // Force group and signal for Islamic radio channels
      if (it.type === 'radio' && (
        (it.group && it.group.toLowerCase().includes('islamic')) ||
        (it.name && it.name.toLowerCase().includes('quran'))
      )) {
        return {
          id: it.id,
          name: it.name || it.title || "Channel",
          url: normalizeUrlForContext(it.url),
          type: 'radio',
          group: 'Islamic',
          logo: it.logo || '',
          quality: it.quality || '',
          signal: 'perfect'
        };
      }
      return {
        id: it.id,
        name: it.name || it.title || "Channel",
        url: normalizeUrlForContext(it.url),
        type: it.type || 'tv',
        group: it.group || 'General',
        logo: it.logo || '',
        quality: it.quality || ''
      };
    });
    
  console.log('[Mini IPTV] Kanalet e luajtshme:', playable.length);

  // Ndaj kanalet sipas llojit
  const tvChannels = playable.filter(ch => ch.type === 'tv' || !ch.type);
  const radioChannels = playable.filter(ch => ch.type === 'radio');
  
  console.log('[Mini IPTV] Kanale TV:', tvChannels.length);
  console.log('[Mini IPTV] Kanale Radio:', radioChannels.length);

  // Hiq dublikatat sipas id
  let items = byIdFirstWins(playable);
  console.log('[Mini IPTV] Pas heqjes së dublikatave:', items.length);

  // Funksion ndihmës për të përcaktuar prioritetin e grupeve
  const groupPriority = (group) => {
    const groupLower = (group || "").toLowerCase();
    if (groupLower.includes('kosovë')) return 1;
    if (groupLower.includes('shqip') || groupLower === 'albania') return 2;
    if (groupLower.includes('tring shqipëri')) return 3; // Kanalet e përgjithshme Tring Albania
    if (groupLower.includes('tring sport')) return 4; // Kanalet sportive Tring
    if (groupLower.includes('tring filma')) return 5; // Kanalet e filmave Tring
    if (groupLower.includes('tring fëmijë')) return 6; // Kanalet e fëmijëve Tring
    if (groupLower.includes('tring dokumentarë') || groupLower.includes('tring lifestyle')) return 7; // Kanalet dokumentare dhe lifestyle Tring
    if (groupLower.includes('fëmijë') || groupLower.includes('femije')) return 8; // Prioritet për kanalet e fëmijëve të tjera
    if (groupLower.includes('türk çocuk') || groupLower.includes('gem tv fëmijë')) return 9; // Kanalet turke për fëmijë
    // Improved Turkish channel matching
    if (groupLower.includes('türkiye') || groupLower.includes('turqi') || 
        groupLower.includes('turkish') || groupLower.includes('türk')) return 10; // Kanalet kryesore turke
    if (groupLower.includes('gem tv')) return 11; // Kanalet GEM TV
    if (groupLower.includes('gjerman') || groupLower === 'germany' || groupLower === 'german') return 12;
    if (groupLower.includes('amerik') || groupLower === 'us' || groupLower === 'usa') return 13;
    if (groupLower.includes('angli') || groupLower === 'uk' || groupLower === 'england') return 14;
    return 100; // Të tjera
  };

  // Rendit sipas prioritetit të grupit, pastaj sipas tipave specifike brenda grupit, pastaj emrit
  items = items.sort((a, b) => {
    const priorityA = groupPriority(a.group);
    const priorityB = groupPriority(b.group);
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB; // Rendit sipas prioritetit të grupit
    }
    
    // Prioritizim special për kanale të caktuara me ID specifike
    const specialIds = ["cufo", "bangbang", "juniortv"];
    const isSpecialA = specialIds.indexOf(a.id);
    const isSpecialB = specialIds.indexOf(b.id);
    
    // Nëse njëri nga kanalet është special dhe tjetri jo, prioritizo specialin
    if (isSpecialA !== -1 && isSpecialB === -1) return -1;
    if (isSpecialA === -1 && isSpecialB !== -1) return 1;
    
    // Nëse të dy janë speciale, rradhit sipas indeksit në listën e specialeve
    if (isSpecialA !== -1 && isSpecialB !== -1) {
      return isSpecialA - isSpecialB;
    }
    
    // Nëse janë në të njëjtin grup dhe nuk janë speciale, rendit sipas emrit
    return (a.name || "").localeCompare(b.name || "");
  });

  // Fallback: nëse nuk ka asnjë kanal, shto një kanal testues
  if (!Array.isArray(items) || items.length === 0) {
    items = [{
      id: 'test-channel',
      name: 'Test Channel',
      url: normalizeUrlForContext('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'),
      type: 'tv',
      group: 'Test',
      logo: '',
      quality: '720p'
    }];
    console.warn('[Mini IPTV] S\'ka kanale të luajtshme – u shtua kanal testues.');
  }

  // Vendos në window për përdorim nga UI
  window.items = items;
  console.log('[Mini IPTV] Loaded:', window.items.length);
  if (needsProxy()) console.log('[Mini IPTV] HTTP→HTTPS proxy:', PROXY_HOST);
}

// Thirr funksionin për të përgatitur kanalet
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Mini IPTV] Duke inicializuar kanalin...');
  
  // Përdor kanalet hardcoded nëse janë të disponueshme, përndryshe përdor një kanal testues
  let initialChannels = [];
  
  // Add fallback TV channels
  if (typeof window.hardcodedChannels !== 'undefined' && Array.isArray(window.hardcodedChannels)) {
    console.log('[Mini IPTV] Duke përdorur kanalet hardcoded nga fallback-channels.js:', window.hardcodedChannels.length);
    initialChannels = [...window.hardcodedChannels];
  } else {
    console.log('[Mini IPTV] Duke përdorur kanalin e paracaktuar testues');
    initialChannels = [{
      id: 'test-channel',
      name: 'Test Channel',
      url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      type: 'tv',
      group: 'Test',
      logo: '',
      quality: '720p'
    }];
  }
  
  // Add radio channels if available
  if (typeof window.radioChannels !== 'undefined' && Array.isArray(window.radioChannels)) {
    console.log('[Mini IPTV] Duke shtuar kanalet e radios:', window.radioChannels.length);
    initialChannels = [...initialChannels, ...window.radioChannels];
    console.log('[Mini IPTV] Total channels after adding radio:', initialChannels.length);
  } else {
    console.warn('[Mini IPTV] Radio channels not found! Make sure radio-channels.js is loaded before items.js');
  }
  
  // Set the initial channels
  window.items = initialChannels;
  
  console.log('[Mini IPTV] Duke ngarkuar të gjitha kanalet nga të gjitha burimet...');
  prepareChannels()
    .then(() => {
      // Verify we have both TV and radio channels
      const tvCount = window.items.filter(item => item.type === 'tv' || !item.type).length;
      const radioCount = window.items.filter(item => item.type === 'radio').length;
      
      console.log('[Mini IPTV] Kanalet u ngarkuan me sukses!');
      console.log(`[Mini IPTV] Përmbledhje: ${window.items.length} kanale totale (${tvCount} TV, ${radioCount} radio)`);
      
      // List a sample of the loaded groups for verification
      const groups = new Set(window.items.map(item => item.group).filter(Boolean));
      console.log('[Mini IPTV] Grupet e ngarkuara:', Array.from(groups).slice(0, 20).join(', ') + (groups.size > 20 ? '...' : ''));
      
      // Trigger the event to update the UI
      window.dispatchEvent(new CustomEvent('channels-ready'));
    })
    .catch(error => {
      console.error('[Mini IPTV] Gabim në përgatitjen e kanaleve:', error);
      
      // Siguro që kemi të paktën një kanal testues
      if (!Array.isArray(window.items) || window.items.length === 0) {
        window.items = [{
          id: 'test-channel',
          name: 'Test Channel (Fallback)',
          url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          type: 'tv',
          group: 'Test',
          logo: '',
          quality: '720p'
        }];
      }
      
      // Njoftoje UI që kanalet janë gati (edhe nëse kemi vetëm një kanal testues)
      window.dispatchEvent(new CustomEvent('channels-ready'));
    });
});

/* ================== /main.js ================== */

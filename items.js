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
  { id: 'x1', name: 'X1 Adult', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', type: 'tv', group: 'Adult', logo: '', quality: '1080p' },
  { id: 'x2', name: 'X2 Adult', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', type: 'tv', group: 'Adult', logo: '', quality: '1080p' },
  { id: 'x3', name: 'X3 Adult', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', type: 'tv', group: 'Adult', logo: '', quality: '1080p' },
  { id: '18plus', name: '18+ Adult', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', type: 'tv', group: 'Adult', logo: '', quality: '1080p' }
];

// --- Shqipëri
const albanianChannels = [
  // Kanale të përgjithshme dhe lajme
  { id: "topchannel", name: "Top Channel", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/106.ts", type: "tv", group: "Shqipëri", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Top_Channel_logo.svg/512px-Top_Channel_logo.svg.png", quality: "720p", description: "Televizioni i parë privat në Shqipëri" },
  { id: "atv", name: "ATV", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/101.ts", type: "tv", group: "Shqipëri", logo: "https://atvkosova.com/wp-content/uploads/2022/07/logo1.png", quality: "720p", description: "Televizion privat shqiptar" },
  { id: "filmaksion", name: "Film Aksion", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/133.ts", type: "tv", group: "Filma Shqip", logo: "https://yt3.googleusercontent.com/ytc/APkrFKaaZZ1dZKwv-PKgvuYM0SZVQzKCvmFOA9vQQmIQ=s900-c-k-c0x00ffffff-no-rj", quality: "720p", description: "Filma aksion me përkthim shqip" },
  { id: "cna", name: "CNA", url: "https://live1.mediadesk.al/cnatvlive.m3u8", type: "tv", group: "Shqipëri", logo: "https://codeit.al/wp-content/uploads/2020/08/cna.png", quality: "1080p" },
  { id: "euronewsalbania", name: "Euronews Albania", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-live/2dw-zuf-1c9-pxu/index.m3u8", type: "tv", group: "Shqipëri", logo: "https://i.imgur.com/Skf6vdi.png", quality: "1080p" },
  { id: "news24", name: "News 24", url: "https://tv.balkanweb.com/news24/livestream/playlist.m3u8", type: "tv", group: "Shqipëri", logo: "https://i.imgur.com/eG33jue.png", quality: "720p" },
  { id: "oranews", name: "Ora News", url: "https://live1.mediadesk.al/oranews.m3u8", type: "tv", group: "Shqipëri", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Ora_News_%28Albania%29.svg/512px-Ora_News_%28Albania%29.svg.png", quality: "1080p" },
  { id: "panoramatv", name: "Panorama TV", url: "https://tv.panorama.com.al/panorama/livestream/playlist.m3u8", type: "tv", group: "Shqipëri", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Panorama_logo.svg/512px-Panorama_logo.svg.png", quality: "1080p" },
  { id: "reporttv", name: "Report TV", url: "https://deb10stream.duckdns.org/hls/stream.m3u8", type: "tv", group: "Shqipëri", logo: "https://i.imgur.com/C9lM1KP.png", quality: "1080p" },
  { id: "mcntv", name: "MCN TV", url: "https://mcn24.tv/hidden_stream/mcntv.m3u8", type: "tv", group: "Shqipëri", logo: "https://i.imgur.com/bcAMVVk.png", quality: "1080p" },
  { id: "vizionplus", name: "Zjarr TV", url: "https://zjarr.future.al/hls/playlist.m3u8", type: "tv", group: "Shqipëri", logo: "https://i.imgur.com/hNuWZWe.png", quality: "720p" },
  
  // Kanale për fëmijë (prioritet i lartë me URL të përditësuara)
  { id: "cufo", name: "CUFO TV HD", url: "https://digitalb-live.morescreens.com/DAL_1_005/playlist.m3u8?id=DAL_1_005&video_id=12498&token=142cda7d50870275a9ca7988ff001b32ab30709b&authority_instance_id=spectar-prd-digitalb&profile_id=1&application_installation_id=1&uuid=backoffice1&subscriber_id=1&application_id=backoffice1&detected_delivery_method=hls&playlist_template=nginx&ps=94d0066599d8f74d1c090e93ac4617b6491d3629d2e2d770870fcef1f7effa25b204aa53b3821da5e9e65bee8e94331bcae2cb344d0739ca3a938b4ef2051cc8&vh=7ab82e63aae8510c6b37ea16da502e54e441a5a1a88bce0c8ed63da99bce948d86253d64ae00424dda8b9c8b6e2cd0f6cd79d8b0a56e10759210cdf4f6761d11", type: "tv", group: "Fëmijë Shqip", logo: "https://i.imgur.com/GbBHtwD.png", quality: "1080p", description: "Kanali i preferuar për fëmijët shqiptarë" },
  { id: "bangbang", name: "BANG BANG HD", url: "https://digitalb-live.morescreens.com/DAL_1_004/playlist.m3u8?id=DAL_1_004&video_id=16377&token=142cda7d50870275a9ca7988ff001b32ab30709b&authority_instance_id=spectar-prd-digitalb&profile_id=1&application_installation_id=1&uuid=backoffice1&subscriber_id=1&application_id=backoffice1&detected_delivery_method=hls&playlist_template=nginx&ps=6ca6054c4d6f9fafd6e3202ad620d4cc30ee45fdbbf1526cab3fdcac143b283d2f7251b3babf442b3a4fb90820abcc0cfaab2bff9a76799adc92b09fa0151f25&vh=7edb2a069c1d9e1872251cc87e99c568dfd18769f97905bd1dcaf519b259c970f880a1c43b6a7392ac496426adb0e55a2f6dbb06981536af9c1c987416282783", type: "tv", group: "Fëmijë Shqip", logo: "https://i.imgur.com/lpS2PpS.png", quality: "720p", description: "Argëtim dhe kartonë për fëmijë" },
  { id: "juniortv", name: "Junior TV HD", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/148.ts", type: "tv", group: "Fëmijë Shqip", logo: "https://i.imgur.com/Cy9y4Fj.png", quality: "720p", description: "Kanali më i mirë me përmbajtje edukuese dhe argëtuese për fëmijë" },
  
  // Kanale muzikore
  { id: "albkanalemusic", name: "AlbKanale Music TV", url: "https://albportal.net/albkanalemusic.m3u8", type: "tv", group: "Shqipëri-Muzikë", logo: "https://i.imgur.com/JdKxscs.png", quality: "1080p" }
];

// --- Kanalet turke për fëmijë
const turkishKidsChannels = [
  { id: "trtcocuk", name: "TRT Çocuk", url: "https://tv-trtcocuk.live.trt.com.tr/master.m3u8", type: "tv", group: "Türk Çocuk", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/TRT_%C3%87ocuk_logo_%282021%29.svg/512px-TRT_%C3%87ocuk_logo_%282021%29.svg.png", quality: "1080p", description: "Kanal televiziv turk për fëmijë" },
  { id: "minikacocuk", name: "Minika Çocuk", url: "http://fireott.biz:2052/nimble.smf/4221019481/154076/584", type: "tv", group: "Türk Çocuk", logo: "https://i.imgur.com/VCywMTv.png", quality: "480p", description: "Programi i popullarizuar për fëmijë në Turqi" },
  { id: "minikago", name: "Minika Go", url: "http://fireott.biz:2052/nimble.smf/4221019481/154076/583", type: "tv", group: "Türk Çocuk", logo: "https://i.imgur.com/qIoipDq.png", quality: "480p", description: "Kanal argëtues për fëmijët turq" },
  { id: "trtdiyanetcocuk", name: "TRT Diyanet Çocuk", url: "https://tv-trtdiyanetcocuk.medya.trt.com.tr/master.m3u8", type: "tv", group: "Türk Çocuk", logo: "https://i.imgur.com/8PmXz9t.png", quality: "720p", description: "Kanal religjioz për fëmijë" },
  { id: "babytvturkiye", name: "BabyTV Türkiye", url: "https://saran-live.ercdn.net/babytv/index.m3u8", type: "tv", group: "Türk Çocuk", logo: "https://i.imgur.com/4BDJ5FT.png", quality: "1080p", description: "Kanal për foshnjat dhe fëmijët e vegjël" },
  { id: "gemkids", name: "GEM Kids", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemkids/index-0.m3u8", type: "tv", group: "Türk Çocuk", logo: "https://www.gemtvs.net/uploads/channel/kids-300px.png", quality: "720p", description: "Kanal me përmbajtje për fëmijë" }
];

// --- Kanalet kryesore turke
const turkishMainChannels = [
  { id: "trt1", name: "TRT 1", url: "https://tv-trt1.medya.trt.com.tr/master.m3u8", type: "tv", group: "Türkiye", logo: "https://upload.wikimedia.org/wikipedia/commons/8/85/TRT_1_logo_%282021%29.svg", quality: "1080p", description: "Kanali kryesor kombëtar turk" },
  { id: "showtv", name: "Show TV", url: "https://showtv.blutv.com/blutv_showtv_live/live.m3u8", type: "tv", group: "Türkiye", logo: "https://i.imgur.com/1l7SCCh.png", quality: "1080p", description: "Kanal i popullarizuar turk me lajme dhe argëtim" },
  { id: "startv", name: "Star TV", url: "https://startv.blutv.com/blutv_startv_live/live.m3u8", type: "tv", group: "Türkiye", logo: "https://i.imgur.com/9O3DHRB.png", quality: "1080p", description: "Kanal privat turk me seriale dhe argëtim" },
  { id: "kanald", name: "Kanal D", url: "https://kanald.blutv.com/blutv_kanald_live/live.m3u8", type: "tv", group: "Türkiye", logo: "https://i.imgur.com/ULqQnEL.png", quality: "1080p", description: "Një nga kanalet më të mëdha private turke" },
  { id: "fox", name: "FOX Türkiye", url: "https://foxtv.blutv.com/blutv_foxtv_live/live.m3u8", type: "tv", group: "Türkiye", logo: "https://i.imgur.com/homSiDa.png", quality: "1080p", description: "Lajme dhe argëtim në gjuhën turke" },
  { id: "tv8", name: "TV8", url: "https://tv8.daioncdn.net/tv8/tv8.m3u8?app=tv8_web&ce=3", type: "tv", group: "Türkiye", logo: "https://i.imgur.com/DKNLtJz.png", quality: "1080p", description: "Kanal privat turk me shumë shikueshmëri" }
];

// --- Tring TV Albania Channels
const tringAlbaniaChannels = [
  // Kanalet sportive
  { id: "tringsport1", name: "Tring Sport 1", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/165.ts", type: "tv", group: "Tring Sport", logo: "https://tring.al/wp-content/uploads/2022/06/Sport-1_light.svg", quality: "720p", description: "Sporti me Champions League dhe Serie A" },
  { id: "tringsport2", name: "Tring Sport 2", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/166.ts", type: "tv", group: "Tring Sport", logo: "https://tring.al/wp-content/uploads/2024/06/tring-sport-5-01-1.svg", quality: "720p", description: "Kanali sportiv me ndeshje ekskluzive" },
  { id: "tringsport3", name: "Tring Sport 3", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/187.ts", type: "tv", group: "Tring Sport", logo: "https://tring.al/wp-content/uploads/2022/06/Sport-4_light.svg", quality: "720p", description: "Sportet më të mira për shikuesit" },
  { id: "tringsport4", name: "Tring Sport 4", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/188.ts", type: "tv", group: "Tring Sport", logo: "https://tring.al/wp-content/uploads/2022/06/Sport-3_light.svg", quality: "720p", description: "Eventi sportiv NBA dhe MotoGP" },
  { id: "tringsport5", name: "Tring Sport 5", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/189.ts", type: "tv", group: "Tring Sport", logo: "https://tring.al/wp-content/uploads/2024/06/Sport-news_light.svg", quality: "720p", description: "Kanali i dedikuar për sporte" },
  { id: "tringsportnews", name: "Tring Sport News", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/189.ts", type: "tv", group: "Tring Sport", logo: "https://tring.al/wp-content/uploads/2022/06/Sport-2_light.svg", quality: "720p", description: "Lajmet sportive dhe analizat e ndeshjeve" },
  
  // Kanalet e filmave
  { id: "tringsuperhd", name: "Tring Super HD", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/151.ts", type: "tv", group: "Tring Filma", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-Super-White-Logo-1-1.png", quality: "720p", description: "Premierat e fundit botërore të filmave" },
  { id: "tringaction", name: "Tring Action", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/152.ts", type: "tv", group: "Tring Filma", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-Action-White-Logo-1.png", quality: "720p", description: "Filma aksion dhe adrenalinë" },
  { id: "tringcomedy", name: "Tring Comedy", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/153.ts", type: "tv", group: "Tring Filma", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-Comedy-White-Logo.png", quality: "720p", description: "Komeditë më të mira dhe argëtim" },
  { id: "tringlife", name: "Tring Life", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/157.ts", type: "tv", group: "Tring Filma", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-Life-White-Logo-1.png", quality: "720p", description: "Drama dhe romanca emocionuese" },
  { id: "tringfantasy", name: "Tring Fantasy", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/156.ts", type: "tv", group: "Tring Filma", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-Fantasy-White-Logo.png", quality: "720p", description: "Filma fantazi dhe fantashkencë" },
  { id: "tringclassic", name: "Tring Classic", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/154.ts", type: "tv", group: "Tring Filma", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-Classic-White-Logo.png", quality: "720p", description: "Filmat klasikë që kanë bërë histori" },
  { id: "tringfamily", name: "Tring Family", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/154.ts", type: "tv", group: "Tring Filma", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-Family-White-Logo-1.png", quality: "720p", description: "Filma për të gjithë familjen" },
  { id: "tringcollection", name: "Tring Collection", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/155.ts", type: "tv", group: "Tring Filma", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-Collection-White-Logo-1.png", quality: "720p", description: "Koleksion me filma të përzgjedhur" },
  { id: "tringshqip", name: "Tring Shqip", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/150.ts", type: "tv", group: "Tring Filma", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-Shqip-White-Logo-1.png", quality: "720p", description: "Filmat më të mirë shqiptarë" },
  
  // Kanalet per fëmijë
  { id: "tringjunior", name: "Tring Junior", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/148.ts", type: "tv", group: "Tring Fëmijë", logo: "https://i.imgur.com/Cy9y4Fj.png", quality: "720p", description: "Kanal për fëmijë me përmbajtje edukuese dhe argëtuese" },
  { id: "tringtring", name: "Tring Tring", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/146.ts", type: "tv", group: "Tring Fëmijë", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-Tring-White-Logo-1.png", quality: "720p", description: "Kanali i preferuar i fëmijëve" },
  { id: "tringkids", name: "Tring Kids", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/149.ts", type: "tv", group: "Tring Fëmijë", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-Kids-White-Logo.png", quality: "720p", description: "Përmbajtje për fëmijët me kartonë dhe programe argëtuese" },
  { id: "tiptv", name: "Tip TV", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/147.ts", type: "tv", group: "Tring Fëmijë", logo: "https://www.tring.al/wp-content/uploads/2022/11/TIP-TV-White-Logo.png", quality: "720p", description: "Programe argëtuese për fëmijët" },
  
  // Kanalet e argëtimit
  { id: "vizionplus", name: "Vizion Plus", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/144.ts", type: "tv", group: "Tring Shqipëri", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Vizion_Plus.svg/512px-Vizion_Plus.svg.png", quality: "720p", description: "Kanali gjeneralist shqiptar" },
  { id: "livinghd", name: "Living HD", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/145.ts", type: "tv", group: "Tring Lifestyle", logo: "https://www.tring.al/wp-content/uploads/2022/11/Living-White-Logo-1.png", quality: "720p", description: "Mënyra e jetesës dhe argëtim" },
  { id: "tringplanet", name: "Tring Planet", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/158.ts", type: "tv", group: "Tring Dokumentarë", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-Planet-White-Logo-1.png", quality: "720p", description: "Dokumentarë të natyrës dhe planetit" },
  { id: "tringworld", name: "Tring World", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/159.ts", type: "tv", group: "Tring Dokumentarë", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-World-White-Logo-1.png", quality: "720p", description: "Dokumentarë rreth botës dhe kulturave" },
  { id: "tringhistory", name: "Tring History", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/159.ts", type: "tv", group: "Tring Dokumentarë", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-History-White-Logo.png", quality: "720p", description: "Dokumentarë historikë" }
];

// --- Kanalet GEM TV (kanale për argëtim dhe filma)
const gemTVChannels = [
  { id: "gemtv", name: "GEM TV", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemb/index-0.m3u8", type: "tv", group: "GEM TV", logo: "https://www.gemtvs.net/uploads/channel/gem-300px.png", quality: "720p", description: "Kanali kryesor i rrjetit GEM" },
  { id: "gemseries", name: "GEM Series", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemseries/index-0.m3u8", type: "tv", group: "GEM TV", logo: "https://www.gemtvs.net/uploads/channel/series-300px.png", quality: "720p", description: "Seriale të ndryshme" },
  { id: "gembollywood", name: "GEM Bollywood", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gembollywood/index-0.m3u8", type: "tv", group: "GEM TV", logo: "https://www.gemtvs.net/uploads/channel/bollywood-300px.png", quality: "720p", description: "Filma dhe seriale nga Bollywood" },
  { id: "gemfilm", name: "GEM Film", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemfilm/index-0.m3u8", type: "tv", group: "GEM TV", logo: "https://www.gemtvs.net/uploads/channel/film-300px.png", quality: "720p", description: "Kanali për filma" },
  { id: "gemclassic", name: "GEM Classic", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemclassic/index-0.m3u8", type: "tv", group: "GEM TV", logo: "https://www.gemtvs.net/uploads/channel/classic-300px.png", quality: "720p", description: "Filma dhe seriale klasike" },
  { id: "gemdrama", name: "GEM Drama", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemdrama/index-0.m3u8", type: "tv", group: "GEM TV", logo: "https://www.gemtvs.net/uploads/channel/drama-300px.png", quality: "720p", description: "Seriale dramatike" },
  { id: "gemjunior", name: "GEM Junior", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemjunior/index-0.m3u8", type: "tv", group: "GEM TV Fëmijë", logo: "https://www.gemtvs.net/uploads/channel/junior-300px.png", quality: "720p", description: "Programe për të rinjtë" },
  { id: "gemkids", name: "GEM Kids", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemkids/index-0.m3u8", type: "tv", group: "GEM TV Fëmijë", logo: "https://www.gemtvs.net/uploads/channel/kids-300px.png", quality: "720p", description: "Përmbajtje për fëmijë" },
  { id: "gemfood", name: "GEM Food", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemfood/index-0.m3u8", type: "tv", group: "GEM TV", logo: "https://www.gemtvs.net/uploads/channel/food-300px.png", quality: "720p", description: "Programe për gatim dhe ushqim" },
  { id: "gemmifa", name: "GEM Mifa", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemmifa/index-0.m3u8", type: "tv", group: "GEM TV", logo: "https://www.gemtvs.net/uploads/channel/mifa-300px.png", quality: "720p", description: "Kanal argëtimi" },
  { id: "gemriver", name: "GEM River", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemriver/index-0.m3u8", type: "tv", group: "GEM TV", logo: "https://www.gemtvs.net/uploads/channel/river-300px.png", quality: "720p", description: "Përmbajtje zbavitëse të ndryshme" },
  { id: "gemrubix", name: "GEM Rubix", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemrubix/index-0.m3u8", type: "tv", group: "GEM TV", logo: "https://www.gemtvs.net/uploads/channel/rubix-300px.png", quality: "720p", description: "Kanal argëtues dhe informativ" },
  { id: "gemcomedy", name: "GEM Comedy", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemcomedy/index-0.m3u8", type: "tv", group: "GEM TV", logo: "https://www.gemtvs.net/uploads/channel/comedy-300px.png", quality: "720p", description: "Komedi dhe argëtim" },
  { id: "gemnature", name: "GEM Nature", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemnature/index-0.m3u8", type: "tv", group: "GEM TV", logo: "https://www.gemtvs.net/uploads/channel/nature-300px.png", quality: "720p", description: "Dokumentarë për natyrën" },
  { id: "gemlife", name: "GEM Life", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemlife/index-0.m3u8", type: "tv", group: "GEM TV", logo: "https://www.gemtvs.net/uploads/channel/life-300px.png", quality: "720p", description: "Mënyrë jetese dhe argëtim" },
  { id: "gemfit", name: "GEM Fit", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemfit/index-0.m3u8", type: "tv", group: "GEM TV", logo: "https://www.gemtvs.net/uploads/channel/fit-300px.png", quality: "720p", description: "Fitnes dhe shëndet" },
  { id: "ekranmovies", name: "Ekran Movies", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/EkranMovies/index-0.m3u8", type: "tv", group: "GEM TV", logo: "https://www.gemtvs.net/uploads/channel/ekranmovie.png", quality: "720p", description: "Filma të ndryshëm" },
  { id: "gemonyx", name: "GEM Onyx", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemonyx/index-0.m3u8", type: "tv", group: "GEM TV", logo: "https://www.gemtvs.net/uploads/channel/onyx-300px.png", quality: "720p", description: "Kanal premium i rrjetit GEM" },
  { id: "gemmifaplus", name: "GEM Mifa Plus", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemmifaplus/index-0.m3u8", type: "tv", group: "GEM TV", logo: "https://www.gemtvs.net/uploads/channel/mifaplus-300px.png", quality: "720p", description: "Versioni premium i GEM Mifa" },
  { id: "gemriverplus", name: "GEM River Plus", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemriverplus/index-0.m3u8", type: "tv", group: "GEM TV", logo: "https://www.gemtvs.net/uploads/channel/riverplus-300px.png", quality: "720p", description: "Versioni premium i GEM River" },
  { id: "gemdramaplus", name: "GEM Drama Plus", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemdramaplus/index-0.m3u8", type: "tv", group: "GEM TV", logo: "https://www.gemtvs.net/uploads/channel/dramaplus-300px.png", quality: "720p", description: "Versioni premium i GEM Drama" },
  { id: "gemrubixplus", name: "GEM Rubix Plus", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemrubixplus/index-0.m3u8", type: "tv", group: "GEM TV", logo: "https://www.gemtvs.net/uploads/channel/rubixplus-300px.png", quality: "720p", description: "Versioni premium i GEM Rubix" },
  { id: "gemseriesplus", name: "GEM Series Plus", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemseriesplus/index-0.m3u8", type: "tv", group: "GEM TV", logo: "https://www.gemtvs.net/uploads/channel/seriesplus-300px.png", quality: "720p", description: "Versioni premium i GEM Series" },
  { id: "t2movies", name: "T2 Movies", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/T2Movies/index-0.m3u8", type: "tv", group: "GEM TV", logo: "https://www.gemtvs.net/uploads/channel/t2.png", quality: "720p", description: "Kanal me filma" }
];

// --- Kosovë
const kosovoChannels = [
  // Kanalet e RTK
  { id: "rtk1", name: "RTK 1", url: "https://viamotionhsi.netplus.ch/live/eds/rtk1/browser-HLS8/rtk1.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/KTcWcO6.png", quality: "1080p" },
  { id: "rtk2", name: "RTK 2", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-livestream/rtk2/index.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/g6k6xyO.png", quality: "1080p" },
  { id: "rtk3", name: "RTK 3", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-livestream/rtk3/index.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/Ut9VcT3.png", quality: "1080p" },
  { id: "rtv21", name: "RTV21", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-live/2cz-npl-jfn-9he/tracks-v2a1/mono.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/AqQltGh.png", quality: "1080p" },
  
  // Kanalet e tjera të Kosovës
  { id: "kohavision", name: "Kohavision", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-livestream/lj9-pxm-o53-rp0/tracks-v4a1/mono.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/LOi9yma.png", quality: "1080p" },
  { id: "t7", name: "T7", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-livestream-specific/1z8-byc-4ee-lc9/index.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/b7FvSJj.png", quality: "1080p" },
  { id: "tvarta", name: "TV Arta", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-live/mps-vgx-u9p-qv1/index.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/MAhJkK9.png", quality: "1080p" },
  { id: "tvprizreni", name: "TV Prizreni", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-live/5m0-cok-g5z-1xi/index.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/hvtJwOO.png", quality: "1080p" },
  { id: "tvsyri", name: "TV Syri", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-live/xej-xnb-ba0-kup/index.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/ZQuFosn.png", quality: "1080p" },
  { id: "tvdielli", name: "TV Dielli", url: "http://stream.tvdielli.com:8081/dielli/index.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/kLl3ar5.png", quality: "1080p" },
  { id: "tvopoja", name: "TV Opoja", url: "http://ip.opoja.tv:1935/tvopoja/tvopoja/playlist.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/hxi4Qiq.png", quality: "1080p" },
  
  // Kanalet Arbëria
  { id: "tvarberia1", name: "TV Arbëria 1", url: "https://yayin30.haber100.com/live/rtvarberia/playlist.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/zLRzyVS.png", quality: "1080p" },
  { id: "tvarberia2", name: "TV Arbëria 2", url: "https://ssh101.bozztv.com/ssh101/rtvarberia2/playlist.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/zLRzyVS.png", quality: "1080p" },
  { id: "tvarberia3", name: "TV Arbëria 3 Fëmijë", url: "https://ssh101.bozztv.com/ssh101/rtvarberia3/playlist.m3u8", type: "tv", group: "Kosovë-Fëmijë", logo: "https://i.imgur.com/zLRzyVS.png", quality: "1080p" },
  { id: "tvarberia4", name: "TV Arbëria 4 Muzikë", url: "https://ssh101.bozztv.com/ssh101/rtvarberia4/playlist.m3u8", type: "tv", group: "Kosovë-Muzikë", logo: "https://i.imgur.com/zLRzyVS.png", quality: "1080p" },
  { id: "tvarberiaretro", name: "TV Arbëria Retro Hits", url: "https://ssh101.bozztv.com/ssh101/rtvarberiaretro/playlist.m3u8", type: "tv", group: "Kosovë-Muzikë", logo: "https://i.imgur.com/zLRzyVS.png", quality: "1080p" },
  
  // Kanale të tjera
  { id: "peacetvalbanian", name: "Peace TV Albanian", url: "http://82.114.67.178:8081/hls/PeaceTV.m3u8", type: "tv", group: "Kosovë-Fetare", logo: "https://i.imgur.com/cK3KATX.png", quality: "720p" }
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
      channels = [].concat(
        arabChannels,
        georgiaChannels,
        italyChannels,
        deChannels,
        ukChannelsData
      );
      
      console.log('[Mini IPTV] Kanale të ngarkuara me metodën fallback:', channels.length);
    } else {
      // Përdor playlist-loader për ngarkimin e të gjitha M3U files
      console.log('[Mini IPTV] Duke përdorur playlist-loader për të gjitha kanalet.');
      
      // Afishim mesazhi ngarkimi
      const statusEl = document.getElementById('status');
      if (statusEl) {
        statusEl.innerHTML = '<div class="loading-spinner"></div> Duke ngarkuar të gjitha listat e kanaleve...';
      }
      
      // Ngarko të gjitha kanalet me playlist-loader
      const allChannels = await window.playlistLoader.loadAllPlaylists();
      
      // Ndaj kanalet në kategori
      channels = allChannels;
      
      // Ndaj kanalet sipas kategorive për përdorim të veçantë
      arabChannels = allChannels.filter(ch => ch.group && (ch.group.includes('Arab') || ch.source.includes('arab.m3u')));
      georgiaChannels = allChannels.filter(ch => ch.group && (ch.group.includes('Georgia') || ch.source.includes('ge.m3u')));
      italyChannels = allChannels.filter(ch => ch.group && (ch.group.includes('Italy') || ch.source.includes('it.m3u')));
      ukChannels = allChannels.filter(ch => ch.group && (ch.group.includes('United Kingdom') || ch.source.includes('uk.m3u')));
      germanyChannels = allChannels.filter(ch => ch.group && (ch.group.includes('German') || ch.source.includes('de.m3u')));
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
      .concat(safe(turkishKidsChannels))
      .concat(safe(turkishMainChannels));
    
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
    safe(turkishKidsChannels), // 4. Kanale turke për fëmijë
    safe(turkishMainChannels), // 5. Kanale kryesore turke
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
    .map(it => ({
      id: it.id,
      name: it.name || it.title || "Channel",
      url: normalizeUrlForContext(it.url),
      type: it.type || 'tv',
      group: it.group || 'General',
      logo: it.logo || '',
      quality: it.quality || ''
    }));
    
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

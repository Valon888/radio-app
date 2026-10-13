// Objekti i kanaleve hardcoded (për fallback)
// Import channels from US and other countries (from the M3U files)
const importedFallbackChannels = [
  // US Canela TV Channels
  { id: "fallback_accionmexicana", name: "Accion Mexicana", url: "https://stream.ads.ottera.tv/playlist.m3u8?network_id=1153", type: "tv", group: "us_canelatv", logo: "", quality: "" },
  { id: "fallback_canelaclasicos", name: "Canela Clasicos", url: "https://stream.ads.ottera.tv/playlist.m3u8?network_id=652", type: "tv", group: "us_canelatv", logo: "", quality: "" },
  { id: "fallback_canelahits", name: "Canela Hits", url: "https://stream.ads.ottera.tv/playlist.m3u8?network_id=1058", type: "tv", group: "us_canelatv", logo: "", quality: "" },
  { id: "fallback_canelakids", name: "Canela Kids", url: "https://stream.ads.ottera.tv/playlist.m3u8?network_id=654", type: "tv", group: "us_canelatv", logo: "", quality: "" },
  
  // US Cineverse TV Channels
  { id: "fallback_californiamusicchann", name: "California Music Channel", url: "https://cmc-cmctv-cineverse.amagi.tv/playlist.m3u8", type: "tv", group: "us_cineversetv", logo: "", quality: "" },
  
  // US XUMO Channels
  { id: "fallback_americanninjawarrior", name: "American Ninja Warrior", url: "https://xumo-drct-ch812-n4996.fast.nbcuni.com/live/master.m3u8", type: "tv", group: "us_xumo", logo: "", quality: "" },
  
  // US Plex Channels
  { id: "fallback_accuweathernow1080p", name: "AccuWeather Now (1080p)", url: "https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg00684-accuweather-accuweather-plex/playlist.m3u8", type: "tv", group: "us_plex", logo: "", quality: "" },
  { id: "fallback_afv720p", name: "AFV (720p)", url: "https://linear-12.frequency.stream/dist/plex/12/hls/master/playlist.m3u8", type: "tv", group: "us_plex", logo: "", quality: "" },
  
  // Trinidad & Tobago Channels
  { id: "fallback_sankhyatv720p", name: "Sankhya TV (720p)", url: "https://5c59fd5680a05.streamlock.net/live/_definst_/ngrp:SANKHYATV.stream_all/playlist.m3u8", type: "tv", group: "tt", logo: "", quality: "" },
  
  // Croatia Channels
  { id: "fallback_cmctv1080p", name: "CMC TV (1080p)", url: "https://stream.cmctv.hr:49998/cmc/live.m3u8", type: "tv", group: "hr", logo: "", quality: "" },
  { id: "fallback_extratv1080p", name: "Extra TV (1080p)", url: "https://streaming.social3.hr/ExtraTVudzdhr5/uUankWqpXD/1.m3u8", type: "tv", group: "hr", logo: "", quality: "" }
];

const hardcodedChannels = [
  // Albanian Channels
  { id: "albkanalemusic", name: "AlbKanale Music TV", url: "https://albportal.net/albkanalemusic.m3u8", type: "tv", group: "Music", logo: "https://i.imgur.com/JdKxscs.png", quality: "720p" },
  { id: "bangbang_triangolo", name: "Bang Bang (TriangoloMedia)", url: "https://triangolomedia.com/portal/kategori/femije/kanali/bangbang.php", type: "tv", group: "Fëmijë Shqip", logo: "https://i.imgur.com/lpS2PpS.png", quality: "auto", description: "Bang Bang nga TriangoloMedia" },
  { id: "cna", name: "CNA", url: "https://live1.mediadesk.al/cnatvlive.m3u8", type: "tv", group: "News", logo: "https://codeit.al/wp-content/uploads/2020/08/cna.png", quality: "1080p" },
  
  // Kosovo Channels
  { id: "kohavision", name: "Kohavision", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-livestream/lj9-pxm-o53-rp0/tracks-v4a1/mono.m3u8", type: "tv", group: "News", logo: "https://i.imgur.com/LOi9yma.png" },
  { id: "rtk2", name: "RTK 2", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-livestream/rtk2/index.m3u8", type: "tv", group: "General", logo: "https://i.imgur.com/g6k6xyO.png" },
  
  // Turkish Children's Channels
  { id: "trtcocuk", name: "TRT Çocuk", url: "https://tv-trtcocuk.live.trt.com.tr/master.m3u8", type: "tv", group: "Türk Çocuk", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/TRT_%C3%87ocuk_logo_%282021%29.svg/512px-TRT_%C3%87ocuk_logo_%282021%29.svg.png", quality: "1080p", description: "Kanal televiziv turk për fëmijë" },
  { id: "trtdiyanetcocuk", name: "TRT Diyanet Çocuk", url: "https://tv-trtdiyanetcocuk.medya.trt.com.tr/master.m3u8", type: "tv", group: "Türk Çocuk", logo: "https://i.imgur.com/8PmXz9t.png", quality: "720p", description: "Kanal religjioz për fëmijë" },
  
  // Turkish Main Channels
  { id: "trt1", name: "TRT 1", url: "https://tv-trt1.medya.trt.com.tr/master.m3u8", type: "tv", group: "Türkiye", logo: "https://upload.wikimedia.org/wikipedia/commons/8/85/TRT_1_logo_%282021%29.svg", quality: "1080p", description: "Kanali kryesor kombëtar turk" },
  { id: "showtv", name: "Show TV", url: "https://showtv.blutv.com/blutv_showtv_live/live.m3u8", type: "tv", group: "Türkiye", logo: "https://i.imgur.com/1l7SCCh.png", quality: "1080p", description: "Kanal i popullarizuar turk me lajme dhe argëtim" },
  
  // Tring TV Albania Channels
  
  // GEM TV Channels
  
  // Test Channels
  { id: "test-channel", name: "Test Channel", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type: "tv", group: "Test", logo: "", quality: "720p" },
  
  // Radio Channels
  { id: "pendimi1", name: "Radio Pendimi Kanali 1", url: "http://www.rtvpendimi.com:8014/stream", type: "radio", group: "Radio", logo: "", quality: "" }
];

// Combine the original hardcoded channels with the imported fallback channels
const allHardcodedChannels = [...hardcodedChannels, ...importedFallbackChannels];

// Export for use in items.js
if (typeof module !== 'undefined') {
  module.exports = { hardcodedChannels: allHardcodedChannels };
}

// For browser use
if (typeof window !== 'undefined') {
  window.hardcodedChannels = allHardcodedChannels;
}

// Objekti i kanaleve hardcoded (për fallback)
// Import channels from US and other countries (from the M3U files)
const importedFallbackChannels = [
  // US Canela TV Channels
  { id: "fallback_accionmexicana", name: "Accion Mexicana", url: "https://stream.ads.ottera.tv/playlist.m3u8?network_id=1153", type: "tv", group: "us_canelatv", logo: "", quality: "" },
  { id: "fallback_canelaclasicos", name: "Canela Clasicos", url: "https://stream.ads.ottera.tv/playlist.m3u8?network_id=652", type: "tv", group: "us_canelatv", logo: "", quality: "" },
  { id: "fallback_canelahits", name: "Canela Hits", url: "https://stream.ads.ottera.tv/playlist.m3u8?network_id=1058", type: "tv", group: "us_canelatv", logo: "", quality: "" },
  { id: "fallback_canelakids", name: "Canela Kids", url: "https://stream.ads.ottera.tv/playlist.m3u8?network_id=654", type: "tv", group: "us_canelatv", logo: "", quality: "" },
  
  // US Cineverse TV Channels
  { id: "fallback_asiancrush", name: "AsianCrush", url: "https://amg01201-cinedigmenterta-asiancrush-cineverse-x701o.amagi.tv/playlist/amg01201-cinedigmenterta-asiancrush-cineverse/playlist.m3u8", type: "tv", group: "us_cineversetv", logo: "", quality: "" },
  { id: "fallback_bloodydisgustingtv", name: "Bloody Disgusting TV", url: "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01201-cinedigmenterta-bloodydisgus-cineverse/playlist.m3u8", type: "tv", group: "us_cineversetv", logo: "", quality: "" },
  { id: "fallback_californiamusicchann", name: "California Music Channel", url: "https://cmc-cmctv-cineverse.amagi.tv/playlist.m3u8", type: "tv", group: "us_cineversetv", logo: "", quality: "" },
  
  // US XUMO Channels
  { id: "fallback_americancrimes", name: "American Crimes", url: "https://xumo-xumoent-vc-113-at8kn.fast.nbcuni.com/live/master.m3u8", type: "tv", group: "us_xumo", logo: "", quality: "" },
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
  { id: "topchannel", name: "Top Channel", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/106.ts", type: "tv", group: "Shqipëri", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Top_Channel_logo.svg/512px-Top_Channel_logo.svg.png", quality: "720p", description: "Televizioni i parë privat në Shqipëri" },
  { id: "atv", name: "ATV", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/101.ts", type: "tv", group: "Shqipëri", logo: "https://atvkosova.com/wp-content/uploads/2022/07/logo1.png", quality: "720p", description: "Televizion privat shqiptar" },
  { id: "filmaksion", name: "Film Aksion", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/133.ts", type: "tv", group: "Filma Shqip", logo: "https://yt3.googleusercontent.com/ytc/APkrFKaaZZ1dZKwv-PKgvuYM0SZVQzKCvmFOA9vQQmIQ=s900-c-k-c0x00ffffff-no-rj", quality: "720p", description: "Filma aksion me përkthim shqip" },
  { id: "albkanalemusic", name: "AlbKanale Music TV", url: "https://albportal.net/albkanalemusic.m3u8", type: "tv", group: "Music", logo: "https://i.imgur.com/JdKxscs.png", quality: "720p" },
  { id: "cufo", name: "CUFO TV HD", url: "https://digitalb-live.morescreens.com/DAL_1_005/playlist.m3u8?id=DAL_1_005&video_id=12498&token=142cda7d50870275a9ca7988ff001b32ab30709b&authority_instance_id=spectar-prd-digitalb&profile_id=1&application_installation_id=1&uuid=backoffice1&subscriber_id=1&application_id=backoffice1&detected_delivery_method=hls&playlist_template=nginx&ps=94d0066599d8f74d1c090e93ac4617b6491d3629d2e2d770870fcef1f7effa25b204aa53b3821da5e9e65bee8e94331bcae2cb344d0739ca3a938b4ef2051cc8&vh=7ab82e63aae8510c6b37ea16da502e54e441a5a1a88bce0c8ed63da99bce948d86253d64ae00424dda8b9c8b6e2cd0f6cd79d8b0a56e10759210cdf4f6761d11", type: "tv", group: "Fëmijë Shqip", logo: "https://i.imgur.com/GbBHtwD.png", quality: "1080p", description: "Kanali i preferuar për fëmijët shqiptarë" },
  { id: "bangbang", name: "BANG BANG HD", url: "https://digitalb-live.morescreens.com/DAL_1_004/playlist.m3u8?id=DAL_1_004&video_id=16377&token=142cda7d50870275a9ca7988ff001b32ab30709b&authority_instance_id=spectar-prd-digitalb&profile_id=1&application_installation_id=1&uuid=backoffice1&subscriber_id=1&application_id=backoffice1&detected_delivery_method=hls&playlist_template=nginx&ps=6ca6054c4d6f9fafd6e3202ad620d4cc30ee45fdbbf1526cab3fdcac143b283d2f7251b3babf442b3a4fb90820abcc0cfaab2bff9a76799adc92b09fa0151f25&vh=7edb2a069c1d9e1872251cc87e99c568dfd18769f97905bd1dcaf519b259c970f880a1c43b6a7392ac496426adb0e55a2f6dbb06981536af9c1c987416282783", type: "tv", group: "Fëmijë Shqip", logo: "https://i.imgur.com/lpS2PpS.png", quality: "720p", description: "Argëtim dhe kartonë për fëmijë" },
  { id: "juniortv", name: "Junior TV HD", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/148.ts", type: "tv", group: "Fëmijë Shqip", logo: "https://i.imgur.com/Cy9y4Fj.png", quality: "720p", description: "Kanali më i mirë me përmbajtje edukuese dhe argëtuese për fëmijë" },
  { id: "cna", name: "CNA", url: "https://live1.mediadesk.al/cnatvlive.m3u8", type: "tv", group: "News", logo: "https://codeit.al/wp-content/uploads/2020/08/cna.png", quality: "1080p" },
  
  // Kosovo Channels
  { id: "kohavision", name: "Kohavision", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-livestream/lj9-pxm-o53-rp0/tracks-v4a1/mono.m3u8", type: "tv", group: "News", logo: "https://i.imgur.com/LOi9yma.png" },
  { id: "rtk1", name: "RTK 1", url: "https://viamotionhsi.netplus.ch/live/eds/rtk1/browser-HLS8/rtk1.m3u8", type: "tv", group: "General", logo: "https://i.imgur.com/KTcWcO6.png" },
  { id: "rtk2", name: "RTK 2", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-livestream/rtk2/index.m3u8", type: "tv", group: "General", logo: "https://i.imgur.com/g6k6xyO.png" },
  
  // Turkish Children's Channels
  { id: "trtcocuk", name: "TRT Çocuk", url: "https://tv-trtcocuk.live.trt.com.tr/master.m3u8", type: "tv", group: "Türk Çocuk", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/TRT_%C3%87ocuk_logo_%282021%29.svg/512px-TRT_%C3%87ocuk_logo_%282021%29.svg.png", quality: "1080p", description: "Kanal televiziv turk për fëmijë" },
  { id: "minikacocuk", name: "Minika Çocuk", url: "http://fireott.biz:2052/nimble.smf/4221019481/154076/584", type: "tv", group: "Türk Çocuk", logo: "https://i.imgur.com/VCywMTv.png", quality: "480p", description: "Programi i popullarizuar për fëmijë në Turqi" },
  { id: "trtdiyanetcocuk", name: "TRT Diyanet Çocuk", url: "https://tv-trtdiyanetcocuk.medya.trt.com.tr/master.m3u8", type: "tv", group: "Türk Çocuk", logo: "https://i.imgur.com/8PmXz9t.png", quality: "720p", description: "Kanal religjioz për fëmijë" },
  { id: "gemkids", name: "GEM Kids", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemkids/index-0.m3u8", type: "tv", group: "GEM TV Fëmijë", logo: "https://www.gemtvs.net/uploads/channel/kids-300px.png", quality: "720p", description: "Përmbajtje për fëmijë" },
  { id: "gemjunior", name: "GEM Junior", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemjunior/index-0.m3u8", type: "tv", group: "GEM TV Fëmijë", logo: "https://www.gemtvs.net/uploads/channel/junior-300px.png", quality: "720p", description: "Programe për të rinjtë" },
  
  // Turkish Main Channels
  { id: "trt1", name: "TRT 1", url: "https://tv-trt1.medya.trt.com.tr/master.m3u8", type: "tv", group: "Türkiye", logo: "https://upload.wikimedia.org/wikipedia/commons/8/85/TRT_1_logo_%282021%29.svg", quality: "1080p", description: "Kanali kryesor kombëtar turk" },
  { id: "showtv", name: "Show TV", url: "https://showtv.blutv.com/blutv_showtv_live/live.m3u8", type: "tv", group: "Türkiye", logo: "https://i.imgur.com/1l7SCCh.png", quality: "1080p", description: "Kanal i popullarizuar turk me lajme dhe argëtim" },
  
  // Tring TV Albania Channels
  { id: "tringsport1", name: "Tring Sport 1", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/165.ts", type: "tv", group: "Tring Sport", logo: "https://tring.al/wp-content/uploads/2022/06/Sport-1_light.svg", quality: "720p", description: "Sporti me Champions League dhe Serie A" },
  { id: "tringsport2", name: "Tring Sport 2", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/166.ts", type: "tv", group: "Tring Sport", logo: "https://tring.al/wp-content/uploads/2022/06/Sport-2_light.svg", quality: "720p", description: "Kampionatet prestigjoze të futbollit dhe sporteve" },
  { id: "tringsport3", name: "Tring Sport 3", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/167.ts", type: "tv", group: "Tring Sport", logo: "https://tring.al/wp-content/uploads/2022/06/Sport-3_light.svg", quality: "720p", description: "Sporte të ndryshme dhe ngjarje të rëndësishme" },
  { id: "tringsport4", name: "Tring Sport 4", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/168.ts", type: "tv", group: "Tring Sport", logo: "https://tring.al/wp-content/uploads/2022/06/Sport-4_light.svg", quality: "720p", description: "Sporte të ndryshme dhe ngjarje të rëndësishme" },
  { id: "tringsuperhd", name: "Tring Super HD", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/151.ts", type: "tv", group: "Tring Filma", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-Super-White-Logo-1-1.png", quality: "720p", description: "Premierat e fundit botërore të filmave" },
  { id: "tringfantasy", name: "Tring Fantasy", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/156.ts", type: "tv", group: "Tring Filma", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-Fantasy-White-Logo.png", quality: "720p", description: "Filma fantazi dhe aventurë" },
  { id: "tringaction", name: "Tring Action", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/152.ts", type: "tv", group: "Tring Filma", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-Action-White-Logo.png", quality: "720p", description: "Filmat më të mirë të aksionit" },
  { id: "tringcomedy", name: "Tring Comedy", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/153.ts", type: "tv", group: "Tring Filma", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-Comedy-White-Logo.png", quality: "720p", description: "Filmat më të mirë të komedisë" },
  { id: "tringlife", name: "Tring Life", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/157.ts", type: "tv", group: "Tring Filma", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-Life-White-Logo.png", quality: "720p", description: "Filma dramë dhe romancë" },
  { id: "tringjunior", name: "Tring Junior", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/148.ts", type: "tv", group: "Tring Fëmijë", logo: "https://i.imgur.com/Cy9y4Fj.png", quality: "720p", description: "Kanal për fëmijë me përmbajtje edukuese dhe argëtuese" },
  { id: "tringtring", name: "Tring Tring", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/146.ts", type: "tv", group: "Tring Fëmijë", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-Tring-White-Logo-1.png", quality: "720p", description: "Kanal për fëmijë me përmbajtje argëtuese" },
  { id: "tringkids", name: "Tring Kids", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/149.ts", type: "tv", group: "Tring Fëmijë", logo: "https://www.tring.al/wp-content/uploads/2022/11/Kids-White-Logo.png", quality: "720p", description: "Kanal për fëmijë me përmbajtje të përkthyer shqip" },
  { id: "tringplanet", name: "Tring Planet", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/158.ts", type: "tv", group: "Tring Dokumentarë", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-Planet-White-Logo-1.png", quality: "720p", description: "Dokumentarë të natyrës dhe planetit" },
  { id: "tringworld", name: "Tring World", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/159.ts", type: "tv", group: "Tring Dokumentarë", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-World-White-Logo.png", quality: "720p", description: "Dokumentarë për popuj dhe kultura nga mbarë bota" },
  { id: "tringhistory", name: "Tring History", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/159.ts", type: "tv", group: "Tring Dokumentarë", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-History-White-Logo.png", quality: "720p", description: "Dokumentarë mbi historitë më të rëndësishme të njerëzimit" },
  { id: "vizionplus", name: "Vizion Plus", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/144.ts", type: "tv", group: "Tring Shqipëri", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Vizion_Plus.svg/512px-Vizion_Plus.svg.png", quality: "720p", description: "Kanali gjeneralist shqiptar" },
  { id: "tringshqip", name: "Tring Shqip", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/150.ts", type: "tv", group: "Tring Shqipëri", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-Shqip-White-Logo.png", quality: "720p", description: "Filma dhe seriale shqiptare" },
  { id: "tring3plus", name: "3 Plus", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/143.ts", type: "tv", group: "Tring Shqipëri", logo: "https://www.tring.al/wp-content/uploads/2022/11/3-Plus-White-Logo.png", quality: "720p", description: "Kanal argëtues dhe informativ" },
  { id: "tringsmile", name: "Tring Smile", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/142.ts", type: "tv", group: "Tring Shqipëri", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-Smile-White-Logo.png", quality: "720p", description: "Spektakle humori dhe komedi" },
  { id: "tringinfo", name: "Tring Info", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/141.ts", type: "tv", group: "Tring Shqipëri", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-Info-White-Logo.png", quality: "720p", description: "Kanal informativ me lajmet më të fundit" },
  { id: "tringfamily", name: "Tring Family", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/154.ts", type: "tv", group: "Tring Shqipëri", logo: "https://www.tring.al/wp-content/uploads/2023/04/Tring-Family-White-Logo.png", quality: "720p", description: "Argëtim për të gjithë familjen" },
  { id: "tringinternational", name: "Tring International", url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/140.ts", type: "tv", group: "Tring Shqipëri", logo: "https://www.tring.al/wp-content/uploads/2022/11/Tring-International-White-Logo.png", quality: "720p", description: "Filma dhe seriale ndërkombëtare" },
  
  // GEM TV Channels
  { id: "gemtv", name: "GEM TV", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemb/index-0.m3u8", type: "tv", group: "GEM TV", logo: "https://www.gemtvs.net/uploads/channel/gem-300px.png", quality: "720p", description: "Kanali kryesor i rrjetit GEM" },
  { id: "gemfilm", name: "GEM Film", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemfilm/index-0.m3u8", type: "tv", group: "GEM TV", logo: "https://www.gemtvs.net/uploads/channel/film-300px.png", quality: "720p", description: "Kanali për filma" },
  { id: "gemseries", name: "GEM Series", url: "https://hls-proxy.awsvps.workers.dev/?url=https://ca-rt.onetv.app/gemseries/index-0.m3u8", type: "tv", group: "GEM TV", logo: "https://www.gemtvs.net/uploads/channel/series-300px.png", quality: "720p", description: "Seriale të ndryshme" },
  
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

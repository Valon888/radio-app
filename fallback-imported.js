// Extracted fallback channels from imported M3U files
// Add these to hardcodedChannels in fallback-channels.js
const importedFallbackChannels = [
  {
    "id": "fallback_accionmexicana",
    "name": "Accion Mexicana",
    "url": "https://stream.ads.ottera.tv/playlist.m3u8?network_id=1153",
    "type": "tv",
    "group": "us_canelatv",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_canelaclasicos",
    "name": "Canela Clasicos",
    "url": "https://stream.ads.ottera.tv/playlist.m3u8?network_id=652",
    "type": "tv",
    "group": "us_canelatv",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_canelahits",
    "name": "Canela Hits",
    "url": "https://stream.ads.ottera.tv/playlist.m3u8?network_id=1058",
    "type": "tv",
    "group": "us_canelatv",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_canelakids",
    "name": "Canela Kids",
    "url": "https://stream.ads.ottera.tv/playlist.m3u8?network_id=654",
    "type": "tv",
    "group": "us_canelatv",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_canelamusicpresents",
    "name": "Canela Music Presents",
    "url": "https://stream.ads.ottera.tv/playlist.m3u8?network_id=2548",
    "type": "tv",
    "group": "us_canelatv",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_asiancrush",
    "name": "AsianCrush",
    "url": "https://amg01201-cinedigmenterta-asiancrush-cineverse-x701o.amagi.tv/playlist/amg01201-cinedigmenterta-asiancrush-cineverse/playlist.m3u8",
    "type": "tv",
    "group": "us_cineversetv",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_bloodydisgustingtv",
    "name": "Bloody Disgusting TV",
    "url": "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01201-cinedigmenterta-bloodydisgus-cineverse/playlist.m3u8",
    "type": "tv",
    "group": "us_cineversetv",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_californiamusicchann",
    "name": "California Music Channel",
    "url": "https://cmc-cmctv-cineverse.amagi.tv/playlist.m3u8",
    "type": "tv",
    "group": "us_cineversetv",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_circlegeoblocked",
    "name": "Circle [Geo-blocked]",
    "url": "https://amg00432-circletvfast-amg00432c1-cineverse-us-1112.playouts.now.amagi.tv/playlist/amg00432-circletv-circletv-cineverseus/playlist.m3u8",
    "type": "tv",
    "group": "us_cineversetv",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_comedydynamics",
    "name": "Comedy Dynamics",
    "url": "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01201-cinedigmenterta-comedydynamics-cineverse/playlist.m3u8",
    "type": "tv",
    "group": "us_cineversetv",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_accuweathernowgeoblo",
    "name": "AccuWeather Now [Geo-blocked]",
    "url": "https://accuweather-xumo.amagi.tv/playlist.m3u8",
    "type": "tv",
    "group": "us_xumo",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_alfredhitchcockprese",
    "name": "Alfred Hitchcock Presents",
    "url": "https://xumo-xumoent-ch825-ku23q.fast.nbcuni.com/live/master.m3u8",
    "type": "tv",
    "group": "us_xumo",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_aliennation",
    "name": "Alien Nation",
    "url": "https://linear-888.frequency.stream/dist/xumo/888/hls/master/playlist.m3u8",
    "type": "tv",
    "group": "us_xumo",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_allweddingswetv",
    "name": "All Weddings We TV",
    "url": "https://amc-allweddings-1-us.xumo.wurl.tv/playlist.m3u8",
    "type": "tv",
    "group": "us_xumo",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_americastestkitcheng",
    "name": "America's Test Kitchen [Geo-blocked]",
    "url": "https://amg01420-americastestkitchen-amg01420c1-xumo-us-878.playouts.now.amagi.tv/playlist.m3u8",
    "type": "tv",
    "group": "us_xumo",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_americancrimes",
    "name": "American Crimes",
    "url": "https://xumo-xumoent-vc-113-at8kn.fast.nbcuni.com/live/master.m3u8",
    "type": "tv",
    "group": "us_xumo",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_americanninjawarrior",
    "name": "American Ninja Warrior",
    "url": "https://xumo-drct-ch812-n4996.fast.nbcuni.com/live/master.m3u8",
    "type": "tv",
    "group": "us_xumo",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_antiquesroadshowpbs",
    "name": "Antiques Roadshow PBS",
    "url": "https://amg00953-pbsusa-antiroadshow-xumo-x6ud5.amagi.tv/playlist.m3u8",
    "type": "tv",
    "group": "us_xumo",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_antiquesroadshowuk",
    "name": "Antiques Roadshow UK",
    "url": "https://bbc-antiquesroadshowuk-1-us.xumo.wurl.tv/playlist.m3u8",
    "type": "tv",
    "group": "us_xumo",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_athomewithfamilyhand",
    "name": "At Home with Family Handyman",
    "url": "https://linear-458.frequency.stream/dist/xumo/458/hls/master/playlist.m3u8",
    "type": "tv",
    "group": "us_xumo",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_accuweathernow1080p",
    "name": "AccuWeather Now (1080p)",
    "url": "https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg00684-accuweather-accuweather-plex/playlist.m3u8",
    "type": "tv",
    "group": "us_plex",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_afv720p",
    "name": "AFV (720p)",
    "url": "https://linear-12.frequency.stream/dist/plex/12/hls/master/playlist.m3u8",
    "type": "tv",
    "group": "us_plex",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_afvenespaol720pnot24",
    "name": "AFV en Español (720p) [Not 24/7]",
    "url": "https://linear-46.frequency.stream/dist/plex/46/hls/master/playlist.m3u8",
    "type": "tv",
    "group": "us_plex",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_amcabsolutereality",
    "name": "AMC Absolute Reality",
    "url": "https://amc-absolutereality-1-us.plex.wurl.tv/playlist.m3u8",
    "type": "tv",
    "group": "us_plex",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_choppertown720pnot24",
    "name": "Choppertown (720p) [Not 24/7]",
    "url": "https://linear-11.frequency.stream/dist/plex/11/hls/master/playlist.m3u8",
    "type": "tv",
    "group": "us_plex",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_sankhyatv720p",
    "name": "Sankhya TV (720p)",
    "url": "https://5c59fd5680a05.streamlock.net/live/_definst_/ngrp:SANKHYATV.stream_all/playlist.m3u8",
    "type": "tv",
    "group": "tt",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_theislamicnetwork480",
    "name": "The Islamic Network (480p) [Not 24/7]",
    "url": "http://daruttarbiyah.srfms.com:1935/daruttarbiyah/livestream/playlist.m3u8",
    "type": "tv",
    "group": "tt",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_bravokidstv1080p",
    "name": "Bravo! Kids TV (1080p)",
    "url": "https://streaming.social3.hr/play/r3CK_tdsFIFL3bN7w4NW1plrwsCToUBsRFjhxM68sZY/m3u8",
    "type": "tv",
    "group": "hr",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_bravotv1080p",
    "name": "Bravo! TV (1080p)",
    "url": "https://streaming.social3.hr/bravoTVkdjd7djd/XAbSERW5p3/2.m3u8",
    "type": "tv",
    "group": "hr",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_cmctv1080p",
    "name": "CMC TV (1080p)",
    "url": "https://stream.cmctv.hr:49998/cmc/live.m3u8",
    "type": "tv",
    "group": "hr",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_diadoratv",
    "name": "Diadora TV",
    "url": "https://diadoratv.stream/live/diadora/playlist.m3u8",
    "type": "tv",
    "group": "hr",
    "logo": "",
    "quality": ""
  },
  {
    "id": "fallback_extratv1080p",
    "name": "Extra TV (1080p)",
    "url": "https://streaming.social3.hr/ExtraTVudzdhr5/uUankWqpXD/1.m3u8",
    "type": "tv",
    "group": "hr",
    "logo": "",
    "quality": ""
  }
];

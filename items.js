const channels = [
  {
    id: "toggo_plus",
    name: "Super RTL - Toggo Plus",
    url: "http://84.22.46.188/play/a013",
    type: "tv",
    group: "Gjermani - Fëmijë",
    logo: "https://static.epg.best/de/TOGGOplus.de.png"
  },
  // —— KANALE GJERMANE (Filma & Fëmijë) ——
  {
    id: "ardone",
    name: "ARD One",
    url: "https://mcdn.daserste.de/daserste/de/master.m3u8",
    type: "tv",
    group: "Gjermani - Filma",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/One_Logo_2016.svg/200px-One_Logo_2016.svg.png"
  },
  {
    id: "zdfneo",
    name: "ZDF Neo",
    url: "https://zdf-hls-15.akamaized.net/hls/live/2016498/de/high/master.m3u8",
    type: "tv",
    group: "Gjermani - Filma",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/ZDFneo_2017_logo.svg/200px-ZDFneo_2017_logo.svg.png"
  },
  {
    id: "arte",
    name: "Arte DE",
    url: "https://arte-cdn.akamaized.net/am/arte_de/master.m3u8",
    type: "tv",
    group: "Gjermani - Filma",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Arte-logo.svg/200px-Arte-logo.svg.png"
  },
  {
    id: "kika",
    name: "KIKA",
    url: "https://kikade-lh.akamaihd.net/i/kikade_1@816548/master.m3u8",
    type: "tv",
    group: "Gjermani - Fëmijë",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/KiKA_Logo_2012.svg/200px-KiKA_Logo_2012.svg.png"
  },
  {
    id: "ric",
    name: "RiC TV",
    url: "http://ric-live.de/live/smil:ric.smil/playlist.m3u8",
    type: "tv",
    group: "Gjermani - Fëmijë",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/RiC_logo.svg/200px-RiC_logo.svg.png"
  }
];

// Turkish channels (sample, HTTPS only, prefer 720p/1080p)
const turkishChannels = [
  {
    title: "A Spor",
    url: "https://tgn.bozztv.com/dvrfl05/gin-aspor/index.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "AA Live",
    url: "https://mtulqxgomrllive.mediatriple.net/mtulqxgomrllive/broadcast_59f9c0c785b88.smil/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Aksu TV",
    url: "https://live.artidijitalmedya.com/artidijital_aksutv/aksutv/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Alanya Posta TV",
    url: "https://api-tv3.yayin.com.tr/postatv/postatv/playlist.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Altas TV",
    url: "https://edge1.socialsmart.tv/altastv/bant1/playlist.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Anadolu Net TV",
    url: "https://live.artidijitalmedya.com/artidijital_anadolunet/anadolunet/playlist.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "ATV",
    url: "https://rnttwmjcin.turknet.ercdn.net/lcpmvefbyo/atv/atv.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "BabyTV Turkiye",
    url: "https://saran-live.ercdn.net/babytv/index.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Beykent TV",
    url: "https://yayin30.haber100.com/live/beykenttv/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Bir TV",
    url: "https://live.artidijitalmedya.com/artidijital_birtv/birtv/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Bizimev TV",
    url: "https://mn-nl.mncdn.com/blutv_bizimev/bizimev_sd.smil/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Bloomberg HT",
    url: "https://ciner.daioncdn.net/bloomberght/bloomberght.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "BRTV",
    url: "https://live.artidijitalmedya.com/artidijital_brtv/brtv/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Cay TV",
    url: "https://edge1.socialsmart.tv/caytv/bant1/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Cekmeköy TV",
    url: "https://cdn-cekmekoybeltv.yayin.com.tr/cekmekoybeltv/cekmekoybeltv/playlist.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Cine 1",
    url: "https://live.artidijitalmedya.com/artidijital_cine1/cine1/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Cine5",
    url: "https://cdn-cine5tv.yayin.com.tr/cine5tv/cine5tv/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "CNBC-e",
    url: "https://stream.tvcdn.net/ekonomi/cnbc-e.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Deha TV",
    url: "https://live.artidijitalmedya.com/artidijital_dehatv/dehatv/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Deniz Postası TV",
    url: "https://live.artidijitalmedya.com/artidijital_denizpostasi/denizpostasi/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Dersim62 TV",
    url: "http://live.arkumedia.com:1935/dersim62tv/dersim62tv/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "DHA",
    url: "https://603c568fccdf5.streamlock.net/live/dhaweb1_C5efC/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Dim TV",
    url: "https://live.artidijitalmedya.com/artidijital_dimtv/dimtv/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Disney Jr. Turkiye",
    url: "https://saran-live.ercdn.net/disneyjunior/index.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Diyanet TV",
    url: "http://185.234.111.229:8000/play/a05j",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "DRT Denizli",
    url: "https://edge1.socialsmart.tv/drttv/bant1/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Edessa TV",
    url: "https://tv.digitalbox.xyz:19360/edessatv/edessatv.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Elmas TV",
    url: "https://5be5d840359c6.streamlock.net/elmas67tv/elmas67tv/chunklist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "ERTV",
    url: "https://live.artidijitalmedya.com/artidijital_ertv_new/ertv/playlist.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Euro D",
    url: "https://viamotionhsi.netplus.ch/live/eds/eurod/browser-HLS8/eurod.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Finans Turk TV",
    url: "https://yayin30.haber100.com/live/finansturk/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Flash TV",
    url: "https://mn-nl.mncdn.com/blutv_flashtv/live.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "GZT",
    url: "https://mn-nl.mncdn.com/gzttv/gzttv/playlist.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Haber Global",
    url: "http://185.234.111.229:8000/play/a05x",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Habertürk TV",
    url: "https://ciner-live.daioncdn.net/haberturktv/haberturktv.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Halk TV",
    url: "https://halktv-live.daioncdn.net/halktv/halktv.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Kanal 7",
    url: "https://kanal7-live.daioncdn.net/kanal7/kanal7.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Kanal D",
    url: "https://demiroren-live.daioncdn.net/kanald/kanald.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Kanal Hayat",
    url: "https://tbn02a.ltnschedule.com/hls/nx21i.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Kral Pop TV",
    url: "https://dogus-live.daioncdn.net/kralpoptv/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Kral TV",
    url: "https://dogus-live.daioncdn.net/kraltv/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Lalegul TV",
    url: "https://lbl.netmedya.net/hls/lalegultv.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Meltem TV",
    url: "https://vhxyrsly.rocketcdn.com/meltemtv/playlist.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Milyon TV",
    url: "https://sosyoapp-live.cdnnew.com/sosyo/buraya-bir-isim-verin.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "MTürk TV",
    url: "https://edge1.socialsmart.tv/muglaturk/bant1/playlist.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "NOW TV",
    url: "https://uycyyuuzyh.turknet.ercdn.net/nphindgytw/nowtv/nowtv.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "NTV",
    url: "https://dogus-live.daioncdn.net/ntv/ntv.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Number 1 Ask",
    url: "https://b01c02nl.mediatriple.net/videoonlylive/mtkgeuihrlfwlive/u_stream_5c9e18f9cea15_1/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Number 1 Damar",
    url: "https://b01c02nl.mediatriple.net/videoonlylive/mtkgeuihrlfwlive/u_stream_5c9e198784bdc_1/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Number 1 Dance",
    url: "https://b01c02nl.mediatriple.net/videoonlylive/mtkgeuihrlfwlive/u_stream_5c9e2aa8acf44_1/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Number 1 TV",
    url: "https://b01c02nl.mediatriple.net/videoonlylive/mtkgeuihrlfwlive/broadcast_5c9e17cd59e8b.smil/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "On4 TV",
    url: "https://edge1.socialsmart.tv/on4/bant1/playlist.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Power Dance",
    url: "https://livetv.powerapp.com.tr/dance/dance.smil/playlist.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Power Love",
    url: "https://livetv.powerapp.com.tr/plove/love.smil/playlist.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Power Plus",
    url: "https://livetv.powerapp.com.tr/pplustv/pplustv.smil/playlist.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Power Turk Akustik",
    url: "https://livetv.powerapp.com.tr/pturkakustik/akustik.smil/playlist.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Power Turk En Iyiler",
    url: "https://livetv.powerapp.com.tr/pturkeniyiler/eniyiler.smil/playlist.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Power Turk Slow",
    url: "https://livetv.powerapp.com.tr/pturkslow/slow.smil/playlist.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Power Turk Taptaze",
    url: "https://livetv.powerapp.com.tr/pturktaptaze/taptaze.smil/playlist.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Power TV",
    url: "https://livetv.powerapp.com.tr/powerTV/powerhd.smil/playlist.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Show TV",
    url: "https://ciner-live.daioncdn.net/showtv/showtv.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Sozcu TV",
    url: "http://185.234.111.229:8000/play/a00y",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Sports TV",
    url: "https://live.sportstv.com.tr/hls/low/sportstv.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Star TV",
    url: "https://dogus-live.daioncdn.net/startv/startv.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Tabii Spor 6",
    url: "https://vbtob9hyq58eiophct5qctxr2.medya.trt.com.tr/master.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Tarim TV",
    url: "https://content.tvkur.com/l/c7e1da7mm25p552d9u9g/master.m3u8",
    quality: "1080p",
    country: "TR"
  },
  // (Removed invalid object containing variable declaration inside array)
  {
    title: "TRT 3",
    url: "https://tv-trt3.live.trt.com.tr/master.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "TRT Arabi",
    url: "https://tv-trtarabi.medya.trt.com.tr/master.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "TRT Avaz",
    url: "https://tv-trtavaz.medya.trt.com.tr/master.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "TRT Diyanet Çocuk",
    url: "https://tv-trtdiyanetcocuk.medya.trt.com.tr/master.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "TRT EBA Ilkokul",
    url: "https://tv-e-okul00.medya.trt.com.tr/master.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "TRT EBA Lise",
    url: "https://tv-e-okul02.medya.trt.com.tr/master.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "TRT Spor Yildiz",
    url: "https://tv-trtspor2.medya.trt.com.tr/master.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "TRT Turk",
    url: "http://185.234.111.229:8000/play/a00h",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "TV 1",
    url: "https://edge1.socialsmart.tv/tv1/bant1/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "TV 4",
    url: "https://turkmedya-live.ercdn.net/tv4/tv4.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "TV 8",
    url: "https://tv8.daioncdn.net/tv8/tv8.m3u8?app=7ddc255a-ef47-4e81-ab14-c0e5f2949788&ce=3",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "TV 100",
    url: "https://tv100-live.daioncdn.net/tv100/tv100_1080p.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "TV 264",
    url: "https://b01c02nl.mediatriple.net/videoonlylive/mtdxkkitgbrckilive/broadcast_5ee244263fd6d.smil/playlist.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "TV A",
    url: "https://live.artidijitalmedya.com/artidijital_tva/tva/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "TVnet",
    url: "https://mn-nl.mncdn.com/tvnet/tvnet/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "TYT Turk",
    url: "https://cdn4.yayin.com.tr/tytturk/index.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "UçanKuş TV",
    url: "https://ucankus-live.cdnnew.com/ucankus/ucankus.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Ülke TV",
    url: "https://mn-nl.mncdn.com/blutv_ulketv2/live.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Ulusal Kanal",
    url: "https://stream.guventechnology.com:19360/ulusaltv/ulusaltv.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Urfa Natik TV",
    url: "https://live.artidijitalmedya.com/artidijital_urfanatiktv/urfanatiktv/playlist.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "ÜÜ TV 1",
    url: "https://uskudarunv.mediatriple.net/uskudarunv/uskudar1/playlist.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "ÜÜ TV Üsküdar Üniversitesi TV",
    url: "https://uskudarunv.mediatriple.net/uskudarunv/uskudar2/playlist.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "V TV",
    url: "https://serdar.tiviplayer.com/player/m3u8/65aae71c9b93f0965aaed3a92660d98b/65aae71c9b93f0965aaed3a92660d98b.m3u8",
    quality: "720p",
    country: "TR"
  },
  {
    title: "Woman TV",
    url: "https://embedlp.becdn.net/womantv.m3u8",
    quality: "1080p",
    country: "TR"
  },
  {
    title: "Yol TV",
    url: "https://stream.yol.tv:9443/medialive/yol.m3u8",
    quality: "720p",
    country: "TR"
  }
];

// Konverto turkishChannels në strukturën e duhur
const turkishChannelsFixed = turkishChannels.map((ch, idx) => ({
  id: `turkish_${idx}`,
  name: ch.title,
  url: ch.url,
  type: "tv",
  group: "Turqi",
  logo: ""
}));

// Pluto TV Germany channels (from de_pluto.m3u)
const plutoGermanyChannels = [
  { id: "plutode_0", name: "48 Hours", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/651432fa98020f000878b407/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_1", name: "90210", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/65a67dd13af63d0008257f17/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_2", name: "Action Sports", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5be1be871843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_3", name: "AKIBA PASS TV Anime: Sport", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/659e598ab9adc4000843c574/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_4", name: "Alle hassen Chris", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/622f6e1e2792150007e0b2ff/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_5", name: "American Dad!", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_6", name: "Ancient Aliens", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_7", name: "Bar Rescue", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_8", name: "Beverly Hills 90210", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_9", name: "Blue Bloods", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_10", name: "Bob Ross", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_11", name: "Buffy the Vampire Slayer", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_12", name: "CSI: Miami", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_13", name: "Family Guy", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_14", name: "Fringe", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_15", name: "Ghost Hunters", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_16", name: "Hell's Kitchen", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_17", name: "Hawaii Five-0", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_18", name: "Ink Master", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_19", name: "Jersey Shore", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_20", name: "Killer Inside: The Mind of Aaron Hernandez", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_21", name: "Law & Order", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_22", name: "MasterChef", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_23", name: "NCIS", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_24", name: "Nashville", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_25", name: "Paw Patrol", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_26", name: "Peppa Pig", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_27", name: "Perry Mason", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_28", name: "Rugrats", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_29", name: "SpongeBob SquarePants", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_30", name: "The Amazing Race", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_31", name: "The Office", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_32", name: "The Real World", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_33", name: "The Simpsons", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_34", name: "The X-Files", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_35", name: "Top Gear", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_36", name: "Two and a Half Men", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_37", name: "Unsolved Mysteries", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_38", name: "Wild 'N Out", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" },
  { id: "plutode_39", name: "Wipeout", url: "http://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5f4e4a7d1843b56328bc3ef1/master.m3u8", type: "tv", group: "Gjermani - Pluto TV", logo: "" }
];

// —— SHËNIM ——
// Për të rikthyer të gjitha kanalet, shto të gjitha grupet që ke pasur më parë:
// albanianChannels, kosovoChannels, islamicChannels, usChannels, germanChannels, swissChannels, radioChannels, hiphopChannels, channels, turkishChannelsFixed, religiousChannels, plutoChannels, etj.
// Shembull:
// window.items = [].concat(
//   albanianChannels,
//   kosovoChannels,
//   islamicChannels,
//   usChannels,
//   germanChannels,
//   swissChannels,
//   radioChannels,
//   hiphopChannels,
//   channels, // Gjermane
//   turkishChannelsFixed,
//   religiousChannels,
//   plutoChannels
// );

// Për momentin, rikthe të gjitha kanalet ekzistuese + turke + religjioze + Pluto TV
const radioChannels = [
  { id:"topalbania_https", name:"Top Albania Radio (HTTPS)", url:"https://stream.topalbaniaradio.com/topalbaniaradio.mp3", type:"radio", group:"Kombëtare", logo:"https://topalbaniaradio.com/wp-content/uploads/2020/05/topalbania.png", site:"https://topalbaniaradio.com/" },
  { id:"radiomariaal", name:"Radio Maria Albania", url:"https://stream.radiomaria.al:8443/rma", type:"radio", group:"Kombëtare", logo:"https://radiomaria.al/wp-content/uploads/2020/09/cropped-logo-1-192x192.png", site:"https://radiomaria.al/" },
  { id:"radiotravel", name:"Radio Travel", url:"https://live.radiotravel.al:8000/radiotravel", type:"radio", group:"Kombëtare", logo:"https://radiotravel.al/wp-content/uploads/2021/03/cropped-Logo-RT-2021-192x192.png", site:"https://radiotravel.al/" },
  { id:"radioplus", name:"Radio Plus", url:"https://stream.radioplus.al:8000/stream", type:"radio", group:"Kombëtare", logo:"https://radioplus.al/wp-content/uploads/2020/09/cropped-favicon-192x192.png", site:"https://radioplus.al/" },
  { id:"radiokorca", name:"Radio Korça", url:"https://stream.radiokorca.com:8000/radiokorca", type:"radio", group:"Shqipëri - Lokale", logo:"https://radiokorca.com/wp-content/uploads/2021/01/cropped-favicon-192x192.png", site:"https://radiokorca.com/" },
  { id:"bbcworldservice", name:"BBC World Service", url:"https://stream.live.vc.bbcmedia.co.uk/bbc_world_service", type:"radio", group:"Ndërkombëtare", logo:"https://upload.wikimedia.org/wikipedia/commons/5/5e/BBC_World_Service_Logo_2022.svg", site:"https://www.bbc.co.uk/worldserviceradio" },
  { id:"npr", name:"NPR News", url:"https://npr-ice.streamguys1.com/live.mp3", type:"radio", group:"Ndërkombëtare", logo:"https://media.npr.org/images/about-npr/NPR-logo_icon.png", site:"https://www.npr.org/" },
  { id:"franceinter", name:"France Inter", url:"https://icecast.radiofrance.fr/franceinter-midfi.mp3", type:"radio", group:"Ndërkombëtare", logo:"https://upload.wikimedia.org/wikipedia/commons/6/6b/France_Inter_logo_2021.svg", site:"https://www.franceinter.fr/" },
  { id:"classicfm", name:"Classic FM (UK)", url:"https://media-ice.musicradio.com/ClassicFMMP3", type:"radio", group:"Ndërkombëtare", logo:"https://upload.wikimedia.org/wikipedia/commons/2/2e/Classic_FM_logo_2019.svg", site:"https://www.classicfm.com/" },
  { id:"hot108", name:"Hot 108 Jamz (NYC)", url:"https://ais-edge105-live365-dal02.cdnstream.com/a53879", type:"radio", group:"Hiphop/Rap", logo:"https://www.hot108.com/favicon.ico", site:"https://www.hot108.com/" },
  { id:"181hiphop", name:"181.FM - The Beat (HipHop/R&B)", url:"https://listen.181fm.com/181-beat_128k.mp3", type:"radio", group:"Hiphop/Rap", logo:"https://www.181.fm/images/favicon.ico", site:"https://www.181.fm/" },
  { id:"bigfmhiphop", name:"bigFM Hip-Hop", url:"https://streams.bigfm.de/bigfm-hiphop-128-mp3", type:"radio", group:"Hiphop/Rap - Gjermani", logo:"https://www.bigfm.de/favicon.ico", site:"https://www.bigfm.de/webradio/hiphop" },
  { id:"radiohiphopbasel", name:"Radio Hip Hop Basel", url:"https://stream.laut.fm/hiphopbasel", type:"radio", group:"Hiphop/Rap - Zvicër", logo:"https://assets.laut.fm/hiphopbasel/hiphopbasel.png", site:"https://www.laut.fm/hiphopbasel" },
  { id:"urbanradio", name:"Urban Radio Hip-Hop/R&B", url:"https://ais-edge106-live365-dal02.cdnstream.com/a52013", type:"radio", group:"Hiphop/Rap", logo:"https://www.urbanradio.com/favicon.ico", site:"https://www.urbanradio.com/" },
  { id:"powerhitzpure", name:"Powerhitz - Pure Hip Hop & R&B", url:"https://ais-edge101-live365-dal02.cdnstream.com/a51812", type:"radio", group:"Hiphop/Rap", logo:"https://www.powerhitz.com/favicon.ico", site:"https://www.powerhitz.com/" },
  { id:"defjay", name:"DEFJAY - 100% R&B!", url:"https://streams.defjay.com/defjay.mp3", type:"radio", group:"Hiphop/Rap - Gjermani", logo:"https://www.defjay.com/favicon.ico", site:"https://www.defjay.com/" },
  { id:"lautfmblazin", name:"laut.fm Blazin Hot Hiphop", url:"https://stream.laut.fm/blazin", type:"radio", group:"Hiphop/Rap", logo:"https://assets.laut.fm/blazin/blazin.png", site:"https://www.laut.fm/blazin" },
  { id:"radiohiphop", name:"Radio Hip Hop (FR)", url:"https://stream.laut.fm/hiphop", type:"radio", group:"Hiphop/Rap - Francë", logo:"https://assets.laut.fm/hiphop/hiphop.png", site:"https://www.laut.fm/hiphop" },
  { id:"radioenergyurban", name:"Energy Urban (CH)", url:"https://energyurban.ice.infomaniak.ch/energyurban-high.mp3", type:"radio", group:"Hiphop/Rap - Zvicër", logo:"https://www.energy.ch/favicon.ico", site:"https://www.energy.ch/urban" }
];

// Albanian TV channels (from al.m3u)
const albanianChannels = [
  { id: "albkanalemusic", name: "AlbKanale Music TV (720p)", url: "https://albportal.net/albkanalemusic.m3u8", type: "tv", group: "Shqipëri", logo: "https://i.imgur.com/JdKxscs.png" },
  { id: "bangbang", name: "Bang Bang (480p)", url: "https://digitalb-live.morescreens.com/DAL_1_004/playlist.m3u8?id=DAL_1_004&video_id=16377&token=142cda7d50870275a9ca7988ff001b32ab30709b&authority_instance_id=spectar-prd-digitalb&profile_id=1&application_installation_id=1&uuid=backoffice1&subscriber_id=1&application_id=backoffice1&detected_delivery_method=hls&playlist_template=nginx&ps=6ca6054c4d6f9fafd6e3202ad620d4cc30ee45fdbbf1526cab3fdcac143b283d2f7251b3babf442b3a4fb90820abcc0cfaab2bff9a76799adc92b09fa0151f25&vh=7edb2a069c1d9e1872251cc87e99c568dfd18769f97905bd1dcaf519b259c970f880a1c43b6a7392ac496426adb0e55a2f6dbb06981536af9c1c987416282783", group: "Shqipëri", logo: "https://i.imgur.com/lpS2PpS.png", type: "tv" },
  { id: "cna", name: "CNA (1080p)", url: "https://live1.mediadesk.al/cnatvlive.m3u8", group: "Shqipëri", logo: "https://codeit.al/wp-content/uploads/2020/08/cna.png", type: "tv" },
  { id: "cufo", name: "Cufo", url: "https://digitalb-live.morescreens.com/DAL_1_005/playlist.m3u8?id=DAL_1_005&video_id=12498&token=142cda7d50870275a9ca7988ff001b32ab30709b&authority_instance_id=spectar-prd-digitalb&profile_id=1&application_installation_id=1&uuid=backoffice1&subscriber_id=1&application_id=backoffice1&detected_delivery_method=hls&playlist_template=nginx&ps=94d0066599d8f74d1c090e93ac4617b6491d3629d2e2d770870fcef1f7effa25b204aa53b3821da5e9e65bee8e94331bcae2cb344d0739ca3a938b4ef2051cc8&vh=7ab82e63aae8510c6b37ea16da502e54e441a5a1a88bce0c8ed63da99bce948d86253d64ae00424dda8b9c8b6e2cd0f6cd79d8b0a56e10759210cdf4f6761d11", group: "Shqipëri", logo: "https://i.imgur.com/GbBHtwD.png", type: "tv" },
  { id: "euronewsalbania", name: "Euronews Albania", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-live/2dw-zuf-1c9-pxu/index.m3u8", group: "Shqipëri", logo: "https://i.imgur.com/Skf6vdi.png", type: "tv" },
  { id: "mcntv", name: "MCN TV (720p)", url: "https://mcn24.tv/hidden_stream/mcntv.m3u8", group: "Shqipëri", logo: "https://i.imgur.com/bcAMVVk.png", type: "tv" },
  { id: "news24", name: "News 24 (392p) [Not 24/7]", url: "https://tv.balkanweb.com/news24/livestream/playlist.m3u8", group: "Shqipëri", logo: "https://i.imgur.com/eG33jue.png", type: "tv" },
  { id: "oranews", name: "Ora News (720p)", url: "https://live1.mediadesk.al/oranews.m3u8", group: "Shqipëri", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Ora_News_%28Albania%29.svg/512px-Ora_News_%28Albania%29.svg.png", type: "tv" },
  { id: "panoramatv", name: "Panorama TV (720p)", url: "https://tv.panorama.com.al/panorama/livestream/playlist.m3u8", group: "Shqipëri", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Panorama_logo.svg/512px-Panorama_logo.svg.png", type: "tv" },
  { id: "reporttv", name: "Report TV (720p)", url: "https://deb10stream.duckdns.org/hls/stream.m3u8", group: "Shqipëri", logo: "https://i.imgur.com/C9lM1KP.png", type: "tv" },
  { id: "vizionplus", name: "Vizion Plus (1080p)", url: "https://tringliveviz.akamaized.net/delta/105/out/u/qwaszxerdfcvrtryuy.m3u8", group: "Shqipëri", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Vizion_Plus.svg/512px-Vizion_Plus.svg.png", type: "tv" },
  { id: "zjarrtv", name: "Zjarr TV (360p)", url: "https://zjarr.future.al/hls/playlist.m3u8", group: "Shqipëri", logo: "https://i.imgur.com/hNuWZWe.png", type: "tv" }
];

// Kosovo TV channels (from xk.m3u)
const kosovoChannels = [
  { id: "kohavision", name: "Kohavision", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-livestream/lj9-pxm-o53-rp0/tracks-v4a1/mono.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/LOi9yma.png" },
  { id: "peacetvalbanian", name: "Peace TV Albanian (360p) [Not 24/7]", url: "http://82.114.67.178:8081/hls/PeaceTV.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/cK3KATX.png" },
  { id: "rtk1", name: "RTK 1", url: "https://viamotionhsi.netplus.ch/live/eds/rtk1/browser-HLS8/rtk1.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/KTcWcO6.png" },
  { id: "rtk2", name: "RTK 2", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-livestream/rtk2/index.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/g6k6xyO.png" },
  { id: "rtk3", name: "RTK 3", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-livestream/rtk3/index.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/Ut9VcT3.png" },
  { id: "rtv21", name: "RTV21", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-live/2cz-npl-jfn-9he/tracks-v2a1/mono.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/AqQltGh.png" },
  { id: "t7", name: "T7", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-livestream-specific/1z8-byc-4ee-lc9/index.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/b7FvSJj.png" },
  { id: "tvarberia1", name: "TV Arbëria 1 (720p)", url: "https://yayin30.haber100.com/live/rtvarberia/playlist.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/zLRzyVS.png" },
  { id: "tvarberia2", name: "TV Arbëria 2 (720p)", url: "https://ssh101.bozztv.com/ssh101/rtvarberia2/playlist.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/zLRzyVS.png" },
  { id: "tvarberia3femije", name: "TV Arbëria 3 Fëmijë (720p)", url: "https://ssh101.bozztv.com/ssh101/rtvarberia3/playlist.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/zLRzyVS.png" },
  { id: "tvarberia4muzike", name: "TV Arbëria 4 Muzikë (720p)", url: "https://ssh101.bozztv.com/ssh101/rtvarberia4/playlist.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/zLRzyVS.png" },
  { id: "tvarberiaretrohits", name: "TV Arbëria Retro Hits (720p)", url: "https://ssh101.bozztv.com/ssh101/rtvarberiaretro/playlist.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/zLRzyVS.png" },
  { id: "tvarta", name: "TV Arta", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-live/mps-vgx-u9p-qv1/index.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/MAhJkK9.png" },
  { id: "tvdielli", name: "TV Dielli (720p) [Not 24/7]", url: "http://stream.tvdielli.com:8081/dielli/index.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/kLl3ar5.png" },
  { id: "tvopoja", name: "TV Opoja (720p) [Not 24/7]", url: "http://ip.opoja.tv:1935/tvopoja/tvopoja/playlist.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/hxi4Qiq.png" },
  { id: "tvprizreni", name: "TV Prizreni", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-live/5m0-cok-g5z-1xi/index.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/hvtJwOO.png" },
  { id: "tvsyri", name: "TV Syri (720p)", url: "https://gjirafa-video-live.gjirafa.net/gjvideo-live/xej-xnb-ba0-kup/index.m3u8", type: "tv", group: "Kosovë", logo: "https://i.imgur.com/ZQuFosn.png" }
];

window.items = [].concat(
  albanianChannels,
  kosovoChannels,
  radioChannels,
  channels,
  turkishChannelsFixed,
  plutoGermanyChannels
);

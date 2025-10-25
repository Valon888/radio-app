// Radio Channels
const radioChannels = [
  // Radio Publike
  { id: "tirana1", name: "Radio Tirana 1", url: "http://91.187.121.202:8000/RadioTirana1", type: "radio", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b2/Radio_Tirana_logo.svg", group: "Publike" },
  { id: "tirana2", name: "Radio Tirana 2", url: "http://91.187.121.202:8000/RadioTirana2", type: "radio", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b2/Radio_Tirana_logo.svg", group: "Publike" },
  { id: "tirana3", name: "Radio Tirana 3", url: "http://91.187.121.202:8000/RadioTirana3", type: "radio", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b2/Radio_Tirana_logo.svg", group: "Publike" },
  
  // Radio Kombëtare
  { id: "topalbania", name: "Top Albania Radio", url: "https://stream.topalbaniaradio.com/topalbaniaradio.mp3", type: "radio", logo: "https://topalbaniaradio.com/wp-content/uploads/2020/05/topalbania.png", group: "Kombëtare" },
  { id: "radioklan", name: "Radio Klan", url: "http://live.radioklan.com:8000/", type: "radio", logo: "https://klankosova.tv/wp-content/uploads/2021/06/radioklan.png", group: "Kombëtare" },
  
  // Radio Rajonale
  { id: "alporadio", name: "Alpo Radio", url: "http://94.23.66.155:9304/", type: "radio", logo: "https://alporadio.al/wp-content/uploads/2021/01/logo.png", group: "Rajonale" },
  
  // Radio Muzikë
  { id: "clubfm", name: "Club FM", url: "http://5.39.71.159:8100/", type: "radio", logo: "https://clubfm.al/wp-content/uploads/2019/06/logo.png", group: "Muzikë" },
  { id: "radioora", name: "Radio Ora", url: "http://s1.voscast.com:10484/", type: "radio", logo: "https://radioora.al/wp-content/uploads/2018/01/cropped-favicon-32x32.png", group: "Muzikë" },
  { id: "radiotravel", name: "Radio Travel", url: "http://stream.radiosolutions.it:8000/radiotravel", type: "radio", logo: "https://radiotravel.al/wp-content/uploads/2020/03/RadioTravelLogo.png", group: "Muzikë" },
  { id: "boomboom", name: "Boom Boom Radio", url: "http://94.23.66.155:9306/", type: "radio", logo: "https://boomboomradio.al/wp-content/uploads/2020/07/logo.png", group: "Muzikë" },
  { id: "starfm", name: "Radio Star FM", url: "http://94.23.66.155:9302/", type: "radio", logo: "https://starfm.al/wp-content/uploads/2018/12/logo.png", group: "Muzikë" },
  
  // Radio Diaspora
  { id: "radioemigranti", name: "Radio Emigranti", url: "http://94.23.67.20:9996/", type: "radio", logo: "https://radioemigranti.com/wp-content/uploads/2021/04/Logo.png", group: "Diaspora" },
  
  // Radio Fetare
  { id: "pendimi1", name: "Radio Pendimi", url: "http://www.rtvpendimi.com:8014/stream", type: "radio", logo: "https://i.imgur.com/QmOLjT4.png", group: "Fetare" },
  { id: "radioislame", name: "Radio Islame", url: "http://stream.radioislame.com:8050/live", type: "radio", logo: "https://i.imgur.com/QZJhFIk.png", group: "Fetare" },
  
  // Radio Kosovë
  { id: "radiodukagjini", name: "Radio Dukagjini", url: "http://s3.voscast.com:8880/", type: "radio", logo: "https://i.imgur.com/R40ZNtR.png", group: "Kosovë" },
  { id: "radiokosova", name: "Radio Kosova", url: "http://82.114.72.2:8088/", type: "radio", logo: "https://i.imgur.com/lQiVytR.png", group: "Kosovë" },
  
  // Radio Ndërkombëtare
  { id: "bbcworldservice", name: "BBC World Service", url: "https://stream.live.vc.bbcmedia.co.uk/bbc_world_service", type: "radio", logo: "https://i.imgur.com/GmqZFgM.png", group: "Ndërkombëtare" },
  { id: "europaplus", name: "Europa Plus", url: "http://ep128.hostingradio.ru:8030/ep128", type: "radio", logo: "https://i.imgur.com/Cfypyzm.png", group: "Ndërkombëtare" }
];

// Export for use in other scripts
if (typeof module !== 'undefined') {
  module.exports = { radioChannels };
}

// For browser use
if (typeof window !== 'undefined') {
  window.radioChannels = radioChannels;
  console.log('[Mini IPTV] Radio channels loaded from radio-channels.js:', radioChannels.length);
}

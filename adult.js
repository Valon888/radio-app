
// ========================
// Adult content unlock logic
// ========================
let adultUnlocked = false;

function applyFilters(){
  const q = searchEl.value.trim().toLowerCase();
  const t = typeSel.value; // "", "tv", "radio"
  filtered = items.filter(it=>{
    if (it.adult && !adultUnlocked) return false; // fshih +18 pa PIN
    const matchQ = !q || [it.name,it.group,it.type].filter(Boolean).join(' ').toLowerCase().includes(q);
    const matchT = !t || (it.type||'tv')===t;
    return matchQ && matchT;
  });
  if (filtered.length && !filtered.includes(items[currentIndex])) currentIndex = 0;
  renderList();
}

// mini-hash (për demo). Për prodhim përdor SubtleCrypto (SHA-256).
const hash = s => [...new TextEncoder().encode(s)]
  .reduce((a,b)=>((a<<5)-a+b)|0,0).toString();

const PIN_KEY = "adult_pin_hash";
const UNLOCK_KEY = "adult_unlocked";

document.getElementById('unlockAdult').onclick = async ()=>{
  const existing = localStorage.getItem(PIN_KEY);
  const pin = prompt(existing ? "Shkruaj PIN-in:" : "Krijo PIN të ri (4-6 shifra):");
  if (!pin) return;

  if (!/^[0-9]{4,6}$/.test(pin)) { alert("PIN duhet të jetë 4–6 shifra."); return; }

  if (!existing){
    localStorage.setItem(PIN_KEY, hash(pin));
    adultUnlocked = true;
    localStorage.setItem(UNLOCK_KEY, "1");
    applyFilters();
    alert("PIN u vendos. Kategoria 18+ u zhbllokua.");
  } else {
    if (hash(pin) === existing){
      adultUnlocked = true;
      localStorage.setItem(UNLOCK_KEY, "1");
      applyFilters();
    } else {
      alert("PIN i pasaktë.");
    }
  }
};

// rikthe statusin në hapje
adultUnlocked = localStorage.getItem(UNLOCK_KEY) === "1";
applyFilters();
function lockAdult(){
  adultUnlocked = false;
  localStorage.removeItem(UNLOCK_KEY);
  applyFilters();
}

// ========================
// Channel list (TV & Radio)
// ========================
let items = [
  // Shembull 18+
  { id: "adult-sample", name: "Shembull 18+", url: "https://…/stream.m3u8", type: "tv", group: "Adults", adult: true, logo: "" },

  // TV prova (HLS)
  { id:"mux", name:"Mux Test TV", url:"https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type:"tv", group:"Test", logo:"" },
  { id:"sintel", name:"Sintel HLS", url:"https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8", type:"tv", group:"Film", logo:"" },

  // RADIO — ekzistuese
  { id:"tirana1", name:"Radio Tirana 1", url:"http://91.187.121.202:8000/RadioTirana1", type:"radio", group:"Publike", logo:"https://upload.wikimedia.org/wikipedia/commons/b/b2/Radio_Tirana_logo.svg" },
  { id:"tirana2", name:"Radio Tirana 2", url:"http://91.187.121.202:8000/RadioTirana2", type:"radio", group:"Publike", logo:"https://upload.wikimedia.org/wikipedia/commons/b/b2/Radio_Tirana_logo.svg" },
  { id:"tirana3", name:"Radio Tirana 3", url:"http://91.187.121.202:8000/RadioTirana3", type:"radio", group:"Publike", logo:"https://upload.wikimedia.org/wikipedia/commons/b/b2/Radio_Tirana_logo.svg" },
  { id:"topalbania", name:"Top Albania Radio", url:"https://stream.topalbaniaradio.com/topalbaniaradio.mp3", type:"radio", group:"Kombëtare", logo:"https://topalbaniaradio.com/wp-content/uploads/2020/05/topalbania.png" },
  { id:"clubfm", name:"Club FM", url:"http://5.39.71.159:8100/", type:"radio", group:"Muzikë", logo:"https://clubfm.al/wp-content/uploads/2019/06/logo.png" },
  { id:"radioora", name:"Radio Ora", url:"http://s1.voscast.com:10484/;", type:"radio", group:"Muzikë", logo:"https://radioora.al/wp-content/uploads/2018/01/cropped-favicon-32x32.png" },
  { id:"radioemigranti", name:"Radio Emigranti", url:"http://94.23.67.20:9996/;", type:"radio", group:"Diaspora", logo:"https://radioemigranti.com/wp-content/uploads/2021/04/Logo.png" },
  { id:"radioklan", name:"Radio Klan", url:"http://live.radioklan.com:8000/;", type:"radio", group:"Kombëtare", logo:"https://upload.wikimedia.org/wikipedia/commons/3/3f/TV_Klan_logo.png" },
  { id:"radiotravel", name:"Radio Travel", url:"http://stream.radiosolutions.it:8000/radiotravel", type:"radio", group:"Muzikë", logo:"https://radiotravel.al/wp-content/uploads/2020/03/RadioTravelLogo.png" },
  { id:"alporadio", name:"Alpo Radio", url:"http://94.23.66.155:9304/;", type:"radio", group:"Rajonale", logo:"https://alporadio.al/wp-content/uploads/2021/01/logo.png" },
  { id:"boomboom", name:"Boom Boom Radio", url:"http://94.23.66.155:9306/;", type:"radio", group:"Muzikë", logo:"https://boomboomradio.al/wp-content/uploads/2020/07/logo.png" },
  { id:"starfm", name:"Radio Star FM", url:"http://94.23.66.155:9302/;", type:"radio", group:"Muzikë", logo:"https://starfm.al/wp-content/uploads/2018/12/logo.png" },

  // —— KANALE / RADIO FETARE (Islame & të Krishtera) ——
  { id:"radioselam", name:"Radio Selam", url:"http://94.23.67.20:9994/;", type:"radio", group:"Islame", logo:"" },
  { id:"radiopendimi", name:"Radio Pendimi", url:"http://91.187.121.202:8000/pendimi", type:"radio", group:"Islame", logo:"" },
  { id:"radiokristi", name:"Radio Kristi", url:"http://94.23.67.20:9988/;", type:"radio", group:"E Krishterë", logo:"" },
  { id:"radiovellazeria", name:"Radio Vëllazëria", url:"http://94.23.67.20:9992/;", type:"radio", group:"E Krishterë", logo:"" },
  { id:"tvshpresa", name:"TV Shpresa", url:"http://stream.tvshpresa.org/live/playlist.m3u8", type:"tv", group:"E Krishterë", logo:"" },

  // —— KANALE GJERMANE (Filma & Fëmijë) ——
  { id:"ardone", name:"ARD One", url:"https://mcdn.daserste.de/daserste/de/master.m3u8", type:"tv", group:"Gjermani - Filma", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/One_Logo_2016.svg/200px-One_Logo_2016.svg.png" },
  { id:"zdfneo", name:"ZDF Neo", url:"https://zdf-hls-15.akamaized.net/hls/live/2016498/de/high/master.m3u8", type:"tv", group:"Gjermani - Filma", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/ZDFneo_2017_logo.svg/200px-ZDFneo_2017_logo.svg.png" },
  { id:"arte", name:"Arte DE", url:"https://arte-cdn.akamaized.net/am/arte_de/master.m3u8", type:"tv", group:"Gjermani - Filma", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Arte-logo.svg/200px-Arte-logo.svg.png" },
  { id:"kika", name:"KIKA", url:"https://kikade-lh.akamaihd.net/i/kikade_1@816548/master.m3u8", type:"tv", group:"Gjermani - Fëmijë", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/KiKA_Logo_2012.svg/200px-KiKA_Logo_2012.svg.png" },
  { id:"ric", name:"RiC TV", url:"http://ric-live.de/live/smil:ric.smil/playlist.m3u8", type:"tv", group:"Gjermani - Fëmijë", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/RiC_logo.svg/200px-RiC_logo.svg.png" }
];
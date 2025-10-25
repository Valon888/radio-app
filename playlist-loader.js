/**
 * Unified Playlist Loader for Mini IPTV
 * This script handles loading multiple playlist files and unifying them.
 */

// Deklarim i listave të M3U files për të ngarkuar
const playlistFiles = [
  // Listat e vendeve
  'ae.m3u',             // Emiratet e Bashkuara Arabe
  'al.m3u',             // Shqipëri
  'arab.m3u',           // Kanalet Arabe
  'au.m3u',             // Australi
  'au_samsung.m3u',     // Australi Samsung TV Plus
  'de.m3u',             // Gjermani
  'de_rakuten.m3u',     // Gjermani Rakuten TV
  'de_samsung.m3u',     // Gjermani Samsung TV Plus
  'fr.m3u',             // Francë
  'ge.m3u',             // Gjeorgji
  'hr.m3u',             // Kroaci
  'it.m3u',             // Itali
  'mx_pluto.m3u',       // Meksikë Pluto TV
  'religious.m3u',      // Kanale Fetare
  'sa.m3u',             // Arabia Saudite
  'si_xploretv.m3u',    // Sloveni Xplore TV
  'tr.m3u',             // Turqi
  'tr_onetv.m3u',       // Turqi One TV
  'tt.m3u',             // Trinidad dhe Tobago
  'tur.m3u',            // Kanale Turke Shtesë
  'uk.m3u',             // Mbretëria e Bashkuar
  'uk (1).m3u',         // Mbretëria e Bashkuar (alternativ)
  'us.m3u',             // Shtetet e Bashkuara
  'us_canelatv.m3u',    // SHBA Canela TV
  'us_cineversetv.m3u', // SHBA Cineverse TV
  'us_firetv.m3u',      // SHBA Fire TV
  'us_plex.m3u',        // SHBA Plex
  'us_xumo.m3u',        // SHBA Xumo
  'xk.m3u',             // Kosovë
  'za_freevisiontv.m3u',// Afrika e Jugut

  // Playlists të tjerë
  'index.country.m3u',     // Indeksi sipas vendeve
  'index.m3u',             // Indeksi i përgjithshëm
  'playlist_albania.m3u8', // Playlist Shqipëri
  'playlist_zz_movies.m3u8', // Playlist Filma
  'playlist_zz_vod_it.m3u8'  // Playlist VOD Itali
];

// Cache për të mbajtur playlists e ngarkuar
const playlistCache = new Map();

/**
 * Funksioni kryesor për ngarkimin e të gjitha playlist-ave
 * Eksportuar për t'u përdorur nga UI
 */
async function loadAllPlaylists() {
  console.log('[Playlist Loader] Duke filluar ngarkimin e të gjitha playlist-ave...');
  
  const startTime = performance.now();
  const loadingStatus = document.createElement('div');
  loadingStatus.className = 'loading-status';
  loadingStatus.innerHTML = '<div class="loading-spinner"></div> Duke ngarkuar listat e kanaleve...';
  document.body.appendChild(loadingStatus);
  
  let totalChannelsLoaded = 0;
  const allChannels = [];
  const failedFiles = [];
  
  // Nëse është kërkuar të pastrohet cache
  if (window.playlistLoader && window.playlistLoader.clearCache) {
    console.log('[Playlist Loader] Duke pastruar cache-in e playlist-ave...');
    playlistCache.clear();
    window.playlistLoader.clearCache = false;
  }
  
  // Ngarko të gjitha M3U files paralelisht për performancë të mirë
  const loadPromises = playlistFiles.map(async (file) => {
    try {
      // Kontrollo nëse playlist është në cache dhe nëse nuk kërkohet rifreskim
      if (playlistCache.has(file) && !window.playlistLoader?.clearCache) {
        const cachedChannels = playlistCache.get(file);
        console.log(`[Playlist Loader] ${file}: ${cachedChannels.length} kanale nga cache`);
        return cachedChannels;
      }
      
      // Ngarko playlist nga file
      const response = await fetch(file, { cache: 'no-store' });
      
      if (!response.ok) {
        console.warn(`[Playlist Loader] Gabim në ngarkimin e ${file}: ${response.status} ${response.statusText}`);
        failedFiles.push(file);
        return [];
      }
      
      const content = await response.text();
      const channels = parseM3UContent(content, file);
      
      // Ruaj në cache
      playlistCache.set(file, channels);
      
      console.log(`[Playlist Loader] ${file}: ${channels.length} kanale të ngarkuara`);
      loadingStatus.innerHTML = `<div class="loading-spinner"></div> Duke ngarkuar: ${file} (${channels.length} kanale)`;
      
      return channels;
    } catch (error) {
      console.error(`[Playlist Loader] Gabim në ngarkimin e ${file}:`, error);
      failedFiles.push(file);
      return [];
    }
  });
  
  // Prit që të gjitha ngarkimet të përfundojnë
  const results = await Promise.all(loadPromises);
  
  // Bashko të gjitha rezultatet në një array të vetme
  results.forEach(channels => {
    if (Array.isArray(channels)) {
      totalChannelsLoaded += channels.length;
      allChannels.push(...channels);
    }
  });
  
  // Largo statusin e ngarkimit
  document.body.removeChild(loadingStatus);
  
  const endTime = performance.now();
  const loadTime = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`[Playlist Loader] Ngarkimi përfundoi në ${loadTime} sekonda.`);
  console.log(`[Playlist Loader] Totali: ${totalChannelsLoaded} kanale nga ${playlistFiles.length - failedFiles.length}/${playlistFiles.length} files.`);
  
  if (failedFiles.length > 0) {
    console.warn('[Playlist Loader] Files që dështuan:', failedFiles.join(', '));
  }
  
  // Kthe rezultatin e kombinuar
  return processChannels(allChannels);
}

/**
 * Parsoj përmbajtjen M3U në një listë kanalesh
 * @param {string} content - Përmbajtja e file M3U
 * @param {string} sourceName - Emri i file burimit për grupimin e kanaleve
 * @returns {Array} - Lista e kanaleve të parsuar
 */
function parseM3UContent(content, sourceName) {
  const lines = content.split(/\\r?\\n/).filter(line => line.trim());
  const channels = [];
  let meta = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('#EXTINF')) {
      // Nxirr informacionin e kanalit nga rreshti #EXTINF
      const nameMatch = line.match(/,(.+)$/);
      const tvgIdMatch = line.match(/tvg-id="([^"]+)"/);
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      const groupMatch = line.match(/group-title="([^"]+)"/);
      const qualityMatch = line.match(/\\((\\d+p)\\)/);
      
      if (nameMatch && i + 1 < lines.length) {
        const url = lines[i + 1].trim();
        
        // Nëse URL është valide
        if (url && !url.startsWith('#')) {
          // Përcakto nëse është radio
          const isRadio = 
            (url.match(/\\.(mp3|aac|ogg|pls|m3u)($|\\?)/i)) || 
            (groupMatch && groupMatch[1].toLowerCase().includes('radio')) ||
            (nameMatch[1].toLowerCase().includes('radio'));
          
          // Krijo ID unike për kanalin
          const channelId = tvgIdMatch 
            ? tvgIdMatch[1] 
            : `${isRadio ? 'radio' : 'tv'}_${sourceName.replace(/\\W/g, '')}_${channels.length}`;
          
          // Detekto grupin për kanalin
          let group = groupMatch ? groupMatch[1] : '';
          
          // Nëse nuk ka grup të definuar, përdor emrin e burimit
          if (!group) {
            // Ekstrakto emrin e vendit nga emri i file
            const countryCode = sourceName.replace(/\\.m3u8?$/i, '').split('_')[0];
            
            // Konverto kodet e vendeve në emra
            switch (countryCode.toLowerCase()) {
              case 'al': group = 'Shqipëri'; break;
              case 'xk': group = 'Kosovë'; break;
              case 'de': group = 'German'; break;
              case 'tr': case 'tur': group = 'Türkiye'; break;
              case 'us': group = 'USA'; break;
              case 'uk': group = 'United Kingdom'; break;
              case 'fr': group = 'France'; break;
              case 'au': group = 'Australia'; break;
              case 'ae': group = 'UAE'; break;
              case 'it': group = 'Italy'; break;
              case 'ge': group = 'Georgia'; break;
              case 'si': group = 'Slovenia'; break;
              case 'za': group = 'South Africa'; break;
              case 'sa': group = 'Saudi Arabia'; break;
              case 'mx': group = 'Mexico'; break;
              case 'hr': group = 'Croatia'; break;
              case 'tt': group = 'Trinidad & Tobago'; break;
              default: group = sourceName.replace(/\\.m3u8?$/i, ''); break;
            }
            
            // Për rastet specifike
            if (sourceName.includes('samsung')) group += ' Samsung TV+';
            if (sourceName.includes('pluto')) group += ' Pluto TV';
            if (sourceName.includes('rakuten')) group += ' Rakuten TV';
            if (sourceName.includes('plex')) group += ' Plex';
            if (sourceName.includes('xumo')) group += ' Xumo';
          }
          
          // Kontrollo për kanale specifike
          if (nameMatch[1].toLowerCase().includes('islam') || 
              (group && group.toLowerCase().includes('islam'))) {
            group = 'Fetare Islame';
          }
          
          if (nameMatch[1].toLowerCase().includes('kids') || 
              nameMatch[1].toLowerCase().includes('fëmijë') || 
              (group && (group.toLowerCase().includes('kids') || 
                        group.toLowerCase().includes('fëmijë')))) {
            if (countryCode.toLowerCase() === 'al' || countryCode.toLowerCase() === 'xk') {
              group = 'Fëmijë Shqip';
            } else {
              group = 'Fëmijë';
            }
          }
          
          // Nëse është file 'xk.m3u', siguro që kanalet të kenë grup "Kosovë"
          if (sourceName === 'xk.m3u' && group !== 'Fëmijë Shqip') {
            group = 'Kosovë';
          }
          
          // Merr cilësinë nga lloji i file-it ose nga tag-u specific
          const quality = qualityMatch ? qualityMatch[1] : '';
          
          channels.push({ 
            id: channelId, 
            name: nameMatch[1].trim(), 
            url: url, 
            type: isRadio ? 'radio' : 'tv', 
            group: group, 
            logo: logoMatch ? logoMatch[1] : '', 
            quality: quality,
            source: sourceName
          });
        }
      }
    }
  }
  
  return channels;
}

/**
 * Përpunoj listën e kanaleve për të hequr dublikatat dhe përparësuar grupet
 * @param {Array} channels - Lista e kanaleve për të përpunuar
 * @returns {Array} - Lista e kanaleve e përpunuar
 */
function processChannels(channels) {
  if (!Array.isArray(channels) || channels.length === 0) {
    return [];
  }
  
  console.log(`[Playlist Loader] Përpunim i ${channels.length} kanaleve...`);
  
  // Hiq dublikatat me URL identike
  const uniqueUrls = new Set();
  const uniqueChannels = channels.filter(channel => {
    if (!channel || !channel.url) return false;
    
    const urlKey = `${channel.url}_${channel.type}`;
    if (uniqueUrls.has(urlKey)) return false;
    
    uniqueUrls.add(urlKey);
    return true;
  });
  
  console.log(`[Playlist Loader] Pas heqjes së dublikatave: ${uniqueChannels.length} kanale`);
  
  // Ensure Kosovo channels are present
  console.log('[Playlist Loader] Checking for Kosovo channels...');
  const kosovoChannels = uniqueChannels.filter(channel => 
    channel.group === 'Kosovë' || 
    channel.source === 'xk.m3u'
  );
  
  if (kosovoChannels.length > 0) {
    console.log(`[Playlist Loader] Found ${kosovoChannels.length} Kosovo channels`);
  } else {
    console.warn('[Playlist Loader] No Kosovo channels found! Will attempt to load them directly.');
    // Try to force loading xk.m3u if it wasn't loaded already
    if (!playlistFiles.includes('xk.m3u') || !failedFiles || !failedFiles.includes('xk.m3u')) {
      // Create a dedicated request for the Kosovo channels
      return fetch('xk.m3u', { cache: 'no-store' })
        .then(response => {
          if (response.ok) return response.text();
          throw new Error(`Failed to fetch xk.m3u: ${response.status} ${response.statusText}`);
        })
        .then(content => {
          const xkChannels = parseM3UContent(content, 'xk.m3u');
          if (xkChannels.length > 0) {
            // Add to both uniqueChannels and cache
            uniqueChannels.push(...xkChannels);
            playlistCache.set('xk.m3u', xkChannels);
            console.log(`[Playlist Loader] Successfully loaded ${xkChannels.length} Kosovo channels directly.`);
            // Return the sorted channels with Kosovo channels added
            return uniqueChannels.sort((a, b) => {
              const priorityA = groupPriority(a.group);
              const priorityB = groupPriority(b.group);
              
              if (priorityA !== priorityB) {
                return priorityA - priorityB;
              }
              
              return a.name.localeCompare(b.name);
            });
          }
          // Return the sorted channels as is if no Kosovo channels were found
          return sortedChannels;
        })
        .catch(error => {
          console.error('[Playlist Loader] Failed to directly load Kosovo channels:', error);
          // Return the sorted channels despite the error
          return sortedChannels;
        });
    }
  }
  
  // Funksion për përcaktimin e prioritetit të grupeve
  const groupPriority = (group) => {
    const groupLower = (group || "").toLowerCase();
    if (groupLower.includes('kosovë')) return 1;
    if (groupLower.includes('shqip') || groupLower === 'albania') return 2;
    if (groupLower.includes('tring')) return 3;
    if (groupLower.includes('fëmijë shqip')) return 4;
    if (groupLower.includes('fëmijë') || groupLower.includes('kids')) return 5;
    if (groupLower.includes('türkiye') || groupLower.includes('turqi')) return 6;
    if (groupLower.includes('fetare') || groupLower.includes('islam')) return 7;
    if (groupLower.includes('muzikë') || groupLower.includes('music')) return 8;
    if (groupLower.includes('german')) return 9;
    if (groupLower.includes('france') || groupLower === 'francë') return 10;
    if (groupLower.includes('georgia') || groupLower === 'gjeorgji') return 11;
    if (groupLower.includes('usa') || groupLower === 'united states') return 12;
    if (groupLower.includes('uk') || groupLower === 'united kingdom') return 13;
    return 100;
  };

  // Rendit sipas prioritetit të grupit, pastaj sipas emrit
  const sortedChannels = [...uniqueChannels].sort((a, b) => {
    const priorityA = groupPriority(a.group);
    const priorityB = groupPriority(b.group);
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // Prioritizo kanalet me logo
    if (!!a.logo !== !!b.logo) {
      return a.logo ? -1 : 1;
    }
    
    // Prioritizo kanalet me cilësi të lartë
    if (a.quality && b.quality) {
      const qualityA = parseInt(a.quality);
      const qualityB = parseInt(b.quality);
      if (!isNaN(qualityA) && !isNaN(qualityB) && qualityA !== qualityB) {
        return qualityB - qualityA; // Cilësi më e lartë në krye
      }
    }
    
    // Rendit sipas emrit (fallback)
    return a.name.localeCompare(b.name);
  });
  
  console.log(`[Playlist Loader] Kanalet u renditën sipas prioritetit.`);
  return sortedChannels;
}

// Eksporto funksionet për përdorim global
window.playlistLoader = {
  loadAllPlaylists,
  parseM3UContent,
  playlistFiles
};

/**
 * Pastro cache-in e playlist-ëve
 */
function clearCache() {
  playlistCache.clear();
  console.log('[Playlist Loader] Cache i playlist-ëve u pastrua.');
}

// Përmirëso sigurinë e funksioneve të eksportuara
window.playlistLoader = {
  loadAllPlaylists: async function() {
    try {
      return await loadAllPlaylists();
    } catch (error) {
      console.error('[Playlist Loader] Error in loadAllPlaylists:', error);
      return []; // Kthen array të zbrazët në rast gabimi
    }
  },
  parseM3UContent,
  playlistFiles,
  processChannels, // Eksporto edhe processChannels për përdorim nga jashtë
  clearCache: false, // Flag for cache clearing
  clearCacheFunction: clearCache // Eksporto funksionin për pastrimin e cache-it
};

// Njofto që playlist-loader është i gatshëm
console.log('[Playlist Loader] Inicializuar me sukses.');
document.dispatchEvent(new CustomEvent('playlist-loader-ready'));

/**
 * Rikthe të gjithë kanalet (Reload all channels)
 * Kjo funksion bën rifreskimin e plotë të kanaleve dhe përditëson UI
 */
window.riktheTeGjitheKanalet = async function() {
  try {
    // Pastro cache-in
    if (window.playlistLoader) {
      window.playlistLoader.clearCache = true;
    }
    // Ngarko të gjitha kanalet
    const allChannels = await window.playlistLoader.loadAllPlaylists();
    // Përditëso window.items dhe UI
    window.items = allChannels;
    if (typeof updateFilterGroups === 'function') {
      updateFilterGroups();
    }
    if (typeof list === 'object' && typeof renderChannelList === 'function') {
      renderChannelList(window.items);
    }
    console.log('[Playlist Loader] Rikthimi i të gjitha kanaleve u krye me sukses:', allChannels.length);
    // Opsionale: Shfaq një mesazh suksesi në UI
    if (typeof statusEl === 'object') {
      statusEl.textContent = `✅ Të gjitha kanalet u rifreskuan (${allChannels.length})`;
      statusEl.className = 'success';
    }
  } catch (error) {
    console.error('[Playlist Loader] Gabim gjatë rikthimit të të gjitha kanaleve:', error);
    if (typeof statusEl === 'object') {
      statusEl.textContent = `❌ Gabim gjatë rifreskimit të kanaleve: ${error.message}`;
      statusEl.className = 'error';
    }
  }
};
/**
 * Test Stream Player - Mini IPTV
 * Ky file teston luajtësin me lloje të ndryshme të stream-ave
 */

// Ndërto një listë të stream-ave për testim
const testStreams = [
    // HLS streams të njohur për testim
    {
        id: "test_bbc",
        name: "BBC Test Stream (HLS)",
        url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        type: "tv",
        group: "Test Streams",
        logo: "https://i.imgur.com/eNPIQ9f.png",
        quality: "1080p",
        description: "Mux test stream për HLS"
    },
    {
        id: "test_tears",
        name: "Tears of Steel (HLS)",
        url: "https://mdn.github.io/learning-area/javascript/apis/video-audio/finished/video/tears-of-steel-hls/playlist.m3u8",
        type: "tv",
        group: "Test Streams",
        logo: "https://i.imgur.com/fzkWxsB.jpg",
        quality: "720p",
        description: "Tears of Steel HLS test stream nga MDN"
    },
    {
        id: "test_apple",
        name: "Apple Advanced (HLS)",
        url: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8",
        type: "tv",
        group: "Test Streams",
        logo: "https://i.imgur.com/vpiIS5U.png",
        quality: "1080p",
        description: "Stream testimi nga Apple me cilësi të ndryshme"
    },

    // MP4 direkt
    {
        id: "test_mp4_big",
        name: "Big Buck Bunny (MP4)",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        type: "tv",
        group: "Test MP4",
        logo: "https://i.imgur.com/LyMjbdN.png",
        quality: "720p",
        description: "Film i shkurtër testimi në format MP4"
    },

    // YouTube (për testimin e embeds)
    {
        id: "test_youtube",
        name: "Coastal Landscape (YouTube)",
        url: "https://www.youtube.com/watch?v=LXb3EKWsInQ",
        type: "tv",
        group: "Test YouTube",
        logo: "https://i.imgur.com/EgqVSZX.png",
        quality: "1080p",
        description: "Video testimi nga YouTube"
    },

    // Audio stream për testim
    {
        id: "test_audio_radio",
        name: "Test Audio Stream (MP3)",
        url: "https://stream.radioparadise.com/mp3-128",
        type: "radio",
        group: "Test Radio",
        logo: "https://i.imgur.com/qrGrjSC.png",
        description: "Audio stream testimi në format MP3"
    },
    {
        id: "test_audio_aac",
        name: "Test Audio Stream (AAC)",
        url: "https://stream.radioparadise.com/aac-320",
        type: "radio",
        group: "Test Radio",
        logo: "https://i.imgur.com/qrGrjSC.png",
        description: "Audio stream testimi në format AAC"
    }
];

// Funksion për të testuar stream-at
function testStreams() {
    console.log('[Stream Test] Duke shtuar stream-at për testim...');
    
    // Kontrollo nëse variabli items ekziston
    if (typeof window.items === 'undefined') {
        console.error('[Stream Test] window.items nuk ekziston!');
        return;
    }
    
    // Kontrollo nëse window.items është array
    if (!Array.isArray(window.items)) {
        console.error('[Stream Test] window.items nuk është array!');
        window.items = [];
    }
    
    // Kontrollo nëse test streams janë tashmë të shtuar
    const existingTests = window.items.filter(i => i.group === 'Test Streams' || i.group === 'Test MP4' || 
                                             i.group === 'Test YouTube' || i.group === 'Test Radio');
    
    if (existingTests.length > 0) {
        console.log(`[Stream Test] Tashmë ka ${existingTests.length} stream testimi të shtuar.`);
    } else {
        // Shto test streams në fillim të listës
        window.items = [...testStreams, ...window.items];
        console.log(`[Stream Test] U shtuan ${testStreams.length} stream testimi.`);
        
        // Nëse UI është i ngarkuar, përditësoje
        if (typeof window.updateUIWithChannels === 'function') {
            window.updateUIWithChannels();
        } else {
            console.warn('[Stream Test] updateUIWithChannels nuk u gjet. UI mund të mos përditësohet.');
            // Alternativë: lëshoj event kur channels janë gati
            window.dispatchEvent(new CustomEvent('channels-ready'));
        }
    }
    
    console.log('[Stream Test] Stream test u inicializuan me sukses.');
}

// Eksekuto testin kur DOM të jetë gati
document.addEventListener('DOMContentLoaded', () => {
    // Shto një buton testimi në header
    const header = document.querySelector('header');
    if (header) {
        const testButton = document.createElement('button');
        testButton.className = 'control-button test-button';
        testButton.textContent = 'Testo Streams';
        testButton.onclick = testStreams;
        header.appendChild(testButton);
        
        console.log('[Stream Test] Butoni i testimit u shtua në header.');
    }
});

// Për shfaqjen e rezultateve të testit
console.log('[Stream Test] Stream test file u ngarkua.');
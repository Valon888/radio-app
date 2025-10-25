/**
 * radio-app.js - Enhanced radio functionality for Mini IPTV
 * This script adds additional features for radio stations
 */

document.addEventListener('DOMContentLoaded', () => {
  // Get elements
  const audioEl = document.querySelector('#audio');
  const statusEl = document.querySelector('#status');
  
  // Add metadata display for radio streams
  if (audioEl) {
    // Listen for metadata updates from radio streams
    audioEl.addEventListener('loadedmetadata', () => {
      console.log('[Radio] Metadata loaded');
    });
    
    // Listen for time updates to catch ICY metadata
    audioEl.addEventListener('timeupdate', () => {
      try {
        // Some radio stations provide "now playing" info
        if (audioEl._icy_title) {
          statusEl.textContent = 'Duke luajtur: ' + audioEl._icy_title;
        }
      } catch (e) {
        console.error('[Radio] Error getting ICY metadata:', e);
      }
    });
    
    // Add volume controls for radio
    document.addEventListener('keydown', (e) => {
      // Volume up (arrow up while holding Alt)
      if (e.altKey && e.key === 'ArrowUp') {
        e.preventDefault();
        audioEl.volume = Math.min(1, audioEl.volume + 0.1);
        statusEl.textContent = `Volumi: ${Math.round(audioEl.volume * 100)}%`;
      }
      
      // Volume down (arrow down while holding Alt)
      if (e.altKey && e.key === 'ArrowDown') {
        e.preventDefault();
        audioEl.volume = Math.max(0, audioEl.volume - 0.1);
        statusEl.textContent = `Volumi: ${Math.round(audioEl.volume * 100)}%`;
      }
      
      // Mute toggle (M key)
      if (e.key === 'm' || e.key === 'M') {
        audioEl.muted = !audioEl.muted;
        statusEl.textContent = audioEl.muted ? 'Audio pa zë' : 'Audio me zë';
      }
    });
  }
  
  // Handle different radio stream types
  function tryAlternativeRadioFormats(radioUrl, audioElement) {
    // For PLS files
    if (radioUrl.endsWith('.pls')) {
      fetch(radioUrl)
        .then(response => response.text())
        .then(data => {
          // Extract the stream URL from the PLS file
          const fileUrlMatch = data.match(/File1=(.*)/i);
          if (fileUrlMatch && fileUrlMatch[1]) {
            audioElement.src = fileUrlMatch[1];
            audioElement.play().catch(e => console.error('[Radio] PLS play error:', e));
          }
        })
        .catch(err => {
          console.error('[Radio] PLS fetch error:', err);
          // Fallback to direct play
          audioElement.src = radioUrl;
          audioElement.play().catch(() => {});
        });
      return true;
    }
    
    // For ASX files
    if (radioUrl.endsWith('.asx')) {
      fetch(radioUrl)
        .then(response => response.text())
        .then(data => {
          // Extract the stream URL from the ASX file
          const fileUrlMatch = data.match(/<ref href="([^"]+)"/i);
          if (fileUrlMatch && fileUrlMatch[1]) {
            audioElement.src = fileUrlMatch[1];
            audioElement.play().catch(e => console.error('[Radio] ASX play error:', e));
          }
        })
        .catch(err => {
          console.error('[Radio] ASX fetch error:', err);
          // Fallback to direct play
          audioElement.src = radioUrl;
          audioElement.play().catch(() => {});
        });
      return true;
    }
    
    return false; // No special handling needed
  }
  
  // Override the audio src setting
  const originalAudioSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLAudioElement.prototype, 'src');
  if (originalAudioSrcDescriptor && originalAudioSrcDescriptor.set) {
    Object.defineProperty(HTMLAudioElement.prototype, 'src', {
      set: function(url) {
        if (url && (url.endsWith('.pls') || url.endsWith('.asx'))) {
          if (tryAlternativeRadioFormats(url, this)) {
            return; // Handled by our special function
          }
        }
        // Default behavior
        originalAudioSrcDescriptor.set.call(this, url);
      },
      get: originalAudioSrcDescriptor.get
    });
  }
  
  console.log('[Radio] Radio functionality initialized');
});

// Add radio app ready event
window.dispatchEvent(new Event('radio-app-ready'));

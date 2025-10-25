// Script to generate an M3U file with all channels combined
// This will include channels from all sources:
// 1. Albania channels
// 2. Tring channels
// 3. Imported channels from us_canelatv.m3u, us_cineversetv.m3u, us_xumo.m3u, us_plex.m3u, tt.m3u, hr.m3u
// 4. Other fallback channels

// Script to generate this file dynamically
const fs = require('fs');

// Check if fallback-channels.js exists
let hardcodedChannels = [];
try {
  hardcodedChannels = require('./fallback-channels').hardcodedChannels || [];
  console.log(`Found ${hardcodedChannels.length} fallback channels`);
} catch (error) {
  console.log('No fallback-channels.js file found or error loading it');
}

// Check if imported-channels.js exists
let importedChannels = [];
try {
  importedChannels = require('./imported-channels').importedChannels || [];
  console.log(`Found ${importedChannels.length} imported channels`);
} catch (error) {
  console.log('No imported-channels.js file found or error loading it');
}

// Combine all channels
const allChannels = [...hardcodedChannels, ...importedChannels];

// Generate M3U content
let m3uContent = '#EXTM3U\n\n';
m3uContent += '# Generated M3U file with all channels from Mini IPTV\n';
m3uContent += `# Total channels: ${allChannels.length}\n\n`;

// Add each channel
allChannels.forEach(channel => {
  // Skip channels without valid URLs
  if (!channel.url || !channel.url.startsWith('http')) return;
  
  // Create the extended info line
  let extInfo = '#EXTINF:-1';
  if (channel.id) extInfo += ` tvg-id="${channel.id}"`;
  if (channel.logo) extInfo += ` tvg-logo="${channel.logo}"`;
  if (channel.group) extInfo += ` group-title="${channel.group}"`;
  if (channel.quality) extInfo += ` (${channel.quality})`;
  extInfo += `,${channel.name}`;
  
  // Add to M3U content
  m3uContent += extInfo + '\n' + channel.url + '\n\n';
});

// Write to file
fs.writeFileSync('index.m3u', m3uContent);
console.log(`Generated index.m3u with ${allChannels.length} channels`);
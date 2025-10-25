// Extract a subset of imported channels for fallback usage
const { importedChannels } = require('./imported-channels');

// Select a reasonable number of channels from each imported source
function selectChannels(channels, sourceName, count = 5) {
  return channels
    .filter(ch => ch.group.includes(sourceName))
    .slice(0, count)
    .map(ch => {
      // Add source name to channel ID to avoid conflicts
      const newId = `fallback_${ch.id}`;
      return { ...ch, id: newId };
    });
}

// Extract channels from the different sources
const canelaChannels = selectChannels(importedChannels, 'us_canelatv', 5);
const cineverseChannels = selectChannels(importedChannels, 'us_cineversetv', 5);
const xumoChannels = selectChannels(importedChannels, 'us_xumo', 10);
const plexChannels = selectChannels(importedChannels, 'us_plex', 5);
const ttChannels = selectChannels(importedChannels, 'tt', 2);
const hrChannels = selectChannels(importedChannels, 'hr', 5);

// Combine all selected channels
const importedFallbackChannels = [
  ...canelaChannels,
  ...cineverseChannels,
  ...xumoChannels,
  ...plexChannels,
  ...ttChannels,
  ...hrChannels
];

// Write the channels to a file that can be manually merged with fallback-channels.js
const fs = require('fs');
const outputFile = 'fallback-imported.js';
const channelsCode = `// Extracted fallback channels from imported M3U files
// Add these to hardcodedChannels in fallback-channels.js
const importedFallbackChannels = ${JSON.stringify(importedFallbackChannels, null, 2)};
`;

fs.writeFileSync(outputFile, channelsCode);
console.log(`Wrote ${importedFallbackChannels.length} fallback channels to ${outputFile}`);

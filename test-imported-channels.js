// Test script to verify the imported channels
const { hardcodedChannels } = require('./fallback-channels');

// Check if importedChannels is loaded
try {
  const { importedChannels } = require('./imported-channels');
  console.log(`Successfully imported ${importedChannels.length} channels from M3U files`);
  
  // Check a few sample channels
  if (importedChannels.length > 0) {
    console.log('\nSample channels from imported-channels.js:');
    console.log(`1. ${importedChannels[0].name} (${importedChannels[0].group})`);
    console.log(`2. ${importedChannels[10].name} (${importedChannels[10].group})`);
    console.log(`3. ${importedChannels[20].name} (${importedChannels[20].group})`);
  }
} catch (error) {
  console.error('Error importing channels:', error.message);
}

// Check if fallback channels include the imported channels
const fallbackChannelCount = hardcodedChannels.length;
const importedFallbackChannelCount = hardcodedChannels.filter(ch => ch.id?.startsWith('fallback_')).length;

console.log(`\nFallback channels: ${fallbackChannelCount} total (${importedFallbackChannelCount} imported)`);

// Now check if items.js can see the imported channels
try {
  const itemsModule = require('./items');
  console.log('\nChecking items.js setup:');
  
  // Check if there's a prepareChannels function we can call
  if (typeof itemsModule.prepareChannels === 'function') {
    console.log('Found prepareChannels function in items.js');
    itemsModule.prepareChannels().then(() => {
      const channelsCount = itemsModule.getAllChannels?.().length || 'unknown';
      console.log(`Total channels in items.js: ${channelsCount}`);
    });
  } else {
    console.log('Note: prepareChannels function not found in items.js');
    console.log('This is normal if the function is not exported');
  }
} catch (error) {
  console.error('Error loading items.js:', error.message);
}

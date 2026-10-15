// Test script to verify Tring TV Albania channels
// Read and parse the items.js file
const fs = require('fs');

// Read items.js and extract tringAlbaniaChannels
const itemsContent = fs.readFileSync('items.js', 'utf8');
let tringAlbaniaChannels = [];

// Find and extract tringAlbaniaChannels array
const tringArrayMatch = itemsContent.match(/const\s+tringAlbaniaChannels\s*=\s*\[([\s\S]*?)\];/);
if (tringArrayMatch && tringArrayMatch[1]) {
    // Convert to proper array by evaluating the string as JavaScript
    const arrayDefStr = `[${tringArrayMatch[1]}]`;
    // Create a safe evaluation environment
    const evalInContext = function() {
        return eval(arrayDefStr);
    };
    
    try {
        tringAlbaniaChannels = evalInContext();
        console.log(`Successfully extracted tringAlbaniaChannels array`);
    } catch (e) {
        console.error(`Error evaluating tringAlbaniaChannels array: ${e.message}`);
    }
}

// Read fallback channels
const fallbackContent = fs.readFileSync('fallback-channels.js', 'utf8');
let fallbackChannels = [];

// Extract hardcodedChannels array from fallback-channels.js
const fallbackMatch = fallbackContent.match(/const\s+hardcodedChannels\s*=\s*\[([\s\S]*?)\];/);
if (fallbackMatch && fallbackMatch[1]) {
    // Create an array of channel objects by parsing the string content
    const channelEntries = fallbackMatch[1].match(/{\s*id:\s*"[^"]*"[\s\S]*?}/g) || [];
    fallbackChannels = channelEntries.map(entry => {
        // Parse group from entry
        const groupMatch = entry.match(/group:\s*"([^"]*)"/);
        return { 
            group: groupMatch ? groupMatch[1] : null
        };
    });
}

// Count Tring TV channels in items.js
const tringChannelsInItems = tringAlbaniaChannels.length;
console.log(`Found ${tringChannelsInItems} Tring TV Albania channels in items.js`);

// Count Tring TV channels in fallback-channels.js
const tringChannelsInFallback = fallbackChannels.filter(channel => 
  channel.group && channel.group.startsWith('Tring')).length;
console.log(`Found ${tringChannelsInFallback} Tring TV Albania channels in fallback-channels.js`);

// List all Tring channel groups
const tringGroups = [...new Set(tringAlbaniaChannels.map(channel => channel.group))];
console.log('\nTring TV channel groups:');
tringGroups.forEach(group => {
  const channelsInGroup = tringAlbaniaChannels.filter(channel => channel.group === group).length;
  console.log(`- ${group}: ${channelsInGroup} channels`);
});

console.log('\nVerification complete!');

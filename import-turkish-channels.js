const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Turkish channels M3U file
const filesToImport = [
  'd:\\mini-iptv\\tur.m3u'
];

// Function to parse M3U file content
async function parseM3UFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return [];
    }

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    const channels = [];
    let currentChannel = null;
    let lineCount = 0;

    for await (const line of rl) {
      lineCount++;
      
      // Skip empty lines and the #EXTM3U header
      if (!line.trim() || line.trim() === '#EXTM3U') continue;

      // Parse channel info
      if (line.startsWith('#EXTINF:')) {
        const channelInfo = line.substring(line.indexOf(',') + 1);
        let name = channelInfo.trim();
        
        // Extract additional attributes if present
        let logo = '';
        let group = 'Turkish'; // Default group for all channels
        let quality = '';
        
        // Extract tvg-logo if present
        const logoMatch = line.match(/tvg-logo="([^"]+)"/);
        if (logoMatch) logo = logoMatch[1];
        
        // Extract group-title if present, but keep it as a sub-category
        const groupMatch = line.match(/group-title="([^"]+)"/);
        if (groupMatch) group = 'Turkish - ' + groupMatch[1];

        // Extract quality information if available
        if (line.includes('1080p')) quality = '1080p';
        else if (line.includes('720p')) quality = '720p';
        else if (line.includes('576p')) quality = '576p';
        else if (line.includes('480p')) quality = '480p';
        else if (line.includes('360p')) quality = '360p';
        
        currentChannel = {
          name,
          logo,
          group,
          quality,
          url: '',
          type: 'tv'
        };
      } 
      // Get the URL (should be the line immediately after #EXTINF)
      else if (currentChannel && !currentChannel.url && (line.startsWith('http') || line.startsWith('https'))) {
        currentChannel.url = line.trim();
        
        // Generate an ID from the name
        currentChannel.id = 'tr_' + currentChannel.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .substring(0, 20);
        
        channels.push(currentChannel);
        currentChannel = null;
      }
    }

    console.log(`Parsed ${channels.length} Turkish channels from ${path.basename(filePath)}`);
    return channels;
  } catch (error) {
    console.error(`Error parsing M3U file ${filePath}:`, error);
    return [];
  }
}

// Function to generate the JavaScript code for the Turkish channels
async function generateChannelCode() {
  let allChannels = [];
  
  // Parse all M3U files
  for (const filePath of filesToImport) {
    const channels = await parseM3UFile(filePath);
    allChannels = [...allChannels, ...channels];
  }
  
  if (allChannels.length === 0) {
    console.error('No channels parsed from M3U files');
    return;
  }
  
  // Generate code for channels
  let channelCode = '// Turkish channels imported from M3U files\nconst turkishChannels = [\n';
  
  for (const channel of allChannels) {
    channelCode += `  { id: "${channel.id}", name: "${channel.name}", url: "${channel.url}", type: "${channel.type}", group: "${channel.group}", logo: "${channel.logo}", quality: "${channel.quality}" },\n`;
  }
  
  channelCode += '];\n\n// Export for use in items.js\nmodule.exports = { turkishChannels };\n';
  
  // Write to file
  const outputPath = path.join(__dirname, 'turkish-channels.js');
  fs.writeFileSync(outputPath, channelCode);
  console.log(`Wrote ${allChannels.length} Turkish channels to ${outputPath}`);
  
  console.log('\nNow add the following code to items.js:');
  console.log('1. At the top of the file, add:');
  console.log('const { turkishChannels } = require(\'./turkish-channels\');');
  console.log('\n2. In the mergeChannels function, add turkishChannels to the array:');
  console.log('const allChannels = [...hardcodedChannels, ...m3uChannels, ...importedChannels, ...turkishChannels];');
}

// Run the script
generateChannelCode();
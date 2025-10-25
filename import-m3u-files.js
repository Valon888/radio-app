const fs = require('fs');
const path = require('path');
const readline = require('readline');

// List of M3U files to import
const filesToImport = [
  'c:\\Users\\hp\\Downloads\\us_canelatv.m3u',
  'c:\\Users\\hp\\Downloads\\us_cineversetv.m3u',
  'c:\\Users\\hp\\Downloads\\us_xumo.m3u',
  'c:\\Users\\hp\\Downloads\\us_plex.m3u',
  'c:\\Users\\hp\\Downloads\\tt.m3u',
  'c:\\Users\\hp\\Downloads\\hr.m3u'
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
        let group = path.basename(filePath, '.m3u'); // Use filename as default group
        let quality = '';
        
        // Extract tvg-logo if present
        const logoMatch = line.match(/tvg-logo="([^"]+)"/);
        if (logoMatch) logo = logoMatch[1];
        
        // Extract group-title if present
        const groupMatch = line.match(/group-title="([^"]+)"/);
        if (groupMatch) group = groupMatch[1];

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
        currentChannel.id = currentChannel.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .substring(0, 20);
        
        channels.push(currentChannel);
        currentChannel = null;
      }
    }

    console.log(`Parsed ${channels.length} channels from ${path.basename(filePath)}`);
    return channels;
  } catch (error) {
    console.error(`Error parsing M3U file ${filePath}:`, error);
    return [];
  }
}

// Function to generate the JavaScript code for the new channels
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
  let channelCode = '// Imported channels from M3U files\nconst importedChannels = [\n';
  
  for (const channel of allChannels) {
    channelCode += `  { id: "${channel.id}", name: "${channel.name}", url: "${channel.url}", type: "${channel.type}", group: "${channel.group}", logo: "${channel.logo}", quality: "${channel.quality}" },\n`;
  }
  
  channelCode += '];\n\n// Export for use in items.js\nmodule.exports = { importedChannels };\n';
  
  // Write to file
  const outputPath = path.join(__dirname, 'imported-channels.js');
  fs.writeFileSync(outputPath, channelCode);
  console.log(`Wrote ${allChannels.length} channels to ${outputPath}`);
  
  console.log('\nNow add the following code to items.js:');
  console.log('1. At the top of the file, add:');
  console.log('const { importedChannels } = require(\'./imported-channels\');');
  console.log('\n2. In the mergeChannels function, add importedChannels to the array:');
  console.log('const allChannels = [...hardcodedChannels, ...m3uChannels, ...importedChannels];');
}

// Run the script
generateChannelCode();

// Common Albanian IPTV stream sources
const channels = [
  {
    id: "topchannel",
    name: "Top Channel",
    possibleUrls: [
      "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/106.ts",
      "https://mfe01.tring.al/delta/105/out/u/rdghfhsfhfshs.m3u8",
      "https://dai.google.com/linear/hls/event/lMIJHKZUROqRCSrX33MAjA/master.m3u8"
    ]
  },
  {
    id: "filmaksion",
    name: "Film Aksion",
    possibleUrls: [
      "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/133.ts",
      "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/152.ts"
    ]
  },
  {
    id: "atv",
    name: "ATV",
    possibleUrls: [
      "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/101.ts",
      "http://46.99.146.236/0.m3u8"
    ]
  }
];

async function testStreamUrl(url) {
  try {
    console.log(`Testing URL: ${url}`);
    const response = await fetch(url, {
      method: 'HEAD',
      timeout: 5000
    });
    
    console.log(`Status: ${response.status}`);
    return {
      url,
      working: response.status >= 200 && response.status < 400,
      statusCode: response.status
    };
  } catch (error) {
    console.error(`Error testing ${url}: ${error.message}`);
    return {
      url,
      working: false,
      error: error.message
    };
  }
}

async function testAllChannels() {
  const results = [];
  
  for (const channel of channels) {
    console.log(`\nTesting channel: ${channel.name}`);
    const channelResults = [];
    
    for (const url of channel.possibleUrls) {
      const result = await testStreamUrl(url);
      channelResults.push(result);
    }
    
    // Find the best working URL
    const workingUrls = channelResults.filter(r => r.working);
    let bestUrl = workingUrls.length > 0 ? workingUrls[0].url : null;
    
    results.push({
      id: channel.id,
      name: channel.name,
      bestUrl: bestUrl,
      results: channelResults
    });
  }
  
  console.log('\n\nFINAL RESULTS:');
  console.log(JSON.stringify(results, null, 2));
  
  console.log('\nChannel objects for items.js:');
  for (const result of results) {
    if (result.bestUrl) {
      let groupName = result.id === 'filmaksion' ? 'Filma Shqip' : 'Kombëtare';
      console.log(`  { id: "${result.id}", name: "${result.name}", url: "${result.bestUrl}", type: "tv", group: "${groupName}", logo: "", quality: "720p", description: "" },`);
    } else {
      console.log(`// Could not find working URL for ${result.name}`);
    }
  }
}

// Run the function and ensure it completes
(async () => {
  try {
    await testAllChannels();
    console.log('Testing completed');
  } catch (error) {
    console.error('Error in test execution:', error);
  }
})();

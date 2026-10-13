// Script to extract stream URLs from triangolomedia.com portal
const urls = [
  'https://triangolomedia.com/portal/kategori/filma/kanali/filmaksion.php',
  'https://triangolomedia.com/portal/kategori/kombetare/kanali/topchannel.php',
  'https://triangolomedia.com/portal/kategori/kombetare/kanali/atv.php'
];

const token = 'dmFsb25zYWRpa3UyMDI0QGdtYWlsLmNvbQ==';

async function extractStreamUrl(url) {
  try {
    console.log(`Fetching page: ${url}`);
    const response = await fetch(url + (url.includes('?') ? '&' : '?') + `token=${token}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log(`Received HTML content (${html.length} characters)`);
    
    // Look for the iframe source or video source in the HTML
    // This regex pattern looks for iframe src or video source
    const iframeMatch = html.match(/iframe[^>]*src=["']([^"']+)["']/i);
    const videoMatch = html.match(/video[^>]*src=["']([^"']+)["']/i);
    const videoSourceMatch = html.match(/<source[^>]*src=["']([^"']+)["']/i);
    
    // Also look for patterns like var videoLink = "http://..."
    const jsVarMatch = html.match(/var\s+\w+\s*=\s*["']([^"']+\.m3u8[^"']*)["']/i);

    // Search for m3u8 links in the page
    const m3u8Match = html.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i);
    
    let streamUrl = null;
    if (iframeMatch) {
      streamUrl = iframeMatch[1];
      console.log(`Found iframe source: ${streamUrl}`);
    } else if (videoMatch) {
      streamUrl = videoMatch[1];
      console.log(`Found video source: ${streamUrl}`);
    } else if (videoSourceMatch) {
      streamUrl = videoSourceMatch[1];
      console.log(`Found video source element: ${streamUrl}`);
    } else if (jsVarMatch) {
      streamUrl = jsVarMatch[1];
      console.log(`Found JS variable with stream URL: ${streamUrl}`);
    } else if (m3u8Match) {
      streamUrl = m3u8Match[1];
      console.log(`Found m3u8 link in page: ${streamUrl}`);
    } else {
      console.log('No stream URL found in the HTML content');
      // Output a small portion of the HTML for debugging
      console.log('HTML snippet:', html.substring(0, 500) + '...');
    }
    
    return {
      url: url,
      streamUrl: streamUrl,
      channelName: extractChannelName(url)
    };
  } catch (error) {
    console.error(`Error processing ${url}: ${error.message}`);
    return {
      url: url,
      streamUrl: null,
      error: error.message,
      channelName: extractChannelName(url)
    };
  }
}

function extractChannelName(url) {
  // Extract channel name from URL
  const match = url.match(/kanali\/([^.]+)\.php/);
  if (match) {
    const channelId = match[1];
    // Convert to title case and fix specific names
    if (channelId === 'topchannel') return 'Top Channel';
    if (channelId === 'filmaksion') return 'Film Aksion';
    if (channelId === 'atv') return 'ATV';
    
    return channelId.charAt(0).toUpperCase() + channelId.slice(1);
  }
  return 'Unknown Channel';
}

async function processAllUrls() {
  console.log('Starting to process URLs...');
  const results = [];
  
  for (const url of urls) {
    const result = await extractStreamUrl(url);
    results.push(result);
  }
  
  console.log('\nResults:');
  console.log(JSON.stringify(results, null, 2));
  
  console.log('\nChannel objects for items.js:');
  for (const result of results) {
    if (result.streamUrl) {
      let channelId = result.url.match(/kanali\/([^.]+)\.php/)?.[1] || 'unknownchannel';
      let groupName = result.url.includes('/filma/') ? 'Filma Shqip' : 'Kombëtare';
      
      console.log(`  { id: "${channelId}", name: "${result.channelName}", url: "${result.streamUrl}", type: "tv", group: "${groupName}", logo: "", quality: "720p", description: "" },`);
    }
  }
}

processAllUrls();

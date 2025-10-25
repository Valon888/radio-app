// Updated working stream URLs for Tring TV channels
const tringWorkingStreams = {
  // Tring Sport channels
  "tringsport1": "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/165.ts",
  "tringsport2": "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/166.ts",
  "tringsport3": "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/187.ts",
  "tringsport4": "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/188.ts",
  "tringsportnews": "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/189.ts",
  
  // Tring Film channels
  "tringsuperhd": "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/151.ts",
  "tringaction": "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/152.ts",
  "tringcomedy": "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/153.ts",
  "tringfantasy": "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/156.ts",
  "tringlife": "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/157.ts",
  "tringshqip": "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/150.ts",
  
  // Tring Children's channels
  "tringjunior": "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/158.ts",
  "tringkids": "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/159.ts",
  "tringtring": "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/160.ts",
  "tiptv": "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/190.ts",
  
  // Tring Documentary channels
  "tringplanet": "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/161.ts",
  "tringworld": "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/162.ts",
  "tringhistory": "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/163.ts",
  
  // Other Tring channels
  "vizionplus": "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/131.ts",
  "livinghd": "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/198.ts",
  "tringfamily": "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/154.ts"
};

// Function to test URLs
async function testUrls() {
  const http = require('http');
  
  console.log("Testing stream URLs...");
  
  for (const [channel, url] of Object.entries(tringWorkingStreams)) {
    process.stdout.write(`Testing ${channel}... `);
    
    try {
      const result = await new Promise((resolve) => {
        const req = http.get(url, { timeout: 5000 }, (res) => {
          resolve({ status: res.statusCode, working: res.statusCode >= 200 && res.statusCode < 400 });
          // Abort after getting headers to avoid downloading too much data
          req.destroy();
        });
        
        req.on('error', (err) => {
          resolve({ status: 0, working: false, error: err.message });
        });
        
        req.on('timeout', () => {
          req.destroy();
          resolve({ status: 0, working: false, error: 'Timeout' });
        });
      });
      
      if (result.working) {
        console.log(`WORKING (${result.status}) ✓`);
      } else {
        console.log(`FAILED (${result.status}) ✗${result.error ? ' - ' + result.error : ''}`);
      }
    } catch (error) {
      console.log(`ERROR - ${error.message}`);
    }
  }
}

// Run the tests
testUrls().catch(console.error).then(() => {
  console.log("\nDone testing. You can now use the tringWorkingStreams object to update the channel URLs.");
});

// Simple test script to verify our newly added channels
async function testNewChannels() {
  const channels = [
    {
      name: "Top Channel",
      url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/106.ts"
    },
    {
      name: "ATV",
      url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/101.ts"
    },
    {
      name: "Film Aksion",
      url: "http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/133.ts"
    }
  ];
  
  const testStream = async (channel) => {
    return new Promise((resolve) => {
      console.log(`Testing ${channel.name}: ${channel.url}`);
      
      // Set a timeout to avoid hanging
      const timeoutId = setTimeout(() => {
        console.log(`⚠️ ${channel.name} test timed out after 5 seconds`);
        resolve(false);
      }, 5000);
      
      // Try to fetch a small part of the stream
      fetch(channel.url, { 
        method: 'GET',
        headers: {
          'Range': 'bytes=0-1000' // Just get the first 1000 bytes
        }
      })
      .then(response => {
        clearTimeout(timeoutId);
        console.log(`${channel.name} - Status: ${response.status}`);
        
        if (response.status >= 200 && response.status < 400) {
          console.log(`✅ ${channel.name} stream URL is working!`);
          resolve(true);
        } else {
          console.log(`❌ ${channel.name} stream URL returned error status ${response.status}`);
          resolve(false);
        }
      })
      .catch(error => {
        clearTimeout(timeoutId);
        console.error(`❌ Error testing ${channel.name}: ${error.message}`);
        resolve(false);
      });
    });
  };
  
  for (const channel of channels) {
    await testStream(channel);
    console.log('-----------------------------------');
  }
}

// Execute the test
testNewChannels();

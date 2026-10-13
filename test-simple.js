// Simple test script to verify the Tring TV URLs
async function testTringStream() {
  try {
    // Test one of the updated Tring Sport channels
    const url = 'http://185.226.88.6:11026/live/Wb8XNkyIJn/UkPn4unfnR/165.ts';
    console.log(`Testing stream: ${url}`);
    
    const response = await fetch(url, {
      method: 'HEAD' // Just check the headers, don't download the full stream
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.status >= 200 && response.status < 300) {
      console.log('✅ Stream URL is working!');
    } else {
      console.log('❌ Stream URL returned an error status code');
    }
  } catch (error) {
    console.error(`❌ Error testing stream: ${error.message}`);
  }
}

// Run the test
testTringStream();

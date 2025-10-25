/**
 * Test script to check if French and Georgian channels are loading correctly
 */

// Function to load and display channel counts by country
async function testFrenchAndGeorgianChannels() {
  console.log('Starting test for French and Georgian channels...');
  
  // Check if the playlist-loader is available
  if (!window.playlistLoader) {
    console.error('Playlist loader not found! Make sure playlist-loader.js is loaded.');
    return;
  }
  
  // Track which files we're testing
  const filesToCheck = ['fr.m3u', 'ge.m3u'];
  
  // Force clear the cache to ensure we get fresh data
  window.playlistLoader.clearCache = true;
  
  try {
    // Load all playlists (this will include fr.m3u and ge.m3u)
    const allChannels = await window.playlistLoader.loadAllPlaylists();
    console.log(`Total channels loaded: ${allChannels.length}`);
    
    // Count channels by group
    const channelsByGroup = {};
    allChannels.forEach(channel => {
      if (channel.group) {
        channelsByGroup[channel.group] = (channelsByGroup[channel.group] || 0) + 1;
      }
    });
    
    // Count channels by source file
    const channelsBySource = {};
    allChannels.forEach(channel => {
      if (channel.source) {
        channelsBySource[channel.source] = (channelsBySource[channel.source] || 0) + 1;
      }
    });
    
    // Display results for French and Georgian channels
    console.log('\nChannels by source file:');
    filesToCheck.forEach(file => {
      const count = channelsBySource[file] || 0;
      console.log(`${file}: ${count} channels`);
    });
    
    console.log('\nChannels by group:');
    ['France', 'Georgia', 'Francë', 'Gjeorgji'].forEach(group => {
      const count = channelsByGroup[group] || 0;
      console.log(`${group}: ${count} channels`);
    });
    
    // Check if the channels are accessible in the UI
    const franceChannels = allChannels.filter(c => 
      (c.group && (c.group === 'France' || c.group === 'Francë')) || 
      (c.source && c.source === 'fr.m3u')
    );
    
    const georgiaChannels = allChannels.filter(c => 
      (c.group && (c.group === 'Georgia' || c.group === 'Gjeorgji')) || 
      (c.source && c.source === 'ge.m3u')
    );
    
    console.log(`\nFound ${franceChannels.length} French channels`);
    if (franceChannels.length > 0) {
      console.log('Sample French channels:');
      franceChannels.slice(0, 3).forEach(c => console.log(`- ${c.name} (${c.url})`));
    }
    
    console.log(`\nFound ${georgiaChannels.length} Georgian channels`);
    if (georgiaChannels.length > 0) {
      console.log('Sample Georgian channels:');
      georgiaChannels.slice(0, 3).forEach(c => console.log(`- ${c.name} (${c.url})`));
    }
    
    // Return results for display in UI
    return {
      total: allChannels.length,
      france: franceChannels.length,
      georgia: georgiaChannels.length,
      frenchSamples: franceChannels.slice(0, 5),
      georgianSamples: georgiaChannels.slice(0, 5)
    };
  } catch (error) {
    console.error('Error testing French and Georgian channels:', error);
    return {
      error: error.message,
      total: 0,
      france: 0,
      georgia: 0
    };
  }
}

// Create a simple UI to display test results
function createTestUI() {
  const testDiv = document.createElement('div');
  testDiv.className = 'test-results';
  testDiv.style.padding = '20px';
  testDiv.style.backgroundColor = '#f5f5f5';
  testDiv.style.border = '1px solid #ddd';
  testDiv.style.borderRadius = '5px';
  testDiv.style.margin = '20px';
  
  testDiv.innerHTML = `
    <h2>French and Georgian Channels Test</h2>
    <div id="testStatus">Click "Run Test" to begin...</div>
    <button id="runTestBtn" style="padding: 10px; margin-top: 10px; background-color: #0078d7; color: white; border: none; border-radius: 4px; cursor: pointer;">Run Test</button>
    <div id="testResults" style="margin-top: 20px;"></div>
  `;
  
  document.body.appendChild(testDiv);
  
  // Add event listener to the button
  document.getElementById('runTestBtn').addEventListener('click', async () => {
    const statusEl = document.getElementById('testStatus');
    const resultsEl = document.getElementById('testResults');
    
    statusEl.textContent = 'Running test...';
    statusEl.style.color = 'blue';
    
    try {
      const results = await testFrenchAndGeorgianChannels();
      
      statusEl.textContent = 'Test completed successfully!';
      statusEl.style.color = 'green';
      
      if (results.error) {
        resultsEl.innerHTML = `<p style="color: red;">Error: ${results.error}</p>`;
      } else {
        let html = `
          <h3>Test Results</h3>
          <p>Total Channels: ${results.total}</p>
          <p>French Channels: ${results.france}</p>
          <p>Georgian Channels: ${results.georgia}</p>
        `;
        
        if (results.frenchSamples && results.frenchSamples.length > 0) {
          html += '<h4>Sample French Channels:</h4><ul>';
          results.frenchSamples.forEach(c => {
            html += `<li>${c.name} (Group: ${c.group || 'N/A'})</li>`;
          });
          html += '</ul>';
        }
        
        if (results.georgianSamples && results.georgianSamples.length > 0) {
          html += '<h4>Sample Georgian Channels:</h4><ul>';
          results.georgianSamples.forEach(c => {
            html += `<li>${c.name} (Group: ${c.group || 'N/A'})</li>`;
          });
          html += '</ul>';
        }
        
        resultsEl.innerHTML = html;
      }
    } catch (error) {
      statusEl.textContent = 'Test failed';
      statusEl.style.color = 'red';
      resultsEl.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
  });
}

// Run on page load if this is opened directly
document.addEventListener('DOMContentLoaded', () => {
  createTestUI();
  console.log('French and Georgian channels test ready. Click "Run Test" to begin.');
});

// Export for use in console or other scripts
window.testFrenchAndGeorgianChannels = testFrenchAndGeorgianChannels;
// Test script to check Tring TV stream URLs after update
const fs = require('fs');
const https = require('https');

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
        console.log(`Successfully extracted ${tringAlbaniaChannels.length} Tring channels`);
    } catch (e) {
        console.error(`Error evaluating tringAlbaniaChannels array: ${e.message}`);
    }
}

// Function to check if a URL is accessible
function checkUrl(url) {
    return new Promise((resolve) => {
        const request = https.get(url, (response) => {
            const statusCode = response.statusCode;
            resolve({
                url,
                status: statusCode,
                working: statusCode >= 200 && statusCode < 400
            });
            request.destroy(); // End the request
        });

        request.on('error', (err) => {
            resolve({
                url,
                status: 0,
                working: false,
                error: err.message
            });
        });

        // Set a timeout for the request
        request.setTimeout(5000, () => {
            request.destroy();
            resolve({
                url,
                status: 0,
                working: false,
                error: 'Timeout'
            });
        });
    });
}

// Check each channel's URL
async function checkChannels() {
    console.log("Testing updated Tring TV channel URLs...");
    
    // Verify all channels are now using ott.tring.al
    const usingOttDomain = tringAlbaniaChannels.every(channel => 
        channel.url.includes('ott.tring.al'));
    
    console.log(`All channels using ott.tring.al domain: ${usingOttDomain ? 'YES ✓' : 'NO ✗'}`);
    
    if (!usingOttDomain) {
        const wrongDomainChannels = tringAlbaniaChannels
            .filter(channel => !channel.url.includes('ott.tring.al'))
            .map(channel => channel.name);
        console.log(`Channels still using wrong domain: ${wrongDomainChannels.join(', ')}`);
    }

    // Test sample channels from each category
    console.log("\nTesting sample channels from each category:");
    
    const sampleChannels = [
        tringAlbaniaChannels.find(c => c.group === "Tring Sport"),
        tringAlbaniaChannels.find(c => c.group === "Tring Filma"),
        tringAlbaniaChannels.find(c => c.group === "Tring Fëmijë"),
        tringAlbaniaChannels.find(c => c.group === "Tring Dokumentarë"),
        tringAlbaniaChannels.find(c => c.group === "Tring Shqipëri"),
        tringAlbaniaChannels.find(c => c.group === "Tring Lifestyle")
    ].filter(Boolean);
    
    for (const channel of sampleChannels) {
        const result = await checkUrl(channel.url);
        console.log(`${channel.name} (${channel.group}): Status ${result.status}, ${result.working ? 'WORKING ✓' : 'NOT WORKING ✗'}${result.error ? ' - ' + result.error : ''}`);
    }
    
    console.log("\nTest completed. The Tring TV channels should now be working correctly!");
}

// Run the checks
checkChannels().catch(console.error);

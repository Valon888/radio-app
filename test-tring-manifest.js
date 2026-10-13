// Advanced test script to debug Tring TV stream manifest errors
const fs = require('fs');
const https = require('https');
const http = require('http');
const URL = require('url').URL;

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

// Function to check HTTP headers and follow redirects
function checkStreamUrl(url) {
    return new Promise((resolve) => {
        const parsedUrl = new URL(url);
        const options = {
            method: 'HEAD',
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        };

        const protocol = parsedUrl.protocol === 'https:' ? https : http;
        
        const req = protocol.request(options, (response) => {
            // Check if we need to follow a redirect
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                console.log(`   Redirect: ${response.statusCode} -> ${response.headers.location}`);
                // Follow the redirect
                checkStreamUrl(response.headers.location).then(resolve);
            } else {
                // Get content-type to verify it's a stream
                const contentType = response.headers['content-type'] || 'unknown';
                const contentLength = response.headers['content-length'] || 'unknown';
                
                resolve({
                    url,
                    finalUrl: response.headers.location || url,
                    status: response.statusCode,
                    contentType,
                    contentLength,
                    headers: response.headers,
                    working: response.statusCode >= 200 && response.statusCode < 400 &&
                             (contentType.includes('mpegurl') || contentType.includes('octet-stream') || 
                              contentType.includes('video') || contentType.includes('audio'))
                });
            }
            req.end();
        });

        req.on('error', (err) => {
            resolve({
                url,
                status: 0,
                working: false,
                error: err.message
            });
        });

        // Set a timeout for the request
        req.setTimeout(10000, () => {
            req.destroy();
            resolve({
                url,
                status: 0,
                working: false,
                error: 'Timeout'
            });
        });

        req.end();
    });
}

// Function to check if M3U8 content is valid
function checkM3U8Content(url) {
    return new Promise((resolve) => {
        const parsedUrl = new URL(url);
        const options = {
            method: 'GET',
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        };

        const protocol = parsedUrl.protocol === 'https:' ? https : http;
        
        const req = protocol.request(options, (response) => {
            // Check if we need to follow a redirect
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                // Follow the redirect
                checkM3U8Content(response.headers.location).then(resolve);
                return;
            }
            
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
                // Limit data to avoid memory issues
                if (data.length > 20000) {
                    response.destroy();
                }
            });
            
            response.on('end', () => {
                const isValid = data.includes('#EXTM3U'); // Basic check for M3U8 format
                const hasSegments = data.includes('#EXTINF') || data.includes('.ts');
                const isGeoblocked = data.toLowerCase().includes('geo') || data.toLowerCase().includes('region');
                
                resolve({
                    valid: isValid,
                    hasSegments,
                    isGeoblocked,
                    firstLines: data.split('\n').slice(0, 10).join('\n')
                });
            });
        });

        req.on('error', (err) => {
            resolve({
                valid: false,
                error: err.message
            });
        });

        req.setTimeout(10000, () => {
            req.destroy();
            resolve({
                valid: false,
                error: 'Timeout'
            });
        });

        req.end();
    });
}

// Test alternative domain patterns for Tring
async function testAlternativeDomains() {
    const baseName = "junior_1080p.m3u8";
    const domains = [
        "https://ott.tring.al/delta/105/out/u/",
        "https://ott-vod.tring.al/delta/105/out/u/",
        "https://ott-live.tring.al/delta/105/out/u/",
        "https://tringo.tring.al/delta/105/out/u/",
        "https://live.tring.al/delta/105/out/u/",
        "https://stream.tring.al/delta/105/out/u/"
    ];
    
    console.log("Testing alternative Tring domains...");
    for (const domain of domains) {
        const url = domain + baseName;
        console.log(`\nChecking ${url}`);
        
        const headerCheck = await checkStreamUrl(url);
        console.log(`Status: ${headerCheck.status}, Content-Type: ${headerCheck.contentType}`);
        
        if (headerCheck.working) {
            const contentCheck = await checkM3U8Content(url);
            console.log(`Valid M3U8: ${contentCheck.valid}, Has Segments: ${contentCheck.hasSegments}`);
            if (contentCheck.isGeoblocked) {
                console.log("WARNING: Stream appears to be geo-blocked");
            }
        }
    }
}

// Check all Tring channels for issues
async function checkAllTringChannels() {
    console.log("\nChecking all Tring channels...");
    
    const results = {
        working: [],
        notWorking: []
    };
    
    for (const channel of tringAlbaniaChannels) {
        process.stdout.write(`Testing ${channel.name}... `);
        
        const headerCheck = await checkStreamUrl(channel.url);
        if (headerCheck.working) {
            const contentCheck = await checkM3U8Content(headerCheck.finalUrl || channel.url);
            
            if (contentCheck.valid && contentCheck.hasSegments) {
                process.stdout.write("WORKING ✓\n");
                results.working.push(channel.name);
            } else {
                process.stdout.write("MANIFEST ERROR ✗\n");
                console.log(`  - Issue: ${contentCheck.valid ? 'No segments found' : 'Invalid manifest'}`);
                if (contentCheck.error) {
                    console.log(`  - Error: ${contentCheck.error}`);
                }
                results.notWorking.push({
                    name: channel.name,
                    url: channel.url,
                    issue: contentCheck.error || 'Invalid manifest'
                });
            }
        } else {
            process.stdout.write("NOT WORKING ✗\n");
            console.log(`  - Status: ${headerCheck.status}`);
            if (headerCheck.error) {
                console.log(`  - Error: ${headerCheck.error}`);
            }
            results.notWorking.push({
                name: channel.name,
                url: channel.url,
                issue: headerCheck.error || `HTTP ${headerCheck.status}`
            });
        }
    }
    
    return results;
}

// Main function
async function main() {
    console.log("=== TRING TV STREAM DIAGNOSTICS ===\n");
    
    // First test alternative domains
    await testAlternativeDomains();
    
    // Then check all channels
    const results = await checkAllTringChannels();
    
    // Summary
    console.log("\n=== SUMMARY ===");
    console.log(`Working channels: ${results.working.length}/${tringAlbaniaChannels.length}`);
    console.log(`Not working channels: ${results.notWorking.length}/${tringAlbaniaChannels.length}`);
    
    if (results.notWorking.length > 0) {
        console.log("\nProblematic channels:");
        results.notWorking.forEach(ch => {
            console.log(`- ${ch.name}: ${ch.issue}`);
        });
    }
}

main().catch(console.error);

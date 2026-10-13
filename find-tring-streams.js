// Test script to find working Tring TV URL patterns
const https = require('https');
const URL = require('url').URL;

// Function to check HTTP headers and follow redirects
function checkUrl(url, description) {
    return new Promise((resolve) => {
        console.log(`\nTesting ${description}: ${url}`);
        
        const parsedUrl = new URL(url);
        const options = {
            method: 'HEAD',
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        };

        const req = https.request(options, (response) => {
            console.log(`Status: ${response.statusCode}`);
            
            // Check if we need to follow a redirect
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                console.log(`Redirects to: ${response.headers.location}`);
                // Follow the redirect with a GET request to check content
                checkContent(response.headers.location).then(resolve);
            } else {
                // Get content-type to verify it's a stream
                const contentType = response.headers['content-type'] || 'unknown';
                console.log(`Content-Type: ${contentType}`);
                resolve({
                    url,
                    status: response.statusCode,
                    contentType,
                    working: response.statusCode >= 200 && response.statusCode < 400
                });
            }
            req.end();
        });

        req.on('error', (err) => {
            console.log(`Error: ${err.message}`);
            resolve({
                url,
                status: 0,
                working: false,
                error: err.message
            });
        });

        req.setTimeout(10000, () => {
            req.destroy();
            console.log("Error: Request timeout");
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

// Function to check content
function checkContent(url) {
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

        const req = https.request(options, (response) => {
            console.log(`Content Status: ${response.statusCode}`);
            const contentType = response.headers['content-type'] || 'unknown';
            console.log(`Content-Type: ${contentType}`);
            
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
                // Limit data to avoid memory issues
                if (data.length > 5000) {
                    response.destroy();
                }
            });
            
            response.on('end', () => {
                const isM3U8 = data.includes('#EXTM3U');
                const hasSegments = data.includes('#EXTINF') || data.includes('.ts');
                
                console.log(`Valid M3U8: ${isM3U8}`);
                console.log(`Has segments: ${hasSegments}`);
                
                if (isM3U8) {
                    console.log("First few lines:");
                    console.log(data.split('\n').slice(0, 5).join('\n'));
                }
                
                resolve({
                    url,
                    status: response.statusCode,
                    contentType,
                    isM3U8,
                    hasSegments,
                    working: isM3U8 && hasSegments
                });
            });
        });

        req.on('error', (err) => {
            console.log(`Content Error: ${err.message}`);
            resolve({
                url,
                status: 0,
                working: false,
                error: err.message
            });
        });

        req.setTimeout(10000, () => {
            req.destroy();
            console.log("Content Error: Request timeout");
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

// Test several URL patterns
async function testUrlPatterns() {
    console.log("=== TESTING TRING TV URL PATTERNS ===");
    
    const patterns = [
        {
            url: "https://ott.tring.al/delta/105/out/u/junior_1080p.m3u8",
            desc: "Original pattern with ott.tring.al"
        },
        {
            url: "https://fe.tring.al/webapp/delta/105/out/u/junior_1080p.m3u8",
            desc: "Redirected pattern with webapp"
        },
        {
            url: "http://iptvtree.net:8080/rapidiptv/shhT6NQKB7sC5y7t/290335",
            desc: "Alternative IPTV provider - Tring Junior"
        },
        {
            url: "https://fe.tring.al/out/u/junior_1080p.m3u8",
            desc: "Simplified path on fe.tring.al"
        },
        {
            url: "https://fe.tring.al/out/u/tring/junior_1080p.m3u8",
            desc: "Alternative path with tring subdirectory"
        },
        {
            url: "https://tring-api.dott.al/delta/105/out/u/junior_1080p.m3u8",
            desc: "API domain from tring.al"
        },
        {
            url: "https://api.tring.al/delta/105/out/u/junior_1080p.m3u8",
            desc: "Direct API domain"
        },
        {
            url: "https://api.tring.al/iptvapi/junior_1080p.m3u8",
            desc: "IPTV API path"
        }
    ];
    
    for (const pattern of patterns) {
        await checkUrl(pattern.url, pattern.desc);
    }
    
    console.log("\n=== TESTING COMPLETED ===");
}

testUrlPatterns().catch(console.error);

// Create a test file with updated patterns for Tring TV channels
const tringAlbaniaPatterns = [
    // Testing various patterns that might work
    { name: "Tring Junior", patterns: [
        "https://mfe.clipsrv.com/service/tvchannels/1/2edb310c1d9c/App/junior/junior.m3u8",
        "https://mfe01.tring.al/delta/105/out/u/junior_1080p.m3u8",
        "https://mfe.clipsrv.com/service/tvchannels/1/2edb310c1d9c/iptvtring/junior/junior.m3u8"
    ]},
    { name: "Tring Sport 1", patterns: [
        "https://mfe.clipsrv.com/service/tvchannels/1/2edb310c1d9c/App/sport1/sport1.m3u8",
        "https://mfe01.tring.al/delta/105/out/u/sport1_1080p.m3u8",
        "https://mfe.clipsrv.com/service/tvchannels/1/2edb310c1d9c/iptvtring/sport1/sport1.m3u8"
    ]},
    { name: "Vizion Plus", patterns: [
        "https://mfe.clipsrv.com/service/tvchannels/1/2edb310c1d9c/App/vizionplus/vizionplus.m3u8",
        "https://mfe01.tring.al/delta/105/out/u/vizionplus_1080p.m3u8"
    ]}
];

// Function to check URLs
function checkUrl(url) {
    return new Promise((resolve) => {
        const https = require('https');
        const URL = require('url').URL;
        
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
            resolve({
                url,
                status: response.statusCode,
                working: response.statusCode >= 200 && response.statusCode < 400
            });
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

        req.setTimeout(5000, () => {
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

// Test all patterns
async function testPatterns() {
    console.log("=== TESTING NEW TRING TV PATTERNS ===\n");
    
    for (const channel of tringAlbaniaPatterns) {
        console.log(`Testing patterns for ${channel.name}:`);
        
        for (const url of channel.patterns) {
            process.stdout.write(`  ${url} ... `);
            const result = await checkUrl(url);
            
            if (result.working) {
                process.stdout.write(`WORKING (${result.status}) ✓\n`);
            } else {
                process.stdout.write(`FAILED (${result.status}) ✗`);
                if (result.error) {
                    process.stdout.write(` - ${result.error}`);
                }
                process.stdout.write('\n');
            }
        }
        console.log();
    }
}

testPatterns().catch(console.error);

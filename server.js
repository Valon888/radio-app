const http = require('http');
const fs = require('fs');
const path = require('path');

// Allow port to be specified from command line argument
const PORT = process.argv[2] ? parseInt(process.argv[2]) : 3002;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.m3u': 'audio/x-mpegurl',
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.mjs': 'text/javascript',
};

const https = require('https');
const { URL } = require('url');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Expose-Headers': '*',
};

function proxyUrl(target) {
  return '/proxy?url=' + encodeURIComponent(target);
}

// Rewrite every URI inside an HLS playlist so segments/keys also go through the proxy
function rewritePlaylist(text, baseUrl) {
  const abs = (u) => { try { return new URL(u, baseUrl).toString(); } catch (e) { return u; } };
  return text.split(/\r?\n/).map((line) => {
    if (!line.trim()) return line;
    if (line.startsWith('#')) {
      return line.replace(/URI="([^"]+)"/g, (m, u) => `URI="${proxyUrl(abs(u))}"`);
    }
    return proxyUrl(abs(line.trim()));
  }).join('\n');
}

function handleProxy(req, res, redirects = 0, forcedTarget) {
  // Mbrojtje: mos lejo faqe të tjera (cross-site) ta përdorin proxy-n tënd lokal
  const origin = req.headers.origin;
  if (origin) {
    let ok = false;
    try { ok = new URL(origin).host === req.headers.host; } catch { /* i pavlefshëm */ }
    if (!ok) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden origin');
      return;
    }
  }

  if (req.url.startsWith('/proxy?ping=1')) {
    res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': 'text/plain' });
    res.end('mini-iptv-proxy');
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  let target = forcedTarget;
  if (!target) {
    try {
      target = new URL(req.url, 'http://localhost').searchParams.get('url');
    } catch (e) { /* ignore */ }
  }
  if (!target || !/^https?:\/\//i.test(target)) {
    res.writeHead(400, { ...CORS_HEADERS, 'Content-Type': 'text/plain' });
    res.end('Missing or invalid url parameter');
    return;
  }

  let u;
  try { u = new URL(target); } catch (e) {
    res.writeHead(400, { ...CORS_HEADERS, 'Content-Type': 'text/plain' });
    res.end('Invalid url');
    return;
  }

  const lib = u.protocol === 'https:' ? https : http;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    'Accept': '*/*',
    'Referer': u.origin + '/',
    'Origin': u.origin,
  };
  if (req.headers.range) headers.Range = req.headers.range;

  const upstream = lib.request({
    protocol: u.protocol,
    hostname: u.hostname,
    port: u.port || undefined,
    path: u.pathname + u.search,
    method: 'GET',
    headers,
    timeout: 15000,
    rejectUnauthorized: false, // many IPTV hosts have broken/mismatched certificates
  }, (up) => {
    if (up.statusCode >= 300 && up.statusCode < 400 && up.headers.location && redirects < 5) {
      up.resume();
      handleProxy(req, res, redirects + 1, new URL(up.headers.location, target).toString());
      return;
    }

    const ctype = String(up.headers['content-type'] || '');
    const isPlaylist = /mpegurl/i.test(ctype) || /\.m3u8?(\?|$)/i.test(u.pathname + u.search);

    if (isPlaylist && up.statusCode === 200) {
      const chunks = [];
      up.on('data', (c) => chunks.push(c));
      up.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        if (!body.trim().startsWith('#EXTM3U')) {
          res.writeHead(502, { ...CORS_HEADERS, 'Content-Type': 'text/plain' });
          res.end('Upstream did not return a valid playlist');
          return;
        }
        const out = rewritePlaylist(body, target);
        res.writeHead(200, {
          ...CORS_HEADERS,
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-cache',
        });
        res.end(out);
      });
      up.on('error', () => { if (!res.headersSent) res.writeHead(502, CORS_HEADERS); res.end(); });
      return;
    }

    const outHeaders = { ...CORS_HEADERS, 'Cache-Control': 'no-cache' };
    ['content-type', 'content-length', 'content-range', 'accept-ranges'].forEach((h) => {
      if (up.headers[h]) outHeaders[h] = up.headers[h];
    });
    res.writeHead(up.statusCode, outHeaders);
    up.pipe(res);
    up.on('error', () => res.end());
  });

  upstream.on('timeout', () => upstream.destroy(new Error('timeout')));
  upstream.on('error', (err) => {
    if (!res.headersSent) {
      res.writeHead(502, { ...CORS_HEADERS, 'Content-Type': 'text/plain' });
    }
    res.end('Proxy error: ' + err.message);
  });
  req.on('close', () => upstream.destroy());
  upstream.end();
}

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // Stream proxy: /proxy?url=<encoded>  (CORS, HTTP→HTTPS, rewrites HLS playlists)
  if (req.url.startsWith('/proxy?') || req.url === '/proxy') {
    handleProxy(req, res);
    return;
  }

  // Special route for diagnostics
  if (req.url === '/diagnostics' || req.url === '/diag' || req.url === '/fix') {
    fs.readFile('./diagnostics.html', (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h1>Error</h1><p>Failed to load diagnostics page: ${err.message}</p>`);
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content, 'utf-8');
        console.log('Served diagnostics page');
      }
    });
    return;
  }
  
  // Special route for Kosovo test page
  if (req.url === '/kosovo-test' || req.url === '/xk-test' || req.url === '/kosovo') {
    fs.readFile('./kosovo-test.html', (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h1>Error</h1><p>Failed to load Kosovo test page: ${err.message}</p>`);
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content, 'utf-8');
        console.log('Served Kosovo test page');
      }
    });
    return;
  }

  // Special route to check Kosovo channels
  if (req.url === '/kosovo-info') {
    try {
      const xkFilePath = './xk.m3u';
      const kosovoChannelsFile = fs.readFileSync(xkFilePath, 'utf8');
      
      // Check if the request wants JSON
      const wantsJson = req.headers.accept && req.headers.accept.includes('application/json');
      
      if (wantsJson) {
        // Parse M3U file to extract channel info
        const lines = kosovoChannelsFile.split('\n');
        const channels = [];
        let currentChannel = null;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          if (line.startsWith('#EXTINF')) {
            // Parse channel info
            const nameMatch = line.match(/,(.+)$/);
            const logoMatch = line.match(/tvg-logo="([^"]+)"/);
            const groupMatch = line.match(/group-title="([^"]+)"/);
            const idMatch = line.match(/tvg-id="([^"]+)"/);
            
            currentChannel = {
              name: nameMatch ? nameMatch[1].trim() : 'Unknown Channel',
              group: groupMatch ? groupMatch[1] : 'Undefined',
              logo: logoMatch ? logoMatch[1] : '',
              id: idMatch ? idMatch[1] : '',
              rawInfo: line
            };
          } else if (line && !line.startsWith('#') && currentChannel) {
            // This is a URL line
            currentChannel.url = line;
            channels.push(currentChannel);
            currentChannel = null;
          }
        }
        
        // Get file stats
        const stats = fs.statSync(xkFilePath);
        
        // Return JSON response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'Kosovo channels served successfully',
          fileExists: true,
          fileSize: stats.size,
          lastModified: stats.mtime,
          channelCount: channels.length,
          channels: channels
        }));
        console.log(`Kosovo channels served as JSON: ${channels.length} channels found`);
      } else {
        // Return HTML response
        res.writeHead(200, { 'Content-Type': 'text/html' });
        
        // Build HTML response
        let html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Kosovo Channels Info</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; }
              pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow: auto; }
              .success { color: green; font-weight: bold; }
              .count { font-weight: bold; color: blue; }
              table { border-collapse: collapse; width: 100%; margin: 20px 0; }
              th, td { text-align: left; padding: 8px; border: 1px solid #ddd; }
              th { background-color: #f2f2f2; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .json-link { display: block; margin: 20px 0; padding: 10px; background: #f0f0f0; border-radius: 5px; text-decoration: none; }
            </style>
          </head>
          <body>
            <h1>Kosovo Channels Information</h1>
            <p><span class="success">✓</span> Kosovo channels file loaded successfully!</p>
            <p>Channel count: <span class="count">${(kosovoChannelsFile.match(/#EXTINF/g) || []).length}</span></p>
            <a href="/kosovo-info" class="json-link" onclick="fetch('/kosovo-info', {headers: {Accept: 'application/json'}}).then(r => r.json()).then(console.log); return false;">View JSON data in console</a>
            <h2>File Preview:</h2>
            <pre>${kosovoChannelsFile.substring(0, 500)}...</pre>
            <p><a href="/">Back to Channel List</a> | <a href="/diagnostics">Go to Diagnostics</a></p>
          </body>
          </html>
        `;
        
        res.end(html);
        console.log('Kosovo channels served as HTML');
      }
      return;
    } catch (e) {
      console.error('Error reading Kosovo channels:', e);
      
      const wantsJson = req.headers.accept && req.headers.accept.includes('application/json');
      
      if (wantsJson) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'Error accessing Kosovo channels',
          error: e.message,
          errorStack: e.stack
        }));
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h1>Error</h1><p>Failed to load Kosovo channels: ${e.message}</p>`);
      }
      return;
    }
  }

  // Special route to show Turkish channels info
  if (req.url === '/turkish-info') {
    try {
      const turkishChannelsFile = fs.readFileSync('./turkish-channels.js', 'utf8');
      const match = turkishChannelsFile.match(/const turkishChannels = \[([\s\S]*?)\];/);
      
      if (match) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        
        // Extract unique groups
        const groups = new Set();
        const turkishChannelsStr = match[1];
        const groupMatches = turkishChannelsStr.matchAll(/group: "([^"]+)"/g);
        
        for (const match of groupMatches) {
          groups.add(match[1]);
        }
        
        // Build HTML response
        let html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Turkish Channels Info</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; }
              ul { list-style-type: none; padding: 0; }
              li { margin: 5px 0; padding: 5px; background: #f5f5f5; border-radius: 3px; }
              .group-count { font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Turkish Channels Information</h1>
            <p>Total Turkish channels loaded: ${turkishChannelsStr.match(/name:/g)?.length || 0}</p>
            <h2>Groups Found:</h2>
            <ul>
        `;
        
        // Add each group
        for (const group of Array.from(groups).sort()) {
          // Count channels in this group
          const groupRegex = new RegExp(`group: "${group}"`, 'g');
          const count = (turkishChannelsStr.match(groupRegex) || []).length;
          html += `<li><span class="group-count">${count}</span> channels in group: ${group}</li>`;
        }
        
        html += `
            </ul>
            <p><a href="/">Back to Channel List</a></p>
          </body>
          </html>
        `;
        
        res.end(html);
        return;
      }
    } catch (e) {
      console.error('Error reading Turkish channels:', e);
    }
  }

  // Handle the root URL
  let filePath = '.' + req.url;
  
  // Remove query parameters from URL
  try {
    filePath = decodeURIComponent(filePath.split('?')[0]);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad request');
    return;
  }

  // Mos lejo dalje nga dosja e projektit (../)
  const resolved = path.resolve(filePath);
  if (resolved !== process.cwd() && !resolved.startsWith(process.cwd() + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // Handle root URL or directories
  if (filePath === './' || filePath === '.' || !path.extname(filePath)) {
    filePath = './index.html';
  }
  
  console.log(`Trying to serve file: ${filePath}`);

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  // Special handling for xk.m3u (Kosovo channels) to ensure priority
  if (filePath === './xk.m3u') {
    fs.readFile(filePath, (error, content) => {
      if (error) {
        console.log(`Error reading Kosovo channels file: ${filePath}`, error);
        res.writeHead(500);
        res.end(`Error loading Kosovo channels: ${error.code}`);
      } else {
        res.writeHead(200, { 'Content-Type': 'audio/x-mpegurl' });
        res.end(content, 'utf-8');
        console.log('Kosovo channels served successfully');
      }
    });
    return;
  }

  // First check if path is a directory
  fs.stat(filePath, (err, stats) => {
    if (err) {
      // Path doesn't exist at all, serve 404
      console.log(`Path not found: ${filePath}`);
      fs.readFile('./404.html', (err, content) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(`
            <h1>404 Not Found</h1>
            <p>The file you requested could not be found.</p>
            <p>Requested path: ${filePath}</p>
            <p><a href="/">Go back to home page</a></p>
          `);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        }
      });
      return;
    }
    
    // If it's a directory, serve index.html
    if (stats.isDirectory()) {
      fs.readFile('./index.html', (err, content) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(`
            <h1>404 Not Found</h1>
            <p>Could not load the default index page.</p>
            <p><a href="/">Go back to home page</a></p>
          `);
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
          console.log(`Served index.html for directory: ${filePath}`);
        }
      });
      return;
    }
    
    // It's a regular file, try to read and serve it
    fs.readFile(filePath, (error, content) => {
      if (error) {
        console.log(`Error reading file: ${filePath}`, error);
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
        console.error(error);
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });
});

// Si parazgjedhje dëgjon vetëm te localhost (proxy-ja nuk duhet të jetë e hapur për rrjetin).
// Për ta hapur nga telefoni/TV në LAN: HOST=0.0.0.0 node server.js
const HOST = process.env.HOST || '127.0.0.1';
server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/`);
  console.log(`Open http://localhost:${PORT}/ in your browser`);
});
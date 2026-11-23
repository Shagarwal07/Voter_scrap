/**
 * Render Keep-Alive Script
 * Pings your deployed Render service every 10 minutes to prevent the free tier from sleeping.
 * 
 * Usage:
 *   node scripts/keepalive.js https://your-app.onrender.com
 */

const https = require('https');
const http = require('http');

const targetUrl = process.argv[2] || process.env.RENDER_APP_URL;

if (!targetUrl) {
  console.error('Error: Please provide the Render service URL.');
  console.log('Usage: node scripts/keepalive.js https://your-app.onrender.com');
  process.exit(1);
}

const pingUrl = targetUrl.replace(/\/+$/, '') + '/api/health';
const INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

function ping() {
  const client = pingUrl.startsWith('https') ? https : http;
  const start = Date.now();

  client.get(pingUrl, (res) => {
    const elapsed = Date.now() - start;
    console.log(`[${new Date().toLocaleTimeString()}] Pinged ${pingUrl} - Status: ${res.statusCode} (${elapsed}ms)`);
  }).on('error', (err) => {
    console.error(`[${new Date().toLocaleTimeString()}] Ping failed: ${err.message}`);
  });
}

console.log(`Starting Keep-Alive ping worker for: ${pingUrl}`);
console.log(`Ping frequency: Every 10 minutes`);

// Immediate ping, then schedule interval
ping();
setInterval(ping, INTERVAL_MS);

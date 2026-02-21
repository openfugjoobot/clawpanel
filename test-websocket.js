#!/usr/bin/env node
/**
 * WebSocket Test Script for ClawPanel
 * 
 * Usage:
 *   node test-websocket.js [username] [password]
 * 
 * Default credentials: admin/admin (or from env vars)
 */

const WebSocket = require('ws');

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';
const USERNAME = process.argv[2] || process.env.DASHBOARD_USERNAME || 'admin';
const PASSWORD = process.argv[3] || process.env.DASHBOARD_PASSWORD || 'admin';

// Determine protocol based on SSL
const PROTOCOL = 'wss'; // Always use wss (secure)
const WS_URL = `${PROTOCOL}://${HOST}:${PORT}/ws`;

console.log('========================================');
console.log('WebSocket Connection Test');
console.log('========================================');
console.log(`URL: ${WS_URL}`);
console.log(`Username: ${USERNAME}`);
console.log(`Password: ${'*'.repeat(PASSWORD.length)}`);
console.log('');

// Encode credentials for Basic Auth
const credentials = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

// Create WebSocket connection with custom headers
const ws = new WebSocket(WS_URL, {
  headers: {
    'Authorization': `Basic ${credentials}`
  },
  // For testing self-signed certs
  rejectUnauthorized: false,
});

// Connection opened
ws.on('open', () => {
  console.log('[✓] Connected successfully!');
  console.log('');
  console.log('Sending ping...');
  
  // Send a ping
  ws.send(JSON.stringify({
    type: 'ping',
    timestamp: new Date().toISOString()
  }));
});

// Message received
ws.on('message', (data) => {
  try {
    const event = JSON.parse(data.toString());
    console.log(`[←] Received: ${event.type}`);
    console.log('Payload:', JSON.stringify(event.payload, null, 2));
    console.log(`Timestamp: ${event.timestamp}`);
    
    if (event.type === 'auth.success') {
      console.log('');
      console.log('[✓] Authentication successful!');
      console.log(`    Connected as: ${event.payload.userId}`);
      console.log(`    Connection time: ${event.payload.connectionTime}`);
      console.log('');
      console.log('Waiting for more messages (Ctrl+C to exit)...');
    }
    
    if (event.type === 'pong') {
      console.log('[✓] Pong response received!');
    }
  } catch (err) {
    console.log(`[←] Raw message: ${data}`);
  }
  console.log('---');
});

// Error handling
ws.on('error', (error) => {
  console.error('[✗] Connection error:', error.message);
  if (error.message.includes('401')) {
    console.error('    Authentication failed - check username/password');
  }
  if (error.message.includes('ECONNREFUSED')) {
    console.error('    Server not running - start the server first');
  }
  process.exit(1);
});

// Connection closed
ws.on('close', (code, reason) => {
  console.log(`[✗] Connection closed (code: ${code})`);
  if (reason) {
    console.log(`    Reason: ${reason}`);
  }
  process.exit(0);
});

// Keep alive with periodic pings
const pingInterval = setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'ping',
      timestamp: new Date().toISOString()
    }));
  }
}, 30000);

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\nClosing connection...');
  clearInterval(pingInterval);
  ws.close();
});

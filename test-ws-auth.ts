// Quick WebSocket test script
import WebSocket from 'ws';

const WS_URL = 'ws://127.0.0.1:3000/ws';
const USERNAME = 'admin';
const PASSWORD = 'admin';

// Valid credentials test
console.log('Test 1: Connecting with valid credentials...');
const authHeader = 'Basic ' + Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
const ws1 = new WebSocket(WS_URL, {
  headers: {
    Authorization: authHeader
  }
});

ws1.on('open', () => {
  console.log('✓ Test 1 PASSED: Connected with valid credentials');
  ws1.close();
});

ws1.on('error', (err) => {
  console.log('✗ Test 1 FAILED:', err.message);
});

// Invalid credentials test
setTimeout(() => {
  console.log('\nTest 2: Connecting with invalid credentials...');
  const ws2 = new WebSocket(WS_URL, {
    headers: {
      Authorization: 'Basic ' + Buffer.from('bad:user').toString('base64')
    },
    timeout: 5000,
  });

  ws2.on('error', (err) => {
    if (err.message.includes('401') || err.message.includes('Unauthorized')) {
      console.log('✓ Test 2 PASSED: 401 rejection on invalid credentials');
    } else {
      console.log('✗ Test 2 FAILED (unexpected error):', err.message);
    }
  });
}, 2000);

// No credentials test  
setTimeout(() => {
  console.log('\nTest 3: Connecting with no credentials...');
  const ws3 = new WebSocket(WS_URL, {
    timeout: 5000,
  });

  ws3.on('error', (err) => {
    if (err.message.includes('401') || err.message.includes('Unauthorized')) {
      console.log('✓ Test 3 PASSED: 401 rejection without credentials');
    } else {
      console.log('✗ Test 3 FAILED (unexpected error):', err.message);
    }
  });
}, 4000);

setTimeout(() => {
  console.log('\n--- All tests completed ---');
  process.exit(0);
}, 7000);

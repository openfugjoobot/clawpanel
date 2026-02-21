# WebSocket Integration Research for Issue #22

## Executive Summary

This document covers best practices for integrating WebSocket support into an Express + TypeScript backend using the `ws` library, including HTTPS/WSS sharing, Basic Auth authentication, project structure, and client reconnection patterns.

---

## 1. Best Practice: Sharing Express HTTPS Server with `ws`

### Overview
The `ws` library can share the same HTTPS server instance as Express, eliminating the need for separate ports and simplifying deployment.

### Recommended Implementation

```typescript
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import https from 'https';
import fs from 'fs';

const app = express();

// Your Express routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create HTTPS server
const server = https.createServer(
  {
    cert: fs.readFileSync('cert.pem'),
    key: fs.readFileSync('key.pem'),
  },
  app
);

// Create WebSocket server attached to HTTPS server
const wss = new WebSocketServer({
  server, // Shares the same HTTPS server
  path: '/ws', // Optional: specific path for WebSocket
});

// Handle WebSocket connections
wss.on('connection', (ws: WebSocket, req) => {
  console.log(`New connection from ${req.socket.remoteAddress}`);
  
  ws.on('message', (data) => {
    console.log('Received:', data.toString());
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

server.listen(443, () => {
  console.log('HTTPS + WSS server running on port 443');
});
```

### Key Points

| Aspect | Recommendation |
|--------|----------------|
| Server Sharing | Pass `server` option to `WebSocketServer` |
| Port Management | Single port for HTTP(S) and WS(S) |
| Path Separation | Use `path` option for dedicated WS endpoint |
| Connection Handling | Use `verifyClient` for pre-connection checks |

### TypeScript Integration

```typescript
import { WebSocket, WebSocketServer, RawData } from 'ws';
import { IncomingMessage } from 'http';

interface ExtendedWebSocket extends WebSocket {
  isAuthenticated?: boolean;
  userId?: string;
  connectionTime?: Date;
}

wss.on('connection', (ws: ExtendedWebSocket, req: IncomingMessage) => {
  ws.connectionTime = new Date();
  // ...
});
```

---

## 2. Authentication Pattern: Basic Auth over WSS

### Why Basic Auth over WSS?

Since WebSocket connections start with an HTTP handshake, we can authenticate during the upgrade request. Over **WSS (WebSocket Secure)**, credentials are encrypted in transit.

### Server-Side Implementation

#### Option A: `verifyClient` (Recommended)

```typescript
import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';

const AUTH_HEADER = 'authorization';
const EXPECTED_CREDENTIALS = Buffer.from('user:pass').toString('base64');

const wss = new WebSocketServer({
  server,
  verifyClient: (info, cb) => {
    const authHeader = info.req.headers[AUTH_HEADER];
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      cb(false, 401, 'Unauthorized');
      return;
    }
    
    const credentials = authHeader.split(' ')[1];
    
    // Validate credentials
    if (credentials !== EXPECTED_CREDENTIALS) {
      cb(false, 403, 'Forbidden');
      return;
    }
    
    // Store user info for connection handler
    (info.req as any).userId = 'user';
    cb(true);
  },
});
```

#### Option B: Per-Message Auth (More Flexible)

```typescript
interface AuthMessage {
  type: 'auth';
  token: string;
}

wss.on('connection', (ws: ExtendedWebSocket) => {
  let authenticated = false;
  
  ws.on('message', (data: RawData) => {
    if (!authenticated) {
      try {
        const msg: AuthMessage = JSON.parse(data.toString());
        if (msg.type === 'auth' && validateToken(msg.token)) {
          authenticated = true;
          ws.isAuthenticated = true;
          ws.send(JSON.stringify({ type: 'auth_success' }));
          return;
        }
      } catch {
        ws.close(1008, 'Authentication required');
        return;
      }
    }
    
    // Handle authenticated messages...
  });
  
  // Auto-close if not authenticated within 10 seconds
  setTimeout(() => {
    if (!authenticated) {
      ws.close(1008, 'Authentication timeout');
    }
  }, 10000);
});
```

### Client-Side Implementation

```typescript
class AuthenticatedWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private credentials: string;

  constructor(url: string, username: string, password: string) {
    this.url = url;
    // Encode credentials for Basic Auth header
    this.credentials = `Basic ${btoa(`${username}:${password}`)}`;
  }

  connect(): void {
    // Browser WebSocket doesn't support custom headers directly
    // Use subprotocols or connect then authenticate
    this.ws = new WebSocket(this.url, ['json']);
    
    // Alternative: authenticate after connection
    this.ws.onopen = () => {
      this.ws?.send(JSON.stringify({
        type: 'auth',
        token: this.credentials
      }));
    };
  }
}
```

### Token-Based Alternative (Recommended for Production)

```typescript
// Server middleware to validate Bearer tokens
const verifyClient = (info: { origin: string; secure: boolean; req: IncomingMessage }, cb: (res: boolean, code?: number, message?: string, headers?: OutgoingHttpHeaders) => void) => {
  const token = info.req.headers['sec-websocket-protocol']; // Use subprotocol for token
  
  if (!token || !validateJWT(token)) {
    cb(false, 401, 'Invalid token');
    return;
  }
  
  cb(true);
};

// Client: pass token as subprotocol
const ws = new WebSocket('wss://api.example.com/ws', [jwtToken]);
```

---

## 3. Recommended Project Structure

```
src/
├── index.ts                 # Entry point - server initialization
├── config/
│   └── websocket.ts         # WebSocket configuration
├── server.ts                # HTTPS/HTTP server setup
├── websocket/
│   ├── index.ts             # WebSocket server factory
│   ├── server.ts            # WebSocketServer instance
│   ├── handlers/
│   │   ├── connection.ts    # Connection lifecycle
│   │   ├── message.ts       # Message routing
│   │   └── auth.ts          # Authentication logic
│   ├── types/
│   │   └── websocket.ts     # TypeScript interfaces
│   └── utils/
│       └── heartbeat.ts     # Ping/pong handling
├── services/
│   └── broadcast.ts         # Broadcasting utilities
└── middleware/
    └── websocket-auth.ts    # Auth middleware
```

### Key Files

#### `src/websocket/index.ts`

```typescript
import { WebSocketServer } from 'ws';
import { Server } from 'https';
import { createConnectionHandler } from './handlers/connection';
import { verifyClient } from '../middleware/websocket-auth';

export function initializeWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    verifyClient,
    // Connection limits
    maxPayload: 1024 * 1024, // 1MB
    perMessageDeflate: {
      zlibDeflateOptions: { level: 6 },
      clientNoContextTakeover: true,
    },
  });

  wss.on('connection', createConnectionHandler(wss));
  
  // Global error handling
  wss.on('error', (error) => {
    console.error('WebSocket Server Error:', error);
  });

  return wss;
}
```

#### `src/websocket/handlers/connection.ts`

```typescript
import { WebSocket, WebSocketServer, RawData } from 'ws';
import { IncomingMessage } from 'http';
import { messageRouter } from './message';

interface ClientInfo {
  userId: string;
  connectedAt: Date;
  lastPing: Date;
}

const clients = new Map<WebSocket, ClientInfo>();

export function createConnectionHandler(wss: WebSocketServer) {
  return (ws: WebSocket, req: IncomingMessage): void => {
    const userId = (req as any).userId || 'anonymous';
    
    // Store client info
    clients.set(ws, {
      userId,
      connectedAt: new Date(),
      lastPing: new Date(),
    });

    console.log(`Client connected: ${userId} (${clients.size} total)`);

    // Set up event handlers
    ws.on('message', (data: RawData) => messageRouter(ws, data, userId));
    
    ws.on('close', (code: number, reason: Buffer) => {
      clients.delete(ws);
      console.log(`Client disconnected: ${userId} (${clients.size} remaining)`);
    });
    
    ws.on('error', (error: Error) => {
      console.error(`WebSocket error for ${userId}:`, error);
      clients.delete(ws);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      userId,
      timestamp: new Date().toISOString(),
    }));
  };
}

export { clients };
```

#### `src/websocket/types/websocket.ts`

```typescript
import { WebSocket } from 'ws';

export interface ExtendedWebSocket extends WebSocket {
  isAlive?: boolean;
  userId?: string;
  subscribedChannels?: Set<string>;
}

export interface WebSocketMessage {
  type: string;
  payload?: unknown;
  timestamp?: string;
}

export type MessageHandler = (
  ws: ExtendedWebSocket,
  payload: unknown,
  userId: string
) => void | Promise<void>;
```

---

## 4. Client Reconnection Patterns

### Exponential Backoff Implementation

```typescript
interface ReconnectConfig {
  initialDelay: number;      // Initial delay in ms (default: 1000)
  maxDelay: number;          // Maximum delay in ms (default: 30000)
  factor: number;            // Exponential factor (default: 2)
  maxAttempts: number;       // Max reconnection attempts (default: Infinity)
  jitter: boolean;           // Add random jitter (default: true)
}

class ReconnectingWebSocket extends EventTarget {
  private ws: WebSocket | null = null;
  private url: string;
  private protocols: string | string[] | undefined;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private config: ReconnectConfig;
  private shouldReconnect = true;

  public readyState = WebSocket.CONNECTING;

  constructor(
    url: string,
    protocols?: string | string[],
    config: Partial<ReconnectConfig> = {}
  ) {
    super();
    this.url = url;
    this.protocols = protocols;
    this.config = {
      initialDelay: 1000,
      maxDelay: 30000,
      factor: 2,
      maxAttempts: Infinity,
      jitter: true,
      ...config,
    };
    this.connect();
  }

  private connect(): void {
    try {
      this.ws = new WebSocket(this.url, this.protocols);
      this.setupEventHandlers();
    } catch (error) {
      this.handleError(error);
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = (event) => {
      this.readyState = WebSocket.OPEN;
      this.reconnectAttempts = 0;
      this.dispatchEvent(new Event('open'));
    };

    this.ws.onmessage = (event) => {
      this.dispatchEvent(new MessageEvent('message', { data: event.data }));
    };

    this.ws.onclose = (event) => {
      this.readyState = WebSocket.CLOSED;
      this.dispatchEvent(new CloseEvent('close', event));
      
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (event) => {
      this.dispatchEvent(new Event('error'));
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxAttempts!) {
      this.dispatchEvent(new Event('maxreconnect'));
      return;
    }

    const delay = this.calculateDelay();
    this.reconnectAttempts++;

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private calculateDelay(): number {
    const { initialDelay, maxDelay, factor, jitter } = this.config;
    let delay = initialDelay! * Math.pow(factor!, this.reconnectAttempts);
    delay = Math.min(delay, maxDelay!);
    
    if (jitter) {
      // Add 0-30% jitter
      delay += delay * 0.3 * Math.random();
    }
    
    return Math.floor(delay);
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      throw new Error('WebSocket is not open');
    }
  }

  close(code?: number, reason?: string): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.ws?.close(code, reason);
  }
}

export default ReconnectingWebSocket;
```

### Usage Example

```typescript
const ws = new ReconnectingWebSocket('wss://api.example.com/ws', [], {
  initialDelay: 1000,
  maxDelay: 30000,
  factor: 2,
  maxAttempts: 10,
  jitter: true,
});

ws.addEventListener('open', () => {
  console.log('Connected');
  ws.send(JSON.stringify({ type: 'subscribe', channel: 'updates' }));
});

ws.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
});

ws.addEventListener('close', () => {
  console.log('Disconnected');
});
```

### Reconnection Delay Pattern Table

| Attempt | Base Delay | With Jitter |
|---------|-----------|-------------|
| 1 | 1,000ms | 1,000-1,300ms |
| 2 | 2,000ms | 2,000-2,600ms |
| 3 | 4,000ms | 4,000-5,200ms |
| 4 | 8,000ms | 8,000-10,400ms |
| 5+ | 30,000ms | 30,000-39,000ms |

---

## 5. Common Pitfalls and Solutions

### Pitfall 1: Memory Leaks from Uncleaned Connections

**Problem:** Not removing closed connections from tracking collections.

```typescript
// ❌ BAD: Never removes closed connections
const clients: WebSocket[] = [];
wss.on('connection', (ws) => {
  clients.push(ws);
});
```

**Solution:**
```typescript
// ✅ GOOD: Proper cleanup
const clients = new Set<WebSocket>();
wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
});
```

### Pitfall 2: Missing Error Handling

**Problem:** Unhandled errors crash the server.

```typescript
// ❌ BAD: No error handling
ws.on('message', (data) => {
  const parsed = JSON.parse(data); // Can throw
});
```

**Solution:**
```typescript
// ✅ GOOD: Proper error handling
ws.on('message', (data) => {
  try {
    const parsed = JSON.parse(data.toString());
    // Process message...
  } catch (error) {
    console.error('Invalid message format:', error);
    ws.send(JSON.stringify({ type: 'error', message: 'Invalid format' }));
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
  // Don't crash - just log
});
```

### Pitfall 3: Synchronous Broadcasting Blocks Event Loop

**Problem:** Broadcasting to many clients blocks the server.

```typescript
// ❌ BAD: Synchronous loop
function broadcast(data: string) {
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data); // Blocks if client slow
    }
  }
}
```

**Solution:**
```typescript
// ✅ GOOD: Non-blocking with error handling
async function broadcast(data: string): Promise<void> {
  const promises = Array.from(clients).map(async (client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        await new Promise<void>((resolve, reject) => {
          client.send(data, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } catch (error) {
        console.error('Failed to send to client:', error);
        clients.delete(client);
      }
    }
  });
  
  await Promise.allSettled(promises);
}
```

### Pitfall 4: No Heartbeat Detection

**Problem:** Can't detect silently disconnected clients (ghost connections).

**Solution:**
```typescript
// Server-side heartbeat
function heartbeat(ws: ExtendedWebSocket): void {
  ws.isAlive = true;
}

wss.on('connection', (ws: ExtendedWebSocket) => {
  ws.isAlive = true;
  ws.on('pong', () => heartbeat(ws));
});

// Heartbeat interval
const interval = setInterval(() => {
  wss.clients.forEach((ws: ExtendedWebSocket) => {
    if (!ws.isAlive) {
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});
```

### Pitfall 5: Message Size DoS

**Problem:** Clients send huge messages causing memory issues.

**Solution:**
```typescript
const wss = new WebSocketServer({
  server,
  maxPayload: 100 * 1024, // 100KB limit
});
```

### Pitfall 6: Not Validating Message Types

**Problem:** Missing type guards lead to runtime errors.

**Solution:**
```typescript
interface Message {
  type: 'chat' | 'ping' | 'subscribe';
  payload?: unknown;
}

function isValidMessage(data: unknown): data is Message {
  if (typeof data !== 'object' || data === null) return false;
  const msg = data as Record<string, unknown>;
  return typeof msg.type === 'string' && ['chat', 'ping', 'subscribe'].includes(msg.type);
}
```

### Pitfall 7: No Rate Limiting

**Problem:** Clients flood the server with messages.

**Solution:**
```typescript
const rateLimits = new Map<WebSocket, { count: number; resetTime: number }>();

function checkRateLimit(ws: WebSocket, maxRequests: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const limit = rateLimits.get(ws);
  
  if (!limit || now > limit.resetTime) {
    rateLimits.set(ws, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (limit.count >= maxRequests) {
    return false;
  }
  
  limit.count++;
  return true;
}
```

---

## Summary Checklist

### Server Setup
- [ ] Share HTTPS server with `ws` using `server` option
- [ ] Configure `maxPayload` to prevent DoS
- [ ] Enable `perMessageDeflate` for bandwidth optimization
- [ ] Use `verifyClient` for connection-level authentication

### Authentication
- [ ] Use WSS (encrypted) for production
- [ ] Implement `verifyClient` or per-message auth
- [ ] Set authentication timeout for security
- [ ] Consider JWT tokens via subprotocols

### Connection Management
- [ ] Use `Set` or `Map` for client tracking
- [ ] Clean up on `close` and `error` events
- [ ] Implement heartbeat/ping-pong
- [ ] Handle errors gracefully

### Client-Side
- [ ] Implement exponential backoff reconnection
- [ ] Add jitter to prevent thundering herd
- [ ] Maximum retry limit to avoid infinite loops

### Security
- [ ] Validate all message formats
- [ ] Implement rate limiting
- [ ] Sanitize user input
- [ ] Close connections on auth failure
- [ ] Set appropriate timeouts

---

## References

- `ws` library documentation: https://github.com/websockets/ws
- WebSocket RFC 6455: https://tools.ietf.org/html/rfc6455
- Express.js best practices
- TypeScript WebSocket patterns

---

*Research compiled for Issue #22 - WebSocket Integration*
*Date: 2026-02-21*

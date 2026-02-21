# DESIGN.md - WebSocket Real-Time Dashboard

**Issue:** #22 - Feature: Add WebSocket support for real-time dashboard updates  
**Based on:** REQUIREMENTS.md + RESEARCH.md  
**Author:** DevOrchestrator  
**Date:** 2026-02-21

---

## 1. Architecture Overview

### System Context Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      ClawPanel Server                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Express HTTPS Server (3001)              │   │
│  │                                                      │   │
│  │   ┌─────────────┐  ┌──────────────┐               │   │
│  │   │ REST API    │  │  WSS /ws     │               │   │
│  │   │ Endpoints   │  │  WebSocket   │               │   │
│  │   └─────────────┘  └──────────────┘               │   │
│  │                            │                        │   │
│  │                            ▼                        │   │
│  │   ┌─────────────────────────────────────────┐     │   │
│  │   │  WebSocketServer (ws library)           │     │   │
│  │   │  - verifyClient (auth)                  │     │   │
│  │   │  - connection management                │     │   │
│  │   └─────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Events:                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Session     │  │ Agent        │  │ Cron         │        │
│  │ Events      │  │ Events       │  │ Events       │        │
│  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘        │
│         │                │                 │                │
│         └────────────────┴─────────────────┘                │
│                          │                                  │
│                          ▼                                  │
│                  ┌──────────────┐                          │
│                  │   BROADCAST  │                          │
│                  │   to all     │                          │
│                  │   clients    │                          │
│                  └──────────────┘                          │
└─────────────────────────────────────────────────────────────┘
                                    │
                                    │ WebSocket Connection
                                    ▼
                         ┌──────────────────────┐
                         │   Browser Client     │
                         │                      │
                         │  ┌───────────────┐   │
                         │  │  React Hook   │   │
                         │  │ useWebSocket  │   │
                         │  └───────┬───────┘   │
                         │          │           │
                         │          ▼           │
                         │  ┌───────────────┐   │
                         │  │ Event Handler │   │
                         │  │ Redux/Zustand│   │
                         │  └───────────────┘   │
                         └──────────────────────┘
```

---

## 2. Component Design

### 2.1 Backend Components

| Component | File | Responsibility |
|-----------|------|----------------|
| WebSocket Server | `src/websocket/server.ts` | Initialize WSS, handle upgrades |
| Auth Handler | `src/websocket/auth.ts` | verifyClient logic, Basic Auth |
| Connection Manager | `src/websocket/manager.ts` | Track clients, broadcast |
| Event Broadcaster | `src/websocket/broadcaster.ts` | Send events to clients |
| Types | `src/websocket/types.ts` | WebSocket interfaces |

### 2.2 Frontend Components

| Component | File | Responsibility |
|-----------|------|----------------|
| WebSocket Hook | `src/hooks/useWebSocket.ts` | Connect, reconnect, receive |
| Event Handler | `src/websocket/handlers.ts` | Process incoming events |
| Connection Status | `src/components/ConnectionStatus.tsx` | UI indicator |

---

## 3. API Specification

### 3.1 Connection Endpoint

```
URL: wss://localhost:3001/ws
Protocol: WebSocket (RFC 6455)
Subprotocol: None (raw JSON)

Headers (during handshake):
  Authorization: Basic base64(username:password)
```

### 3.2 Authentication Flow

```
1. Client sends HTTP UPGRADE request with Basic Auth header
2. Server verifyClient extracts credentials
3. Server validates against process.env (DASHBOARD_USERNAME/PASSWORD)
4. Connection accepted → WebSocket established
5. Connection rejected (401) → Auth failed
```

### 3.3 Event Schema (JSON)

```typescript
// Server → Client Events
interface WebSocketEvent {
  type: 'session.created' | 'session.killed' | 
        'agent.status' | 'cron.executed' | 'gateway.status' |
        'ping' | 'pong' | 'error';
  timestamp: string; // ISO 8601
  payload: unknown;
}

// Client → Server Events
interface ClientEvent {
  type: 'ping' | 'ack' | 'subscribe';
  timestamp: string;
  payload?: unknown;
}
```

### 3.4 Event Payloads

```typescript
// session.created
type SessionCreatedPayload = {
  sessionKey: string;
  agentId: string;
  kind: 'direct' | 'cron' | 'subagent';
  label?: string;
};

// session.killed
type SessionKilledPayload = {
  sessionKey: string;
  agentId: string;
};

// agent.status
type AgentStatusPayload = {
  agentId: string;
  status: 'running' | 'idle' | 'error';
  activeSessionCount: number;
  lastActivity?: string;
};

// cron.executed
type CronExecutedPayload = {
  jobId: string;
  command: string;
  exitCode: number;
  stdout?: string;
  stderr?: string;
  durationMs: number;
};

// gateway.status
type GatewayStatusPayload = {
  status: 'running' | 'stopped' | 'error';
  version: string;
  uptime: number;
};
```

---

## 4. Data Flow

### 4.1 Session Events Flow

```
User spawn session
     │
     ▼
┌──────────────┐
│ POST /api/   │
│ sessions/    │
│ spawn        │
└──────┬───────┘
       │
       │ spawn successful
       ▼
┌────────────────────┐
│ Create session     │
│ in memory          │
└──────┬─────────────┘
       │
       │ event emitted
       ▼
┌────────────────────┐
│ broadcastEvent({   │
│   type: 'session.  │
│   created'         │
│ })                 │
└──────┬─────────────┘
       │
       │ sent to all
       │ ws clients
       ▼
     ┌────┐
     │ 🌐 │ Client A
     └────┘
     ┌────┐
     │ 🌐 │ Client B
     └────┘
```

### 4.2 Reconnection Flow

```
Client disconnects (network issue)
     │
     ▼
┌────────────────────┐
useWebSocket detects
onclose event
└──────┬─────────────┘
       │
       │ schedule reconnect
       │ (exponential backoff)
       ▼
┌────────────────────┐
Attempt reconnect    │
└──────┬─────────────┘
       │ success?
       ├── Yes → Resume
       └── No  → Retry (max 10)
```

---

## 5. Implementation Details

### 5.1 Backend Structure

```typescript
// src/websocket/types.ts
interface ExtendedWebSocket extends WebSocket {
  isAuthenticated: boolean;
  userId: string;
  connectionTime: Date;
  lastPing: Date;
}

// src/websocket/auth.ts
export const verifyClient = (
  info: { origin: string; req: IncomingMessage },
  cb: (result: boolean, code?: number, message?: string) => void
): void => {
  // Extract Basic Auth from headers
  // Validate against process.env
  // Callback with result
};

// src/websocket/manager.ts
class ConnectionManager {
  private clients: Set<ExtendedWebSocket> = new Set();
  
  add(ws: ExtendedWebSocket): void;
  remove(ws: ExtendedWebSocket): void;
  broadcast(event: WebSocketEvent): void;
  getConnectionCount(): number;
}

export const connectionManager = new ConnectionManager();

// src/websocket/broadcaster.ts
export function broadcastEvent(type: string, payload: unknown): void {
  const event: WebSocketEvent = {
    type: type as WebSocketEvent['type'],
    timestamp: new Date().toISOString(),
    payload,
  };
  connectionManager.broadcast(event);
}
```

### 5.2 Frontend Structure

```typescript
// src/hooks/useWebSocket.ts
export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);
  
  useEffect(() => {
    // Create WebSocket connection
    // Setup reconnect logic
    // Handle events
  }, []);
  
  return { isConnected, lastEvent, reconnect };
}
```

---

## 6. Error Handling

### Server-Side Errors

| Error | Cause | Response |
|-------|-------|----------|
| 401 Unauthorized | Invalid credentials | Close connection with code 1008 |
| 403 Forbidden | Valid auth, no permission | Close connection |
| 1006 Abnormal | Network issue | Log, client reconnects |
| Parse Error | Invalid JSON | Send error event, keep open |

### Client-Side Errors

| Error | Cause | Response |
|-------|-------|----------|
| Connection Failed | Server down | Exponential backoff retry |
| Auth Failed (401) | Wrong password | Stop retry, notify user |
| Message Error | JSON parse fail | Log, continue |
| Timeout | No ping/pong | Force reconnect |

---

## 7. Security

1. **WSS Only**: Enforce `wss://` in production (TLS encryption)
2. **Basic Auth**: Validate credentials during handshake, not per-message
3. **No Sensitive Data**: Don't broadcast passwords, tokens, secrets
4. **Rate Limiting**: Max 1 connection per user (optional)
5. **Origin Check**: Verify `Origin` header matches expected domain
6. **Input Validation**: Validate all event payloads before broadcast

---

## 8. Testing Strategy

### Unit Tests
- WebSocket server initialization
- verifyClient auth logic
- ConnectionManager (add/remove/broadcast)
- Reconnect logic (backoff calculation)

### Integration Tests
- Full connect → auth → event → disconnect flow
- Multiple clients receiving same event
- Reconnect after network drop
- Auth failure handling

### Manual QA
1. Open 2+ dashboard tabs
2. Spawn session in one tab
3. Verify other tabs update automatically
4. Kill backend, restart, verify auto-reconnect

---

## 9. Deployment Notes

- **Port**: Shares Express HTTPS port (3001)
- **Proxy**: If behind nginx, enable WebSocket support:
  ```nginx
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  ```
- **Firewall**: Ensure port 3001 is open for WSS

---

**Ready for Phase 3: Implementation**

# REQUIREMENTS.md - WebSocket Real-Time Dashboard Updates

**Issue:** #22 - Feature: Add WebSocket support for real-time dashboard updates
**Status:** Phase 0 - Requirements Definition
**Author:** DevOrchestrator
**Date:** 2026-02-21

---

## 1. Problem Statement

**Current State:** The ClawPanel dashboard requires manual refresh or 30-second polling to see updates to:
- Active sessions (new sessions, killed sessions)
- Agent status changes
- Cron job executions
- Gateway status changes

**Pain Points:**
- Users don't see changes immediately
- Polling creates unnecessary server load
- No notification when something important happens

---

## 2. User Story

**As a** ClawPanel user  
**I want** to see real-time updates on the dashboard  
**So that** I can immediately respond to changes without manual refresh

**Acceptance Criteria:**
- [ ] Dashboard auto-updates when sessions change
- [ ] Dashboard auto-updates when agents change status
- [ ] Dashboard auto-updates when cron jobs execute
- [ ] Dashboard auto-updates when gateway status changes
- [ ] Connection automatically reconnects if dropped
- [ ] Works over HTTPS with WSS (secure WebSocket)

---

## 3. Functional Requirements

### 3.1 Backend (WebSocket Server)

| ID | Requirement | Priority |
|----|-------------|----------|
| WS-001 | Implement WebSocket server using `ws` library | P0 |
| WS-002 | Share HTTPS server/port with Express (WSS) | P0 |
| WS-003 | Authenticate WebSocket connections (same auth as REST) | P0 |
| WS-004 | Broadcast events: session.created, session.killed | P0 |
| WS-005 | Broadcast events: agent.status_changed | P0 |
| WS-006 | Broadcast events: cron.job_executed | P0 |
| WS-007 | Broadcast events: gateway.status_changed | P0 |
| WS-008 | Handle client ping/pong for connection health | P1 |
| WS-009 | Support filtering subscriptions (optional future) | P2 |

### 3.2 Frontend (WebSocket Client)

| ID | Requirement | Priority |
|----|-------------|----------|
| WS-010 | Connect to WebSocket on dashboard mount | P0 |
| WS-011 | Auto-reconnect with exponential backoff | P0 |
| WS-012 | Update local state on incoming events | P0 |
| WS-013 | Show connection status indicator | P1 |
| WS-014 | Send periodic ping to keep connection alive | P1 |
| WS-015 | Re-fetch full data on reconnect (catch up) | P2 |

### 3.3 Event Schema

```typescript
// Base event structure
interface WebSocketEvent {
  type: 'session.created' | 'session.killed' | 'agent.status' | 
        'cron.executed' | 'gateway.status' | 'ping' | 'pong';
  timestamp: string; // ISO 8601
  payload: unknown;
}

// Example: Session created
{
  type: 'session.created',
  timestamp: '2026-02-21T14:30:00Z',
  payload: {
    sessionKey: 'abc-123',
    agentId: 'research-agent',
    kind: 'direct'
  }
}

// Example: Agent status changed
{
  type: 'agent.status',
  timestamp: '2026-02-21T14:30:05Z',
  payload: {
    agentId: 'research-agent',
    status: 'running' | 'idle' | 'error',
    taskCount: 5
  }
}

// Example: Cron job executed
{
  type: 'cron.executed',
  timestamp: '2026-02-21T14:30:10Z',
  payload: {
    jobId: 'cron-001',
    command: 'crypto:test-briefing',
    exitCode: 0
  }
}
```

---

## 4. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-001 | Latency (event → client receive) | < 100ms |
| NFR-002 | Reconnect time (after disconnect) | < 3s |
| NFR-003 | Max concurrent connections | 50+ (for now) |
| NFR-004 | Event delivery guarantee | At-least-once (acceptable) |
| NFR-005 | Browser compatibility | Chrome, Firefox, Safari, Edge (last 2 versions) |

---

## 5. Scope

### In Scope
- WebSocket server on backend
- WebSocket client hook in frontend
- Event broadcasting for sessions, agents, cron, gateway
- Auto-reconnect logic
- Connection status indicator

### Out of Scope (Future)
- Rooms/channels for selective subscriptions
- Event persistence (for offline clients)
- Message queuing
- Horizontal scaling (multiple server instances)

---

## 6. Technical Constraints

- **Backend:** Express + `ws` library (native WebSocket, NOT Socket.IO)
- **Frontend:** React + native WebSocket API (no Socket.IO client)
- **Security:** Must work with existing Basic Auth + WSS (TLS)
- **Deployment:** Single-instance for now

---

## 7. Success Criteria

- [ ] Dashboard updates within 500ms of backend change
- [ ] Connection survives network hiccups (auto-reconnects)
- [ ] No memory leaks on server (connections cleaned up)
- [ ] All existing tests pass
- [ ] Manual QA: open 2 tabs, watch them sync

---

## 8. References

- GitHub Issue: #22
- WebSocket library: https://github.com/websockets/ws
- Express WebSocket integration patterns

---

**Sign-off:**

- [ ] Requirements reviewed by user
- [ ] Ready for Phase 1 (Research)


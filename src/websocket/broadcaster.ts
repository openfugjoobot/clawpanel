import { connectionManager } from './manager';
import { WebSocketEvent, WebSocketEventType } from './types';

/**
 * Broadcast a generic event to all connected WebSocket clients
 * 
 * @param type - The event type
 * @param payload - The event payload
 */
export function broadcastEvent(type: WebSocketEventType, payload: unknown): void {
  const event: WebSocketEvent = {
    type,
    timestamp: new Date().toISOString(),
    payload,
  };
  connectionManager.broadcast(event);
  console.log(`[WebSocket] Broadcasted event: ${type}`);
}

/**
 * Broadcast when a new session is created/spawned
 * 
 * @param session - The session data
 */
export function broadcastSessionCreated(session: {
  key: string;
  agentId: string;
  kind?: 'direct' | 'cron' | 'subagent';
  label?: string;
}): void {
  broadcastEvent('session.created', {
    sessionKey: session.key,
    agentId: session.agentId,
    kind: session.kind || 'direct',
    label: session.label,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Broadcast when a session is killed
 * 
 * @param sessionKey - The key of the killed session
 * @param agentId - The agent ID associated with the session (optional)
 */
export function broadcastSessionKilled(
  sessionKey: string,
  agentId?: string
): void {
  broadcastEvent('session.killed', {
    sessionKey,
    agentId,
    killedAt: new Date().toISOString(),
  });
}

/**
 * Broadcast when an agent's status changes
 * 
 * @param agentId - The agent ID
 * @param status - The agent status
 * @param activeSessionCount - Number of active sessions for this agent
 * @param lastActivity - ISO timestamp of last activity (optional)
 */
export function broadcastAgentStatus(
  agentId: string,
  status: 'running' | 'idle' | 'error',
  activeSessionCount?: number,
  lastActivity?: string
): void {
  broadcastEvent('agent.status', {
    agentId,
    status,
    activeSessionCount: activeSessionCount ?? 0,
    lastActivity,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Broadcast when a cron job is executed
 * 
 * @param jobId - The cron job ID
 * @param result - The execution result
 */
export function broadcastCronExecuted(
  jobId: string,
  result: {
    command: string;
    exitCode: number;
    stdout?: string;
    stderr?: string;
    durationMs: number;
  }
): void {
  broadcastEvent('cron.executed', {
    jobId,
    ...result,
    executedAt: new Date().toISOString(),
  });
}

/**
 * Broadcast gateway status changes
 * 
 * @param status - The gateway status
 * @param version - The gateway version (optional)
 * @param uptime - The uptime in seconds (optional)
 */
export function broadcastGatewayStatus(
  status: 'running' | 'stopped' | 'error',
  version?: string,
  uptime?: number
): void {
  broadcastEvent('gateway.status', {
    status,
    version: version || 'unknown',
    uptime: uptime || 0,
    updatedAt: new Date().toISOString(),
  });
}

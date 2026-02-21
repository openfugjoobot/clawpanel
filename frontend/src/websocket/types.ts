/**
 * WebSocket Types - Event definitions for real-time dashboard
 * Issue #22 - WebSocket Real-Time Dashboard
 */

// =============================================================================
// WebSocket Event Types
// =============================================================================

/**
 * Server → Client Event Types
 */
export type WebSocketEventType = 
  | 'session.created'
  | 'session.killed'
  | 'agent.status'
  | 'cron.executed'
  | 'gateway.status'
  | 'ping'
  | 'pong'
  | 'error';

/**
 * Client → Server Event Types
 */
export type ClientEventType = 
  | 'ping'
  | 'ack'
  | 'subscribe';

// =============================================================================
// Event Payload Interfaces
// =============================================================================

/**
 * Session Created Payload
 */
export interface SessionCreatedPayload {
  sessionKey: string;
  agentId: string;
  kind: 'direct' | 'cron' | 'subagent';
  label?: string;
}

/**
 * Session Killed Payload
 */
export interface SessionKilledPayload {
  sessionKey: string;
  agentId: string;
}

/**
 * Agent Status Payload
 */
export interface AgentStatusPayload {
  agentId: string;
  status: 'running' | 'idle' | 'error';
  activeSessionCount: number;
  lastActivity?: string;
}

/**
 * Cron Executed Payload
 */
export interface CronExecutedPayload {
  jobId: string;
  command: string;
  exitCode: number;
  stdout?: string;
  stderr?: string;
  durationMs: number;
}

/**
 * Gateway Status Payload
 */
export interface GatewayStatusPayload {
  status: 'running' | 'stopped' | 'error';
  version: string;
  uptime: number;
}

/**
 * Error Event Payload
 */
export interface ErrorEventPayload {
  message: string;
  code?: string;
}

/**
 * Union of all event payloads
 */
export type WebSocketEventPayload =
  | SessionCreatedPayload
  | SessionKilledPayload
  | AgentStatusPayload
  | CronExecutedPayload
  | GatewayStatusPayload
  | ErrorEventPayload
  | unknown; // For ping/pong events

// =============================================================================
// Main Event Interfaces
// =============================================================================

/**
 * Server → Client Event
 * Main interface for all incoming WebSocket events
 */
export interface WebSocketEvent {
  type: WebSocketEventType;
  timestamp: string; // ISO 8601
  payload: WebSocketEventPayload;
}

/**
 * Client → Server Event
 * Interface for outgoing WebSocket events
 */
export interface ClientEvent {
  type: ClientEventType;
  timestamp: string;
  payload?: unknown;
}

// =============================================================================
// Event Type Constants
// =============================================================================

export const WEBSOCKET_EVENT_TYPES = {
  SESSION_CREATED: 'session.created' as const,
  SESSION_KILLED: 'session.killed' as const,
  AGENT_STATUS: 'agent.status' as const,
  CRON_EXECUTED: 'cron.executed' as const,
  GATEWAY_STATUS: 'gateway.status' as const,
  PING: 'ping' as const,
  PONG: 'pong' as const,
  ERROR: 'error' as const,
};

export const CLIENT_EVENT_TYPES = {
  PING: 'ping' as const,
  ACK: 'ack' as const,
  SUBSCRIBE: 'subscribe' as const,
};

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard for SessionCreatedPayload
 */
export function isSessionCreatedPayload(
  payload: WebSocketEventPayload
): payload is SessionCreatedPayload {
  const p = payload as SessionCreatedPayload;
  return p !== null && typeof p === 'object' && 'sessionKey' in p && typeof p.sessionKey === 'string';
}

/**
 * Type guard for SessionKilledPayload
 */
export function isSessionKilledPayload(
  payload: WebSocketEventPayload
): payload is SessionKilledPayload {
  const p = payload as SessionKilledPayload;
  return p !== null && typeof p === 'object' && 'sessionKey' in p && typeof p.sessionKey === 'string' && 'agentId' in p && typeof p.agentId === 'string';
}

/**
 * Type guard for AgentStatusPayload
 */
export function isAgentStatusPayload(
  payload: WebSocketEventPayload
): payload is AgentStatusPayload {
  const p = payload as AgentStatusPayload;
  return p !== null && typeof p === 'object' && 'agentId' in p && typeof p.agentId === 'string' && 'status' in p && typeof p.status === 'string';
}

/**
 * Type guard for CronExecutedPayload
 */
export function isCronExecutedPayload(
  payload: WebSocketEventPayload
): payload is CronExecutedPayload {
  const p = payload as CronExecutedPayload;
  return p !== null && typeof p === 'object' && 'jobId' in p && typeof p.jobId === 'string' && 'command' in p && typeof p.command === 'string';
}

/**
 * Type guard for GatewayStatusPayload
 */
export function isGatewayStatusPayload(
  payload: WebSocketEventPayload
): payload is GatewayStatusPayload {
  const p = payload as GatewayStatusPayload;
  return p !== null && typeof p === 'object' && 'status' in p && typeof p.status === 'string' && 'version' in p && typeof p.version === 'string';
}

/**
 * Type guard for ErrorEventPayload
 */
export function isErrorEventPayload(
  payload: WebSocketEventPayload
): payload is ErrorEventPayload {
  const p = payload as ErrorEventPayload;
  return p !== null && typeof p === 'object' && 'message' in p && typeof p.message === 'string';
}

// =============================================================================
// Hook Types
// =============================================================================

/**
 * Configuration options for useWebSocket hook
 */
export interface UseWebSocketOptions {
  url: string;
  credentials: {
    username: string;
    password: string;
  };
  onEvent?: (event: WebSocketEvent) => void;
  reconnect?: boolean;
}

/**
 * Return type for useWebSocket hook
 */
export interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  lastEvent: WebSocketEvent | null;
  error: string | null;
  reconnect: () => void;
}

// =============================================================================
// WebSocket Connection State
// =============================================================================

export type WebSocketConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'
  | 'closed';

/**
 * Reconnect configuration
 */
export interface ReconnectConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Default reconnect configuration
 */
export const DEFAULT_RECONNECT_CONFIG: ReconnectConfig = {
  maxAttempts: 10,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

/**
 * Ping/Pong configuration
 */
export interface PingPongConfig {
  pingIntervalMs: number;
  pongTimeoutMs: number;
}

/**
 * Default ping/pong configuration
 */
export const DEFAULT_PING_PONG_CONFIG: PingPongConfig = {
  pingIntervalMs: 25000,
  pongTimeoutMs: 10000,
};

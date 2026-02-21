import { WebSocket } from 'ws';
import { IncomingMessage } from 'http';

/**
 * Extended WebSocket interface with custom properties
 * Used to track authentication and connection metadata
 */
export interface ExtendedWebSocket extends WebSocket {
  isAuthenticated: boolean;
  userId: string;
  connectionTime: Date;
  lastPing: Date;
}

/**
 * WebSocket event types
 */
export type WebSocketEventType =
  | 'session.created'
  | 'session.killed'
  | 'agent.status'
  | 'cron.executed'
  | 'gateway.status'
  | 'ping'
  | 'pong'
  | 'error'
  | 'auth.success'
  | 'auth.failed';

/**
 * Base WebSocket event structure
 */
export interface WebSocketEvent {
  type: WebSocketEventType;
  timestamp: string; // ISO 8601
  payload: unknown;
}

/**
 * Client-sent event types
 */
export type ClientEventType = 'ping' | 'ack' | 'subscribe' | 'unsubscribe';

/**
 * Client-sent event structure
 */
export interface ClientEvent {
  type: ClientEventType;
  timestamp: string;
  payload?: unknown;
}

/**
 * Session created event payload
 */
export interface SessionCreatedPayload {
  sessionKey: string;
  agentId: string;
  kind: 'direct' | 'cron' | 'subagent';
  label?: string;
}

/**
 * Session killed event payload
 */
export interface SessionKilledPayload {
  sessionKey: string;
  agentId: string;
}

/**
 * Agent status event payload
 */
export interface AgentStatusPayload {
  agentId: string;
  status: 'running' | 'idle' | 'error';
  activeSessionCount: number;
  lastActivity?: string;
}

/**
 * Cron executed event payload
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
 * Gateway status event payload
 */
export interface GatewayStatusPayload {
  status: 'running' | 'stopped' | 'error';
  version: string;
  uptime: number;
}

/**
 * WebSocket client info during upgrade
 */
export interface ClientInfo {
  origin: string;
  req: IncomingMessage;
}

/**
 * Verify client callback type
 */
export type VerifyClientCallback = (
  result: boolean,
  code?: number,
  message?: string
) => void;

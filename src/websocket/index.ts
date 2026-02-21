/**
 * WebSocket Module - Real-time communication for ClawPanel
 * 
 * This module provides WebSocket functionality for real-time
 * dashboard updates. It shares the HTTPS server with Express.
 * 
 * @module websocket
 */

// Types
export {
  ExtendedWebSocket,
  WebSocketEvent,
  WebSocketEventType,
  ClientEvent,
  ClientEventType,
  SessionCreatedPayload,
  SessionKilledPayload,
  AgentStatusPayload,
  CronExecutedPayload,
  GatewayStatusPayload,
  ClientInfo,
  VerifyClientCallback,
} from './types';

// Connection Management
export {
  ConnectionManager,
  connectionManager,
} from './manager';

// Authentication
export {
  verifyClient,
  verifyClientSync,
} from './auth';

// Server
export {
  createWebSocketServer,
  shutdownWebSocketServer,
  WebSocketServerOptions,
} from './server';

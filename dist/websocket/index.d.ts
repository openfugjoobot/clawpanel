/**
 * WebSocket Module - Real-time communication for ClawPanel
 *
 * This module provides WebSocket functionality for real-time
 * dashboard updates. It shares the HTTPS server with Express.
 *
 * @module websocket
 */
export { ExtendedWebSocket, WebSocketEvent, WebSocketEventType, ClientEvent, ClientEventType, SessionCreatedPayload, SessionKilledPayload, AgentStatusPayload, CronExecutedPayload, GatewayStatusPayload, ClientInfo, VerifyClientCallback, } from './types';
export { ConnectionManager, connectionManager, } from './manager';
export { verifyClient, verifyClientSync, } from './auth';
export { createWebSocketServer, shutdownWebSocketServer, WebSocketServerOptions, } from './server';
//# sourceMappingURL=index.d.ts.map
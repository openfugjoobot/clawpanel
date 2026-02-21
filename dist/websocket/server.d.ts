import { WebSocketServer } from 'ws';
import https from 'https';
/**
 * WebSocket server configuration options
 */
export interface WebSocketServerOptions {
    server: https.Server;
    path?: string;
    pingIntervalMs?: number;
}
/**
 * Create and configure the WebSocket server
 *
 * @param options - Configuration options
 * @returns Configured WebSocketServer instance
 */
export declare function createWebSocketServer(options: WebSocketServerOptions): WebSocketServer;
/**
 * Graceful shutdown helper for the WebSocket server
 *
 * @param wss - WebSocketServer instance to shut down
 */
export declare function shutdownWebSocketServer(wss: WebSocketServer): Promise<void>;
//# sourceMappingURL=server.d.ts.map
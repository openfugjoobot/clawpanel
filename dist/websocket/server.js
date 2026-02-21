"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebSocketServer = createWebSocketServer;
exports.shutdownWebSocketServer = shutdownWebSocketServer;
const ws_1 = require("ws");
const auth_1 = require("./auth");
const manager_1 = require("./manager");
/**
 * Create and configure the WebSocket server
 *
 * @param options - Configuration options
 * @returns Configured WebSocketServer instance
 */
function createWebSocketServer(options) {
    const { server, path = '/ws', pingIntervalMs = 30000 } = options;
    const wss = new ws_1.WebSocketServer({
        server,
        path,
        verifyClient: auth_1.verifyClient,
    });
    // Handle new connections
    wss.on('connection', (ws, req) => {
        const extendedWs = ws;
        const userId = req.userId || 'unknown';
        const clientIp = req.socket.remoteAddress;
        // Initialize extended properties
        // Note: isAuthenticated is set based on verifyClient having passed
        extendedWs.isAuthenticated = true;
        extendedWs.userId = userId;
        extendedWs.connectionTime = new Date();
        extendedWs.lastPing = new Date();
        // Add to connection manager
        manager_1.connectionManager.add(extendedWs);
        console.log(`[WebSocket] Client connected: ${userId} from ${clientIp}`);
        // Send connection success event
        const connectedEvent = {
            type: 'auth.success',
            timestamp: new Date().toISOString(),
            payload: {
                message: 'Connected successfully',
                userId,
                connectionTime: extendedWs.connectionTime.toISOString(),
            },
        };
        extendedWs.send(JSON.stringify(connectedEvent));
        // Handle incoming messages
        extendedWs.on('message', (data) => {
            handleClientMessage(extendedWs, data);
        });
        // Handle client disconnect
        extendedWs.on('close', (code, reason) => {
            console.log(`[WebSocket] Client closed connection: ${userId} (code: ${code}, reason: ${reason.toString() || 'none'})`);
            manager_1.connectionManager.remove(extendedWs);
        });
        // Handle errors
        extendedWs.on('error', (error) => {
            console.error(`[WebSocket] Client error for ${userId}:`, error.message);
        });
        // Handle pong (response to our ping)
        extendedWs.on('pong', () => {
            extendedWs.lastPing = new Date();
        });
    });
    // Handle server-level errors
    wss.on('error', (error) => {
        console.error('[WebSocket] Server error:', error);
    });
    // Start ping interval to keep connections alive
    const pingInterval = setInterval(() => {
        manager_1.connectionManager.getClients().forEach((client) => {
            // Check if client hasn't responded to ping in a while (60 seconds)
            const lastPingTime = client.lastPing.getTime();
            const now = Date.now();
            const pingTimeout = 60000; // 60 seconds
            if (now - lastPingTime > pingTimeout) {
                console.log(`[WebSocket] Client ${client.userId} timed out, terminating connection`);
                client.terminate();
                manager_1.connectionManager.remove(client);
                return;
            }
            // Send ping
            if (client.readyState === 1) { // WebSocket.OPEN
                client.ping();
            }
        });
    }, pingIntervalMs);
    // Clean up interval when server closes
    wss.on('close', () => {
        clearInterval(pingInterval);
        console.log('[WebSocket] Server closed');
    });
    console.log(`[WebSocket] Server initialized on path: ${path}`);
    return wss;
}
/**
 * Handle incoming messages from clients
 *
 * @param ws - The WebSocket connection
 * @param data - Raw message data
 */
function handleClientMessage(ws, data) {
    try {
        const message = data.toString();
        const event = JSON.parse(message);
        console.log(`[WebSocket] Received message from ${ws.userId}:`, event.type);
        switch (event.type) {
            case 'ping':
                // Respond with pong
                const pongEvent = {
                    type: 'pong',
                    timestamp: new Date().toISOString(),
                    payload: { receivedAt: event.timestamp },
                };
                ws.send(JSON.stringify(pongEvent));
                ws.lastPing = new Date();
                break;
            case 'ack':
                // Acknowledgment received - could be used for reliability tracking
                console.log(`[WebSocket] Ack received from ${ws.userId} for event:`, event.payload);
                break;
            case 'subscribe':
                // Subscription handling (for future selective broadcasts)
                console.log(`[WebSocket] Subscribe request from ${ws.userId}:`, event.payload);
                break;
            default:
                console.log(`[WebSocket] Unknown message type from ${ws.userId}:`, event.type);
        }
    }
    catch (error) {
        console.error(`[WebSocket] Failed to parse message from ${ws.userId}:`, error);
        const errorEvent = {
            type: 'error',
            timestamp: new Date().toISOString(),
            payload: { message: 'Invalid message format' },
        };
        ws.send(JSON.stringify(errorEvent));
    }
}
/**
 * Graceful shutdown helper for the WebSocket server
 *
 * @param wss - WebSocketServer instance to shut down
 */
function shutdownWebSocketServer(wss) {
    return new Promise((resolve) => {
        console.log('[WebSocket] Shutting down server...');
        // Close all client connections
        manager_1.connectionManager.closeAll();
        // Close the server
        wss.close(() => {
            console.log('[WebSocket] Server shutdown complete');
            resolve();
        });
        // Force close after timeout
        setTimeout(() => {
            console.log('[WebSocket] Forcing shutdown after timeout');
            resolve();
        }, 5000);
    });
}
//# sourceMappingURL=server.js.map
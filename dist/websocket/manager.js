"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionManager = exports.ConnectionManager = void 0;
/**
 * Connection limits for security
 */
const MAX_CONNECTIONS_TOTAL = 100;
const MAX_CONNECTIONS_PER_IP = 5;
/**
 * ConnectionManager - Manages WebSocket client connections
 *
 * Responsibilities:
 * - Track connected clients
 * - Broadcast events to all connected clients
 * - Provide connection statistics
 * - Enforce connection limits (DoS protection)
 */
class ConnectionManager {
    constructor() {
        this.clients = new Set();
        this.ipConnectionCounts = new Map();
    }
    /**
     * Get the singleton instance of ConnectionManager
     */
    static getInstance() {
        if (!ConnectionManager.instance) {
            ConnectionManager.instance = new ConnectionManager();
        }
        return ConnectionManager.instance;
    }
    /**
     * Check if a new connection from this IP would exceed limits
     */
    canAcceptConnection(clientIp) {
        // Check total connections
        if (this.clients.size >= MAX_CONNECTIONS_TOTAL) {
            return { allowed: false, reason: 'Maximum total connections reached' };
        }
        // Check per-IP limit
        const ipCount = this.ipConnectionCounts.get(clientIp) || 0;
        if (ipCount >= MAX_CONNECTIONS_PER_IP) {
            return { allowed: false, reason: `Maximum ${MAX_CONNECTIONS_PER_IP} connections per IP` };
        }
        return { allowed: true };
    }
    /**
     * Add a client to the connection pool
     */
    add(ws) {
        const clientIp = ws.clientIp || 'unknown';
        this.clients.add(ws);
        // Track IP connection count
        const currentCount = this.ipConnectionCounts.get(clientIp) || 0;
        this.ipConnectionCounts.set(clientIp, currentCount + 1);
        console.log(`[WebSocket] Client connected from ${clientIp}. Total: ${this.getCount()}, IP: ${currentCount + 1}`);
    }
    /**
     * Remove a client from the connection pool
     */
    remove(ws) {
        const clientIp = ws.clientIp || 'unknown';
        this.clients.delete(ws);
        // Update IP connection count
        const currentCount = this.ipConnectionCounts.get(clientIp) || 0;
        if (currentCount <= 1) {
            this.ipConnectionCounts.delete(clientIp);
        }
        else {
            this.ipConnectionCounts.set(clientIp, currentCount - 1);
        }
        console.log(`[WebSocket] Client disconnected from ${clientIp}. Total: ${this.getCount()}`);
    }
    /**
     * Broadcast an event to all connected clients
     * Automatically handles disconnected clients
     */
    broadcast(event) {
        const message = JSON.stringify(event);
        const deadClients = [];
        this.clients.forEach((client) => {
            if (client.readyState === 1) { // WebSocket.OPEN
                try {
                    client.send(message);
                }
                catch (error) {
                    console.error('[WebSocket] Failed to send message to client:', error);
                    deadClients.push(client);
                }
            }
            else {
                deadClients.push(client);
            }
        });
        // Clean up dead connections
        deadClients.forEach((client) => this.remove(client));
    }
    /**
     * Get the current number of connected clients
     */
    getCount() {
        return this.clients.size;
    }
    /**
     * Get all connected clients
     */
    getClients() {
        return Array.from(this.clients);
    }
    /**
     * Check if a specific client is connected
     */
    has(ws) {
        return this.clients.has(ws);
    }
    /**
     * Close all connections and clear the pool
     * Useful for graceful shutdown
     */
    closeAll() {
        console.log(`[WebSocket] Closing all ${this.getCount()} connections...`);
        this.clients.forEach((client) => {
            try {
                client.close(1001, 'Server shutting down');
            }
            catch (error) {
                // Client already closed
            }
        });
        this.clients.clear();
    }
}
exports.ConnectionManager = ConnectionManager;
/**
 * Singleton instance of ConnectionManager
 */
exports.connectionManager = ConnectionManager.getInstance();
//# sourceMappingURL=manager.js.map
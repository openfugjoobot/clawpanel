"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionManager = exports.ConnectionManager = void 0;
/**
 * ConnectionManager - Manages WebSocket client connections
 *
 * Responsibilities:
 * - Track connected clients
 * - Broadcast events to all connected clients
 * - Provide connection statistics
 */
class ConnectionManager {
    constructor() {
        this.clients = new Set();
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
     * Add a client to the connection pool
     */
    add(ws) {
        this.clients.add(ws);
        console.log(`[WebSocket] Client connected. Total connections: ${this.getCount()}`);
    }
    /**
     * Remove a client from the connection pool
     */
    remove(ws) {
        this.clients.delete(ws);
        console.log(`[WebSocket] Client disconnected. Total connections: ${this.getCount()}`);
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
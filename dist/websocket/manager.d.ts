import { ExtendedWebSocket, WebSocketEvent } from './types';
/**
 * ConnectionManager - Manages WebSocket client connections
 *
 * Responsibilities:
 * - Track connected clients
 * - Broadcast events to all connected clients
 * - Provide connection statistics
 */
export declare class ConnectionManager {
    private clients;
    private static instance;
    private constructor();
    /**
     * Get the singleton instance of ConnectionManager
     */
    static getInstance(): ConnectionManager;
    /**
     * Add a client to the connection pool
     */
    add(ws: ExtendedWebSocket): void;
    /**
     * Remove a client from the connection pool
     */
    remove(ws: ExtendedWebSocket): void;
    /**
     * Broadcast an event to all connected clients
     * Automatically handles disconnected clients
     */
    broadcast(event: WebSocketEvent): void;
    /**
     * Get the current number of connected clients
     */
    getCount(): number;
    /**
     * Get all connected clients
     */
    getClients(): ExtendedWebSocket[];
    /**
     * Check if a specific client is connected
     */
    has(ws: ExtendedWebSocket): boolean;
    /**
     * Close all connections and clear the pool
     * Useful for graceful shutdown
     */
    closeAll(): void;
}
/**
 * Singleton instance of ConnectionManager
 */
export declare const connectionManager: ConnectionManager;
//# sourceMappingURL=manager.d.ts.map
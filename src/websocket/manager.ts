import { ExtendedWebSocket, WebSocketEvent } from './types';

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
export class ConnectionManager {
  private clients: Set<ExtendedWebSocket> = new Set();
  private ipConnectionCounts: Map<string, number> = new Map();
  private static instance: ConnectionManager;

  private constructor() {}

  /**
   * Get the singleton instance of ConnectionManager
   */
  public static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  /**
   * Check if a new connection from this IP would exceed limits
   */
  public canAcceptConnection(clientIp: string): { allowed: boolean; reason?: string } {
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
  public add(ws: ExtendedWebSocket): void {
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
  public remove(ws: ExtendedWebSocket): void {
    const clientIp = ws.clientIp || 'unknown';
    
    this.clients.delete(ws);
    
    // Update IP connection count
    const currentCount = this.ipConnectionCounts.get(clientIp) || 0;
    if (currentCount <= 1) {
      this.ipConnectionCounts.delete(clientIp);
    } else {
      this.ipConnectionCounts.set(clientIp, currentCount - 1);
    }
    
    console.log(`[WebSocket] Client disconnected from ${clientIp}. Total: ${this.getCount()}`);
  }

  /**
   * Broadcast an event to all connected clients
   * Automatically handles disconnected clients
   */
  public broadcast(event: WebSocketEvent): void {
    const message = JSON.stringify(event);
    const deadClients: ExtendedWebSocket[] = [];

    this.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        try {
          client.send(message);
        } catch (error) {
          console.error('[WebSocket] Failed to send message to client:', error);
          deadClients.push(client);
        }
      } else {
        deadClients.push(client);
      }
    });

    // Clean up dead connections
    deadClients.forEach((client) => this.remove(client));
  }

  /**
   * Get the current number of connected clients
   */
  public getCount(): number {
    return this.clients.size;
  }

  /**
   * Get all connected clients
   */
  public getClients(): ExtendedWebSocket[] {
    return Array.from(this.clients);
  }

  /**
   * Check if a specific client is connected
   */
  public has(ws: ExtendedWebSocket): boolean {
    return this.clients.has(ws);
  }

  /**
   * Close all connections and clear the pool
   * Useful for graceful shutdown
   */
  public closeAll(): void {
    console.log(`[WebSocket] Closing all ${this.getCount()} connections...`);
    this.clients.forEach((client) => {
      try {
        client.close(1001, 'Server shutting down');
      } catch (error) {
        // Client already closed
      }
    });
    this.clients.clear();
  }
}

/**
 * Singleton instance of ConnectionManager
 */
export const connectionManager = ConnectionManager.getInstance();

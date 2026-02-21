import { ExtendedWebSocket, WebSocketEvent } from './types';

/**
 * ConnectionManager - Manages WebSocket client connections
 * 
 * Responsibilities:
 * - Track connected clients
 * - Broadcast events to all connected clients
 * - Provide connection statistics
 */
export class ConnectionManager {
  private clients: Set<ExtendedWebSocket> = new Set();
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
   * Add a client to the connection pool
   */
  public add(ws: ExtendedWebSocket): void {
    this.clients.add(ws);
    console.log(`[WebSocket] Client connected. Total connections: ${this.getCount()}`);
  }

  /**
   * Remove a client from the connection pool
   */
  public remove(ws: ExtendedWebSocket): void {
    this.clients.delete(ws);
    console.log(`[WebSocket] Client disconnected. Total connections: ${this.getCount()}`);
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

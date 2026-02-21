/**
 * ClawPanel Type Definitions
 */

// Gateway Status Interface
export interface GatewayStatus {
  status: 'online' | 'offline' | 'error';
  pid: number;
  uptime: number;
  version: string;
  startedAt: string;
}

// Session Interface
export interface Session {
  key: string;
  id: string;
  createdAt: string;
  lastActivity: string;
  requestCount: number;
  metadata?: Record<string, unknown>;
}

// Agent Interface
export interface Agent {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'error' | 'completed';
  createdAt: string;
  updatedAt: string;
  task?: string;
  result?: unknown;
  error?: string;
}

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
  metadata?: Record<string, unknown>;
}

// Cron Job Interface
export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  command: string;
  agent: string;
  status: 'ok' | 'error' | 'pending';
  lastRun: string | null;
  nextRun: string | null;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}

// Create Cron Job Payload
export interface CreateCronJobPayload {
  name: string;
  schedule: string;
  command: string;
  agent: string;
}

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
  identityName: string;
  identityEmoji?: string;
  status: 'idle' | 'running' | 'error' | 'completed';
  model?: string;
  workspace?: string;
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

// GitHub Issue Interface
export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  html_url: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  labels: Array<{
    name: string;
    color: string;
  }>;
  comments: number;
}

// GitHub Pull Request Interface
export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  html_url: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  draft: boolean;
  merged: boolean;
  merged_at: string | null;
  head: {
    label: string;
    ref: string;
  };
  base: {
    label: string;
    ref: string;
  };
}

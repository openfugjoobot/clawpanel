export interface HealthResponse {
  channels: any[];
  agents: any[];
  sessions: any[];
  status?: string;
  timestamp?: string;
}
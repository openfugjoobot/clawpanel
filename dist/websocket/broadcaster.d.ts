import { WebSocketEventType } from './types';
/**
 * Broadcast a generic event to all connected WebSocket clients
 *
 * @param type - The event type
 * @param payload - The event payload
 */
export declare function broadcastEvent(type: WebSocketEventType, payload: unknown): void;
/**
 * Broadcast when a new session is created/spawned
 *
 * @param session - The session data
 */
export declare function broadcastSessionCreated(session: {
    key: string;
    agentId: string;
    kind?: 'direct' | 'cron' | 'subagent';
    label?: string;
}): void;
/**
 * Broadcast when a session is killed
 *
 * @param sessionKey - The key of the killed session
 * @param agentId - The agent ID associated with the session (optional)
 */
export declare function broadcastSessionKilled(sessionKey: string, agentId?: string): void;
/**
 * Broadcast when an agent's status changes
 *
 * @param agentId - The agent ID
 * @param status - The agent status
 * @param activeSessionCount - Number of active sessions for this agent
 * @param lastActivity - ISO timestamp of last activity (optional)
 */
export declare function broadcastAgentStatus(agentId: string, status: 'running' | 'idle' | 'error', activeSessionCount?: number, lastActivity?: string): void;
/**
 * Broadcast when a cron job is executed
 *
 * @param jobId - The cron job ID
 * @param result - The execution result
 */
export declare function broadcastCronExecuted(jobId: string, result: {
    command: string;
    exitCode: number;
    stdout?: string;
    stderr?: string;
    durationMs: number;
}): void;
/**
 * Broadcast gateway status changes
 *
 * @param status - The gateway status
 * @param version - The gateway version (optional)
 * @param uptime - The uptime in seconds (optional)
 */
export declare function broadcastGatewayStatus(status: 'running' | 'stopped' | 'error', version?: string, uptime?: number): void;
//# sourceMappingURL=broadcaster.d.ts.map
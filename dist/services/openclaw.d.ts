import { HealthResponse, Session, Agent } from '../types';
/**
 * Get gateway health status by executing "openclaw gateway call health"
 * @returns Promise<HealthResponse> - Gateway health information
 */
export declare function gatewayHealth(): Promise<HealthResponse>;
/**
 * List all active sessions by executing "openclaw sessions list --json"
 * @returns Promise<Session[]> - Array of session objects
 */
export declare function listSessions(): Promise<Session[]>;
/**
 * Kill a specific session by key
 * @param key string - Session key to kill
 * @returns Promise<any> - Result of kill operation
 */
export declare function killSession(key: string): Promise<any>;
/**
 * List all agents by executing "openclaw agents list --json"
 * @returns Promise<Agent[]> - Array of agent objects
 */
export declare function listAgents(): Promise<Agent[]>;
/**
 * Spawn a new agent session by executing "openclaw agent --agent <agentId> --message <task>"
 * @param agentId string - Agent ID to spawn
 * @param task string - Task for the agent to perform
 * @returns Promise<{sessionKey: string}> - Session key of the spawned agent
 */
export declare function spawnAgent(agentId: string, task: string): Promise<{
    sessionKey: string;
}>;
/**
 * Kill all sessions for a specific agent
 * Note: This is a simplified implementation that kills sessions based on pattern matching
 * @param agentId string - Agent ID to kill
 * @returns Promise<void> - Resolves when operation completes
 */
export declare function killAgent(agentId: string): Promise<void>;
//# sourceMappingURL=openclaw.d.ts.map
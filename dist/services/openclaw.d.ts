import { HealthResponse, Session } from '../types';
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
//# sourceMappingURL=openclaw.d.ts.map
export interface HealthResponse {
    channels: any[];
    agents: any[];
    sessions: any[];
    status?: string;
    timestamp?: string;
}
export interface Session {
    key: string;
    updatedAt: number;
    ageMs: number;
    kind: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    contextTokens: number;
}
export interface Agent {
    id: string;
    identityName: string;
    identityEmoji: string;
    workspace: string;
    model: string;
    isDefault: boolean;
    heartbeat: any;
}
//# sourceMappingURL=index.d.ts.map
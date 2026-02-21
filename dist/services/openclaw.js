"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gatewayHealth = gatewayHealth;
exports.listSessions = listSessions;
exports.killSession = killSession;
exports.listAgents = listAgents;
exports.spawnAgent = spawnAgent;
exports.killAgent = killAgent;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execPromise = (0, util_1.promisify)(child_process_1.exec);
/**
 * Get gateway health status by executing "openclaw gateway call health"
 * @returns Promise<HealthResponse> - Gateway health information
 */
async function gatewayHealth() {
    try {
        // Execute the openclaw gateway health command
        const { stdout, stderr } = await execPromise('openclaw gateway call health');
        if (stderr) {
            throw new Error(`Gateway command error: ${stderr}`);
        }
        // Parse the JSON output
        const healthData = JSON.parse(stdout);
        return healthData;
    }
    catch (error) {
        // Handle case when gateway is offline or command fails
        if (error.code === 'ENOENT') {
            throw new Error('OpenClaw CLI not found. Is it installed?');
        }
        // Check if it's a JSON parsing error
        if (error instanceof SyntaxError) {
            throw new Error('Invalid JSON response from gateway');
        }
        // Generic error handling
        throw new Error(`Gateway unavailable: ${error.message || error}`);
    }
}
/**
 * List all active sessions by executing "openclaw sessions list --json"
 * @returns Promise<Session[]> - Array of session objects
 */
async function listSessions() {
    try {
        // Execute the openclaw sessions list command with JSON output
        const { stdout, stderr } = await execPromise('openclaw sessions list --json');
        if (stderr) {
            throw new Error(`Sessions command error: ${stderr}`);
        }
        // Parse the JSON output
        const sessionsData = JSON.parse(stdout);
        // Map the session data to our Session interface
        const sessions = sessionsData.sessions.map((session) => ({
            key: session.key,
            updatedAt: session.updatedAt,
            ageMs: session.ageMs,
            kind: session.kind,
            model: session.model,
            inputTokens: session.inputTokens || 0,
            outputTokens: session.outputTokens || 0,
            totalTokens: session.totalTokens || 0,
            contextTokens: session.contextTokens || 0
        }));
        return sessions;
    }
    catch (error) {
        // Handle case when openclaw CLI is not found or command fails
        if (error.code === 'ENOENT') {
            throw new Error('OpenClaw CLI not found. Is it installed?');
        }
        // Check if it's a JSON parsing error
        if (error instanceof SyntaxError) {
            throw new Error('Invalid JSON response from sessions command');
        }
        // Generic error handling
        throw new Error(`Failed to list sessions: ${error.message || error}`);
    }
}
/**
 * Kill a specific session by key
 * @param key string - Session key to kill
 * @returns Promise<any> - Result of kill operation
 */
async function killSession(key) {
    try {
        // Execute the openclaw sessions kill command
        const { stdout, stderr } = await execPromise(`openclaw sessions kill ${key}`);
        if (stderr) {
            throw new Error(`Kill session command error: ${stderr}`);
        }
        return {
            message: 'Session kill command executed',
            output: stdout
        };
    }
    catch (error) {
        // Handle case when openclaw CLI is not found or command fails
        if (error.code === 'ENOENT') {
            throw new Error('OpenClaw CLI not found. Is it installed?');
        }
        // Generic error handling
        throw new Error(`Failed to kill session: ${error.message || error}`);
    }
}
/**
 * List all agents by executing "openclaw agents list --json"
 * @returns Promise<Agent[]> - Array of agent objects
 */
async function listAgents() {
    try {
        // Execute the openclaw agents list command with JSON output
        const { stdout, stderr } = await execPromise('openclaw agents list --json');
        if (stderr) {
            throw new Error(`Agents command error: ${stderr}`);
        }
        // Parse the JSON output
        const agentsData = JSON.parse(stdout);
        // Map the agent data to our Agent interface
        const agents = agentsData.map((agent) => ({
            id: agent.id,
            identityName: agent.identityName,
            identityEmoji: agent.identityEmoji,
            workspace: agent.workspace,
            model: agent.model,
            isDefault: agent.isDefault,
            heartbeat: agent.heartbeat
        }));
        return agents;
    }
    catch (error) {
        // Handle case when openclaw CLI is not found or command fails
        if (error.code === 'ENOENT') {
            throw new Error('OpenClaw CLI not found. Is it installed?');
        }
        // Check if it's a JSON parsing error
        if (error instanceof SyntaxError) {
            throw new Error('Invalid JSON response from agents command');
        }
        // Generic error handling
        throw new Error(`Failed to list agents: ${error.message || error}`);
    }
}
/**
 * Spawn a new agent session by executing "openclaw agent --agent <agentId> --message <task>"
 * @param agentId string - Agent ID to spawn
 * @param task string - Task for the agent to perform
 * @returns Promise<{sessionKey: string}> - Session key of the spawned agent
 */
async function spawnAgent(agentId, task) {
    try {
        // Execute the openclaw agent command with JSON output
        const { stdout, stderr } = await execPromise(`openclaw agent --agent ${agentId} --message "${task}" --json`);
        if (stderr) {
            throw new Error(`Spawn agent command error: ${stderr}`);
        }
        // Parse the JSON output
        const result = JSON.parse(stdout);
        // Extract session key from the result if available
        const sessionKey = result.result?.meta?.agentMeta?.sessionKey || 'unknown';
        return { sessionKey };
    }
    catch (error) {
        // Handle case when openclaw CLI is not found or command fails
        if (error.code === 'ENOENT') {
            throw new Error('OpenClaw CLI not found. Is it installed?');
        }
        // Check if it's a JSON parsing error
        if (error instanceof SyntaxError) {
            throw new Error('Invalid JSON response from agent spawn command');
        }
        // Generic error handling
        throw new Error(`Failed to spawn agent: ${error.message || error}`);
    }
}
/**
 * Kill all sessions for a specific agent
 * Note: This is a simplified implementation that kills sessions based on pattern matching
 * @param agentId string - Agent ID to kill
 * @returns Promise<void> - Resolves when operation completes
 */
async function killAgent(agentId) {
    try {
        // Execute the openclaw sessions list command to get all sessions
        const { stdout, stderr } = await execPromise('openclaw sessions --json');
        if (stderr) {
            throw new Error(`List sessions command error: ${stderr}`);
        }
        // Parse the JSON output
        const sessionsData = JSON.parse(stdout);
        // Find sessions that belong to the specified agent
        const agentSessions = sessionsData.sessions.filter((session) => session.key.startsWith(`agent:${agentId}:`));
        // Kill each session for the agent
        for (const session of agentSessions) {
            try {
                await execPromise(`openclaw sessions kill ${session.key}`);
            }
            catch (error) {
                // Log error but continue with other sessions
                console.warn(`Failed to kill session ${session.key}:`, error);
            }
        }
    }
    catch (error) {
        // Handle case when openclaw CLI is not found or command fails
        if (error.code === 'ENOENT') {
            throw new Error('OpenClaw CLI not found. Is it installed?');
        }
        // Check if it's a JSON parsing error
        if (error instanceof SyntaxError) {
            throw new Error('Invalid JSON response from sessions command');
        }
        // Generic error handling
        throw new Error(`Failed to kill agent: ${error.message || error}`);
    }
}
//# sourceMappingURL=openclaw.js.map
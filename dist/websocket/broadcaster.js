"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastEvent = broadcastEvent;
exports.broadcastSessionCreated = broadcastSessionCreated;
exports.broadcastSessionKilled = broadcastSessionKilled;
exports.broadcastAgentStatus = broadcastAgentStatus;
exports.broadcastCronExecuted = broadcastCronExecuted;
exports.broadcastGatewayStatus = broadcastGatewayStatus;
const manager_1 = require("./manager");
/**
 * Broadcast a generic event to all connected WebSocket clients
 *
 * @param type - The event type
 * @param payload - The event payload
 */
function broadcastEvent(type, payload) {
    const event = {
        type,
        timestamp: new Date().toISOString(),
        payload,
    };
    manager_1.connectionManager.broadcast(event);
    console.log(`[WebSocket] Broadcasted event: ${type}`);
}
/**
 * Broadcast when a new session is created/spawned
 *
 * @param session - The session data
 */
function broadcastSessionCreated(session) {
    broadcastEvent('session.created', {
        sessionKey: session.key,
        agentId: session.agentId,
        kind: session.kind || 'direct',
        label: session.label,
        createdAt: new Date().toISOString(),
    });
}
/**
 * Broadcast when a session is killed
 *
 * @param sessionKey - The key of the killed session
 * @param agentId - The agent ID associated with the session (optional)
 */
function broadcastSessionKilled(sessionKey, agentId) {
    broadcastEvent('session.killed', {
        sessionKey,
        agentId,
        killedAt: new Date().toISOString(),
    });
}
/**
 * Broadcast when an agent's status changes
 *
 * @param agentId - The agent ID
 * @param status - The agent status
 * @param activeSessionCount - Number of active sessions for this agent
 * @param lastActivity - ISO timestamp of last activity (optional)
 */
function broadcastAgentStatus(agentId, status, activeSessionCount, lastActivity) {
    broadcastEvent('agent.status', {
        agentId,
        status,
        activeSessionCount: activeSessionCount ?? 0,
        lastActivity,
        updatedAt: new Date().toISOString(),
    });
}
/**
 * Broadcast when a cron job is executed
 *
 * @param jobId - The cron job ID
 * @param result - The execution result
 */
function broadcastCronExecuted(jobId, result) {
    broadcastEvent('cron.executed', {
        jobId,
        ...result,
        executedAt: new Date().toISOString(),
    });
}
/**
 * Broadcast gateway status changes
 *
 * @param status - The gateway status
 * @param version - The gateway version (optional)
 * @param uptime - The uptime in seconds (optional)
 */
function broadcastGatewayStatus(status, version, uptime) {
    broadcastEvent('gateway.status', {
        status,
        version: version || 'unknown',
        uptime: uptime || 0,
        updatedAt: new Date().toISOString(),
    });
}
//# sourceMappingURL=broadcaster.js.map
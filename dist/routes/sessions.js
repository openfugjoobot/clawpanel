"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const openclaw_1 = require("../services/openclaw");
const broadcaster_1 = require("../websocket/broadcaster");
const router = (0, express_1.Router)();
/**
 * GET /api/sessions
 * Get all active sessions
 */
router.get('/', async (req, res) => {
    try {
        const sessions = await (0, openclaw_1.listSessions)();
        res.json(sessions);
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to fetch sessions',
            message: error.message
        });
    }
});
/**
 * POST /api/sessions/:key/kill
 * Kill a specific session by key
 */
router.post('/:key/kill', async (req, res) => {
    try {
        const key = req.params.key;
        if (typeof key !== 'string') {
            return res.status(400).json({
                error: 'Invalid session key',
                message: 'Session key must be a string'
            });
        }
        const result = await (0, openclaw_1.killSession)(key);
        // Extract agent ID from session key (format: agent:<agentId>:<timestamp>)
        const agentId = key.startsWith('agent:') ? key.split(':')[1] : undefined;
        // Broadcast session killed event
        (0, broadcaster_1.broadcastSessionKilled)(key, agentId);
        // Broadcast agent status if we have an agent ID
        if (agentId) {
            (0, broadcaster_1.broadcastAgentStatus)(agentId, 'idle', 0);
        }
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to kill session',
            message: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=sessions.js.map
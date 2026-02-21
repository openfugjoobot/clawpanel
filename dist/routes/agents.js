"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const openclaw_1 = require("../services/openclaw");
const broadcaster_1 = require("../websocket/broadcaster");
const router = express_1.default.Router();
/**
 * GET /api/agents
 * List all agents
 */
router.get('/', async (req, res, next) => {
    try {
        const agents = await (0, openclaw_1.listAgents)();
        res.json(agents);
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/agents/:id/spawn
 * Spawn a new agent session
 */
router.post('/:id/spawn', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { task, label } = req.body;
        if (!task) {
            return res.status(400).json({ error: 'Task is required' });
        }
        const result = await (0, openclaw_1.spawnAgent)(id, task);
        // Broadcast session created event to all WebSocket clients
        (0, broadcaster_1.broadcastSessionCreated)({
            key: result.sessionKey,
            agentId: id,
            kind: 'direct',
            label: label || task.substring(0, 50),
        });
        // Broadcast agent status update
        (0, broadcaster_1.broadcastAgentStatus)(id, 'running', 1);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/agents/:id/kill
 * Kill all sessions for an agent
 */
router.post('/:id/kill', async (req, res, next) => {
    try {
        const { id } = req.params;
        await (0, openclaw_1.killAgent)(id);
        // Broadcast agent status update (sessions killed)
        (0, broadcaster_1.broadcastAgentStatus)(id, 'idle', 0);
        res.json({ message: `Agent ${id} sessions killed successfully` });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=agents.js.map
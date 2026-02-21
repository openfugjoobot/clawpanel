"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const openclaw_1 = require("../services/openclaw");
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
        const { task } = req.body;
        if (!task) {
            return res.status(400).json({ error: 'Task is required' });
        }
        const result = await (0, openclaw_1.spawnAgent)(id, task);
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
        res.json({ message: `Agent ${id} sessions killed successfully` });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=agents.js.map
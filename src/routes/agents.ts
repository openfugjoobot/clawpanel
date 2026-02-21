import express from 'express';
import { listAgents, spawnAgent, killAgent } from '../services/openclaw';

const router = express.Router();

/**
 * GET /api/agents
 * List all agents
 */
router.get('/', async (req, res, next) => {
  try {
    const agents = await listAgents();
    res.json(agents);
  } catch (error) {
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
    
    const result = await spawnAgent(id, task);
    res.json(result);
  } catch (error) {
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
    await killAgent(id);
    res.json({ message: `Agent ${id} sessions killed successfully` });
  } catch (error) {
    next(error);
  }
});

export default router;
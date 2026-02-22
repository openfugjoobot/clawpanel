import express from 'express';
import { listAgents, spawnAgent, killAgent } from '../services/openclaw';
import { broadcastSessionCreated, broadcastSessionKilled, broadcastAgentStatus } from '../websocket/broadcaster';

const router = express.Router();

// Validation helper
const isValidAgentId = (id: string): boolean => {
  // Agent IDs should be alphanumeric with hyphens/underscores
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length >= 1 && id.length <= 64;
};

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
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { task, label } = req.body;
    
    // Validate agent ID
    if (!isValidAgentId(id)) {
      return res.status(400).json({ error: 'Invalid agent ID format' });
    }
    
    if (!task || typeof task !== 'string') {
      return res.status(400).json({ error: 'Task is required and must be a string' });
    }
    
    const result = await spawnAgent(id, task);
    
    // Broadcast session created event to all WebSocket clients
    broadcastSessionCreated({
      key: result.sessionKey,
      agentId: id,
      kind: 'direct',
      label: label || task.substring(0, 50),
    });
    
    // Broadcast agent status update
    broadcastAgentStatus(id, 'running', 1);
    
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
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    
    // Validate agent ID
    if (!isValidAgentId(id)) {
      return res.status(400).json({ error: 'Invalid agent ID format' });
    }
    
    await killAgent(id);
    
    // Broadcast agent status update (sessions killed)
    broadcastAgentStatus(id, 'idle', 0);
    
    res.json({ message: `Agent ${id} sessions killed successfully` });
  } catch (error) {
    next(error);
  }
});

export default router;

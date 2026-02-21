import { Router, Request, Response } from 'express';
import { listSessions, killSession } from '../services/openclaw';
import { broadcastSessionKilled, broadcastAgentStatus } from '../websocket/broadcaster';

const router = Router();

/**
 * GET /api/sessions
 * Get all active sessions
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const sessions = await listSessions();
    res.json(sessions);
  } catch (error: any) {
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
router.post('/:key/kill', async (req: Request, res: Response) => {
  try {
    const key = req.params.key;
    if (typeof key !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid session key',
        message: 'Session key must be a string' 
      });
    }
    const result = await killSession(key);
    
    // Extract agent ID from session key (format: agent:<agentId>:<timestamp>)
    const agentId = key.startsWith('agent:') ? key.split(':')[1] : undefined;
    
    // Broadcast session killed event
    broadcastSessionKilled(key, agentId);
    
    // Broadcast agent status if we have an agent ID
    if (agentId) {
      broadcastAgentStatus(agentId, 'idle', 0);
    }
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Failed to kill session',
      message: error.message 
    });
  }
});

export default router;
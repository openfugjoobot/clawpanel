import { Router, Request, Response } from 'express';
import { listSessions, killSession } from '../services/openclaw';

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
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Failed to kill session',
      message: error.message 
    });
  }
});

export default router;
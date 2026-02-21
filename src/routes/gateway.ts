import { Router, Request, Response } from 'express';
import { gatewayHealth } from '../services/openclaw';

const router = Router();

/**
 * GET /api/gateway/status
 * Get gateway health status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const health = await gatewayHealth();
    res.json(health);
  } catch (error: any) {
    res.status(503).json({ 
      error: 'Gateway unavailable',
      message: error.message 
    });
  }
});

/**
 * POST /api/gateway/restart
 * Restart the gateway service
 */
router.post('/restart', async (req: Request, res: Response) => {
  try {
    // Execute the openclaw gateway restart command
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    const { stdout, stderr } = await execPromise('openclaw gateway restart');
    
    if (stderr) {
      throw new Error(stderr);
    }
    
    res.json({ 
      message: 'Gateway restart initiated',
      output: stdout 
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Failed to restart gateway',
      message: error.message 
    });
  }
});

export default router;
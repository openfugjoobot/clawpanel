import { Router, Request, Response } from 'express';
import { gatewayHealth } from '../services/openclaw';

const router = Router();

/**
 * GET /api/gateway/status
 * Get gateway health status - transforms raw gateway data to GatewayStatus format
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const health: any = await gatewayHealth();
    
    // Transform gateway response to GatewayStatus format
    const gatewayStatus = {
      status: health.ok ? 'online' : 'error',
      version: health.meta?.lastTouchedVersion || 'unknown',
      pid: process.pid, // Use backend PID as proxy
      uptime: health.ts ? Math.floor((Date.now() - health.ts) / 1000) : 0,
      startedAt: health.ts ? new Date(health.ts).toISOString() : new Date().toISOString(),
      // Include raw data for advanced usage
      raw: health
    };
    
    res.json(gatewayStatus);
  } catch (error: any) {
    res.status(503).json({ 
      status: 'error',
      version: 'unknown',
      pid: 0,
      uptime: 0,
      startedAt: '',
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

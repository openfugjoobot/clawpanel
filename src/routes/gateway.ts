import { Router, Request, Response } from 'express';
import { gatewayHealth } from '../services/openclaw';
import { execSync } from 'child_process';

const router = Router();

/**
 * Get OpenClaw gateway version
 */
const getGatewayVersion = (): string => {
  try {
    const version = execSync('openclaw --version', { encoding: 'utf-8', timeout: 5000 });
    return version.trim();
  } catch {
    return 'unknown';
  }
};

/**
 * GET /api/gateway/status
 * Get gateway health status - transforms raw gateway data to GatewayStatus format
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const health: any = await gatewayHealth();
    const version = getGatewayVersion();
    
    // Transform gateway response to GatewayStatus format
    const gatewayStatus = {
      status: health.ok ? 'online' : 'error',
      version: version,
      pid: process.pid,
      // Note: OpenClaw doesn't expose real uptime, so we skip this field
      // The 'ts' field is just the health check timestamp, not start time
      raw: health
    };
    
    res.json(gatewayStatus);
  } catch (error: any) {
    res.status(503).json({ 
      status: 'error',
      version: 'unknown',
      pid: 0,
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

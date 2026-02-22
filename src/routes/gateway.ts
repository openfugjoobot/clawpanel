import { Router, Request, Response } from 'express';
import { gatewayHealth } from '../services/openclaw';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { broadcastGatewayStatus } from '../websocket/broadcaster';

const router = Router();
const execFilePromise = promisify(execFile);

/**
 * Get OpenClaw gateway version
 */
const getGatewayVersion = async (): Promise<string> => {
  try {
    const { stdout } = await execFilePromise('openclaw', ['--version'], { 
      timeout: 5000 
    });
    return stdout.trim();
  } catch {
    return 'unknown';
  }
};

/**
 * GET /api/gateway/status
 * Get gateway health status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const health: any = await gatewayHealth();
    const version = await getGatewayVersion();
    
    const status = health.ok ? 'running' : 'error';
    const gatewayStatus = {
      status,
      version: version,
      pid: process.pid,
      raw: health
    };
    
    // Broadcast gateway status
    broadcastGatewayStatus(status, version);
    
    res.json(gatewayStatus);
  } catch (error: any) {
    broadcastGatewayStatus('error', 'unknown');
    
    res.status(503).json({ 
      status: 'error',
      version: 'unknown',
      pid: 0,
      error: 'Gateway unavailable'
    });
  }
});

/**
 * POST /api/gateway/restart
 * Restart the gateway service
 */
router.post('/restart', async (req: Request, res: Response) => {
  try {
    const version = await getGatewayVersion();
    
    // Broadcast stopping status before restart
    broadcastGatewayStatus('stopped', version);
    
    // Execute the openclaw gateway restart command securely
    const { stdout, stderr } = await execFilePromise(
      'openclaw', 
      ['gateway', 'restart'],
      { timeout: 30000 }
    );
    
    if (stderr) {
      console.error('[Gateway] Restart stderr:', stderr);
    }
    
    // Broadcast running status after restart
    broadcastGatewayStatus('running', version);
    
    res.json({ 
      message: 'Gateway restart initiated',
      output: stdout 
    });
  } catch (error: any) {
    broadcastGatewayStatus('error', 'unknown');
    
    console.error('[Gateway] Restart failed:', error);
    res.status(500).json({ 
      error: 'Failed to restart gateway'
    });
  }
});

export default router;

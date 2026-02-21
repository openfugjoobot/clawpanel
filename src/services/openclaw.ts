import { exec } from 'child_process';
import { promisify } from 'util';
import { HealthResponse } from '../types';

const execPromise = promisify(exec);

/**
 * Get gateway health status by executing "openclaw gateway call health"
 * @returns Promise<HealthResponse> - Gateway health information
 */
export async function gatewayHealth(): Promise<HealthResponse> {
  try {
    // Execute the openclaw gateway health command
    const { stdout, stderr } = await execPromise('openclaw gateway call health');
    
    if (stderr) {
      throw new Error(`Gateway command error: ${stderr}`);
    }
    
    // Parse the JSON output
    const healthData: HealthResponse = JSON.parse(stdout);
    return healthData;
  } catch (error: any) {
    // Handle case when gateway is offline or command fails
    if (error.code === 'ENOENT') {
      throw new Error('OpenClaw CLI not found. Is it installed?');
    }
    
    // Check if it's a JSON parsing error
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON response from gateway');
    }
    
    // Generic error handling
    throw new Error(`Gateway unavailable: ${error.message || error}`);
  }
}
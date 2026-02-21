import { exec } from 'child_process';
import { promisify } from 'util';
import { HealthResponse, Session } from '../types';

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

/**
 * List all active sessions by executing "openclaw sessions list --json"
 * @returns Promise<Session[]> - Array of session objects
 */
export async function listSessions(): Promise<Session[]> {
  try {
    // Execute the openclaw sessions list command with JSON output
    const { stdout, stderr } = await execPromise('openclaw sessions list --json');
    
    if (stderr) {
      throw new Error(`Sessions command error: ${stderr}`);
    }
    
    // Parse the JSON output
    const sessionsData = JSON.parse(stdout);
    
    // Map the session data to our Session interface
    const sessions: Session[] = sessionsData.sessions.map((session: any) => ({
      key: session.key,
      updatedAt: session.updatedAt,
      ageMs: session.ageMs,
      kind: session.kind,
      model: session.model,
      inputTokens: session.inputTokens || 0,
      outputTokens: session.outputTokens || 0,
      totalTokens: session.totalTokens || 0,
      contextTokens: session.contextTokens || 0
    }));
    
    return sessions;
  } catch (error: any) {
    // Handle case when openclaw CLI is not found or command fails
    if (error.code === 'ENOENT') {
      throw new Error('OpenClaw CLI not found. Is it installed?');
    }
    
    // Check if it's a JSON parsing error
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON response from sessions command');
    }
    
    // Generic error handling
    throw new Error(`Failed to list sessions: ${error.message || error}`);
  }
}

/**
 * Kill a specific session by key
 * @param key string - Session key to kill
 * @returns Promise<any> - Result of kill operation
 */
export async function killSession(key: string): Promise<any> {
  try {
    // Execute the openclaw sessions kill command
    const { stdout, stderr } = await execPromise(`openclaw sessions kill ${key}`);
    
    if (stderr) {
      throw new Error(`Kill session command error: ${stderr}`);
    }
    
    return { 
      message: 'Session kill command executed',
      output: stdout 
    };
  } catch (error: any) {
    // Handle case when openclaw CLI is not found or command fails
    if (error.code === 'ENOENT') {
      throw new Error('OpenClaw CLI not found. Is it installed?');
    }
    
    // Generic error handling
    throw new Error(`Failed to kill session: ${error.message || error}`);
  }
}
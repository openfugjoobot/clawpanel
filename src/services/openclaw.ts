import { execFile } from 'child_process';
import { promisify } from 'util';
import { HealthResponse, Session, Agent } from '../types';

const execFilePromise = promisify(execFile);

// Validation helpers
const isValidSessionKey = (key: string): boolean => {
  // Session keys should be alphanumeric with specific delimiters
  return /^[a-zA-Z0-9:]+$/.test(key) && key.length <= 256;
};

const isValidAgentId = (id: string): boolean => {
  // Agent IDs should be alphanumeric with hyphens/underscores
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length <= 64;
};

const sanitizeTaskInput = (task: string): string => {
  // Remove any shell metacharacters from task
  // Only allow safe characters: letters, numbers, spaces, basic punctuation
  const sanitized = task.replace(/[;&|`$(){}[\]<>\!\\]/g, '');
  // Truncate if too long
  return sanitized.slice(0, 4000);
};

/**
 * Get gateway health status by executing "openclaw gateway call health"
 * @returns Promise<HealthResponse> - Gateway health information
 */
export async function gatewayHealth(): Promise<HealthResponse> {
  try {
    const { stdout, stderr } = await execFilePromise('openclaw', ['gateway', 'call', 'health']);
    
    if (stderr) {
      throw new Error(`Gateway command error: ${stderr}`);
    }
    
    // Extract JSON from output (strip "Gateway call: health" prefix and any extra text)
    const lines = stdout.split('\n');
    let jsonStart = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('{')) {
        jsonStart = i;
        break;
      }
    }
    
    if (jsonStart === -1) {
      throw new Error('No JSON found in gateway output');
    }
    
    const jsonStr = lines.slice(jsonStart).join('\n');
    const healthData: HealthResponse = JSON.parse(jsonStr);
    return healthData;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error('OpenClaw CLI not found. Is it installed?');
    }
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON response from gateway');
    }
    throw new Error(`Gateway unavailable: ${error.message || error}`);
  }
}

/**
 * List all active sessions by executing "openclaw sessions list --json"
 * @returns Promise<Session[]> - Array of session objects
 */
export async function listSessions(): Promise<Session[]> {
  try {
    const { stdout, stderr } = await execFilePromise('openclaw', ['sessions', 'list', '--json']);
    
    if (stderr) {
      throw new Error(`Sessions command error: ${stderr}`);
    }
    
    const sessionsData = JSON.parse(stdout);
    
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
    if (error.code === 'ENOENT') {
      throw new Error('OpenClaw CLI not found. Is it installed?');
    }
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON response from sessions command');
    }
    throw new Error(`Failed to list sessions: ${error.message || error}`);
  }
}

/**
 * Kill a specific session by key
 * @param key string - Session key to kill
 * @returns Promise<any> - Result of kill operation
 */
export async function killSession(key: string): Promise<any> {
  // Validate session key format
  if (!isValidSessionKey(key)) {
    throw new Error('Invalid session key format');
  }
  
  try {
    const { stdout, stderr } = await execFilePromise('openclaw', ['sessions', 'kill', key]);
    
    if (stderr) {
      throw new Error(`Kill session command error: ${stderr}`);
    }
    
    return { 
      message: 'Session kill command executed',
      output: stdout 
    };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error('OpenClaw CLI not found. Is it installed?');
    }
    throw new Error(`Failed to kill session: ${error.message || error}`);
  }
}

/**
 * List all agents by executing "openclaw agents list --json"
 * @returns Promise<Agent[]> - Array of agent objects
 */
export async function listAgents(): Promise<Agent[]> {
  try {
    const { stdout, stderr } = await execFilePromise('openclaw', ['agents', 'list', '--json']);
    
    if (stderr) {
      throw new Error(`Agents command error: ${stderr}`);
    }
    
    const agentsData = JSON.parse(stdout);
    
    const agents: Agent[] = agentsData.map((agent: any) => ({
      id: agent.id,
      identityName: agent.identityName,
      identityEmoji: agent.identityEmoji,
      workspace: agent.workspace,
      model: agent.model,
      isDefault: agent.isDefault,
      heartbeat: agent.heartbeat
    }));
    
    return agents;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error('OpenClaw CLI not found. Is it installed?');
    }
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON response from agents command');
    }
    throw new Error(`Failed to list agents: ${error.message || error}`);
  }
}

/**
 * Spawn a new agent session by executing "openclaw agent --agent <agentId> --message <task>"
 * @param agentId string - Agent ID to spawn
 * @param task string - Task for the agent to perform
 * @returns Promise<{sessionKey: string}> - Session key of the spawned agent
 */
export async function spawnAgent(agentId: string, task: string): Promise<{sessionKey: string}> {
  // Validate agent ID
  if (!isValidAgentId(agentId)) {
    throw new Error('Invalid agent ID format');
  }
  
  // Sanitize task input
  const sanitizedTask = sanitizeTaskInput(task);
  if (!sanitizedTask.trim()) {
    throw new Error('Task cannot be empty or contain only unsafe characters');
  }
  
  try {
    const { stdout, stderr } = await execFilePromise('openclaw', [
      'agent',
      '--agent', agentId,
      '--message', sanitizedTask,
      '--json'
    ]);
    
    if (stderr) {
      throw new Error(`Spawn agent command error: ${stderr}`);
    }
    
    const result = JSON.parse(stdout);
    const sessionKey = result.result?.meta?.agentMeta?.sessionKey || 'unknown';
    
    return { sessionKey };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error('OpenClaw CLI not found. Is it installed?');
    }
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON response from agent spawn command');
    }
    throw new Error(`Failed to spawn agent: ${error.message || error}`);
  }
}

/**
 * Kill all sessions for a specific agent
 * @param agentId string - Agent ID to kill
 * @returns Promise<void> - Resolves when operation completes
 */
export async function killAgent(agentId: string): Promise<void> {
  // Validate agent ID
  if (!isValidAgentId(agentId)) {
    throw new Error('Invalid agent ID format');
  }
  
  try {
    const { stdout, stderr } = await execFilePromise('openclaw', ['sessions', '--json']);
    
    if (stderr) {
      throw new Error(`List sessions command error: ${stderr}`);
    }
    
    const sessionsData = JSON.parse(stdout);
    
    // Validate sessions data structure
    if (!Array.isArray(sessionsData.sessions)) {
      throw new Error('Invalid sessions data structure');
    }
    
    const agentSessions = sessionsData.sessions.filter((session: any) => 
      session.key && session.key.startsWith(`agent:${agentId}:`)
    );
    
    for (const session of agentSessions) {
      if (session.key && isValidSessionKey(session.key)) {
        try {
          await execFilePromise('openclaw', ['sessions', 'kill', session.key]);
        } catch (error) {
          console.warn(`Failed to kill session ${session.key}:`, error);
        }
      }
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error('OpenClaw CLI not found. Is it installed?');
    }
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON response from sessions command');
    }
    throw new Error(`Failed to kill agent: ${error.message || error}`);
  }
}

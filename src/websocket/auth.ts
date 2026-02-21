import { IncomingMessage } from 'http';
import { ClientInfo, VerifyClientCallback } from './types';

/**
 * Extract Basic Auth credentials from HTTP headers
 * 
 * @param req - Incoming HTTP request
 * @returns Object with username and password, or null if extraction fails
 */
function extractBasicAuth(req: IncomingMessage): { username: string; password: string } | null {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return null;
  }

  const base64Credentials = authHeader.split(' ')[1];
  
  try {
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    const [username, password] = credentials.split(':');
    
    if (!username || !password) {
      return null;
    }

    return { username, password };
  } catch {
    return null;
  }
}

/**
 * Validate credentials against environment variables
 * 
 * @param username - The username from Basic Auth
 * @param password - The password from Basic Auth
 * @returns true if credentials match environment settings
 */
function validateCredentials(username: string, password: string): boolean {
  const expectedUsername = process.env.DASHBOARD_USERNAME || 'admin';
  const expectedPassword = process.env.DASHBOARD_PASSWORD || 'admin';

  return username === expectedUsername && password === expectedPassword;
}

/**
 * verifyClient - WebSocket client verification callback
 * 
 * Validates WebSocket upgrade requests using Basic Auth.
 * This is called before the WebSocket connection is established.
 * 
 * @param info - Client info containing origin and request
 * @param cb - Callback function to accept (true) or reject (false) the connection
 */
export function verifyClient(
  info: ClientInfo,
  cb: VerifyClientCallback
): void {
  const { req } = info;

  // Extract Basic Auth credentials
  const credentials = extractBasicAuth(req);

  if (!credentials) {
    console.warn('[WebSocket] Connection rejected: No valid Authorization header');
    cb(false, 401, 'Unauthorized: Basic Auth required');
    return;
  }

  // Validate credentials
  if (!validateCredentials(credentials.username, credentials.password)) {
    console.warn(`[WebSocket] Connection rejected: Invalid credentials for user "${credentials.username}"`);
    cb(false, 403, 'Forbidden: Invalid credentials');
    return;
  }

  // Store user info on the request for later use
  (req as any).userId = credentials.username;
  
  console.log(`[WebSocket] Connection accepted for user: ${credentials.username}`);
  cb(true);
}

/**
 * Sync version of verifyClient for ws library compatibility
 * This is used when the ws library expects a synchronous return
 * 
 * @param info - Client info containing origin and request
 * @returns true if client should be accepted, false otherwise
 */
export function verifyClientSync(info: ClientInfo): boolean {
  const { req } = info;

  const credentials = extractBasicAuth(req);
  if (!credentials) {
    return false;
  }

  return validateCredentials(credentials.username, credentials.password);
}

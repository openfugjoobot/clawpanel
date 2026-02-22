import { IncomingMessage } from 'http';
import { ClientInfo, VerifyClientCallback } from './types';
import * as url from 'url';
import { connectionManager } from './manager';

/**
 * Rate limiting for failed authentication attempts
 * Tracks failed attempts per IP
 */
const failedAuthAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_FAILED_ATTEMPTS = 5;
const FAILED_ATTEMPTS_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check if IP is rate limited for authentication
 */
function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const record = failedAuthAttempts.get(clientIp);
  
  if (!record) return false;
  
  // Reset if window expired
  if (now - record.lastAttempt > FAILED_ATTEMPTS_WINDOW_MS) {
    failedAuthAttempts.delete(clientIp);
    return false;
  }
  
  return record.count >= MAX_FAILED_ATTEMPTS;
}

/**
 * Record a failed authentication attempt
 */
function recordFailedAttempt(clientIp: string): void {
  const now = Date.now();
  const record = failedAuthAttempts.get(clientIp);
  
  if (!record) {
    failedAuthAttempts.set(clientIp, { count: 1, lastAttempt: now });
    return;
  }
  
  // Reset if window expired
  if (now - record.lastAttempt > FAILED_ATTEMPTS_WINDOW_MS) {
    failedAuthAttempts.set(clientIp, { count: 1, lastAttempt: now });
    return;
  }
  
  record.count++;
  record.lastAttempt = now;
}

/**
 * Extract Basic Auth credentials from HTTP headers ONLY
 * Note: URL query parameters are NOT accepted for security (URLs get logged)
 * 
 * @param req - Incoming HTTP request
 * @returns Object with username and password, or null if extraction fails
 */
function extractBasicAuth(req: IncomingMessage): { username: string; password: string } | null {
  // Only accept from Authorization header (NOT from URL query params)
  // Reason: URLs with tokens get logged in server logs, access logs, browser history
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return null;
  }

  const base64Credentials = authHeader.split(' ')[1];
  
  if (!base64Credentials) {
    return null;
  }
  
  try {
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    const [username, ...passwordParts] = credentials.split(':');
    const password = passwordParts.join(':'); // Password might contain colons
    
    // Validate username format
    if (!username || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return null;
    }
    
    // Validate password exists
    if (!password || password.length === 0) {
      return null;
    }
    
    return { username, password };
  } catch {
    return null;
  }
}

/**
 * Validate credentials against environment variables
 * Note: No default credentials in production - must be explicitly set
 * 
 * @param username - The username from Basic Auth
 * @param password - The password from Basic Auth
 * @returns true if credentials match environment settings
 */
function validateCredentials(username: string, password: string): boolean {
  const expectedUsername = process.env.DASHBOARD_USERNAME;
  const expectedPassword = process.env.DASHBOARD_PASSWORD;
  
  // Require explicit credentials - no defaults in production
  if (!expectedUsername || !expectedPassword) {
    console.error('[WebSocket] Auth misconfigured: Missing DASHBOARD_USERNAME or DASHBOARD_PASSWORD');
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(username, expectedUsername) && 
         timingSafeEqual(password, expectedPassword);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do the comparison to keep timing constant
    // but return false
    let result = false;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      result ||= a.charCodeAt(i) !== b.charCodeAt(i);
    }
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
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
  const { req, origin } = info;

  // Get client IP
  const clientIp = req.socket.remoteAddress || 'unknown';

  // Check rate limiting first
  if (isRateLimited(clientIp)) {
    console.warn(`[WebSocket] Connection rejected from ${clientIp}: Too many failed auth attempts`);
    cb(false, 429, 'Too Many Requests: Please try again later');
    return;
  }

  // Allow cross-origin from clawpanel and localhost
  const allowedOrigins = [
    'https://clawpanel.fugjoo.duckdns.org',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://localhost:3000',
    'https://localhost:3001',
  ];
  
  // Validate origin (CSRF protection)
  console.log(`[WebSocket] Connection attempt from origin: ${origin || 'unknown'}`);
  
  if (origin && !allowedOrigins.includes(origin)) {
    console.warn(`[WebSocket] Connection rejected: Origin '${origin}' not allowed`);
    cb(false, 403, 'Forbidden: Origin not allowed');
    return;
  }

  // Check connection limits (DoS protection)
  const connectionCheck = connectionManager.canAcceptConnection(clientIp);
  if (!connectionCheck.allowed) {
    console.warn(`[WebSocket] Connection rejected from ${clientIp}: ${connectionCheck.reason}`);
    cb(false, 429, `Too Many Connections: ${connectionCheck.reason}`);
    return;
  }

  // Extract Basic Auth credentials
  const credentials = extractBasicAuth(req);

  if (!credentials) {
    console.warn('[WebSocket] Connection rejected: No valid Authorization header');
    cb(false, 401, 'Unauthorized: Basic Auth required');
    return;
  }

  // Validate credentials
  if (!validateCredentials(credentials.username, credentials.password)) {
    recordFailedAttempt(clientIp);
    console.warn(`[WebSocket] Connection rejected: Invalid credentials for user "${credentials.username}" from ${clientIp}`);
    cb(false, 403, 'Forbidden: Invalid credentials');
    return;
  }

  // Clear failed attempts on successful auth
  failedAuthAttempts.delete(clientIp);

  // Store user info on the request for later use
  (req as any).userId = credentials.username;
  
  console.log(`[WebSocket] Connection accepted for user: ${credentials.username} from ${clientIp}`);
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
  const { req, origin } = info;
  const clientIp = req.socket.remoteAddress || 'unknown';

  // Check rate limiting
  if (isRateLimited(clientIp)) {
    return false;
  }

  // Check origin
  const allowedOrigins = [
    'https://clawpanel.fugjoo.duckdns.org',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://localhost:3000',
    'https://localhost:3001',
  ];

  if (origin && !allowedOrigins.includes(origin)) {
    return false;
  }

  // Check connection limits
  const connectionCheck = connectionManager.canAcceptConnection(clientIp);
  if (!connectionCheck.allowed) {
    return false;
  }

  const credentials = extractBasicAuth(req);
  if (!credentials) {
    return false;
  }

  const valid = validateCredentials(credentials.username, credentials.password);
  if (!valid) {
    recordFailedAttempt(clientIp);
    return false;
  }

  // Clear failed attempts
  failedAuthAttempts.delete(clientIp);

  // Store user info
  (req as any).userId = credentials.username;
  
  return true;
}

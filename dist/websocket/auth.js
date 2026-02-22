"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyClient = verifyClient;
exports.verifyClientSync = verifyClientSync;
const url = __importStar(require("url"));
const manager_1 = require("./manager");
/**
 * Extract Basic Auth credentials from HTTP headers or URL query params
 *
 * @param req - Incoming HTTP request
 * @returns Object with username and password, or null if extraction fails
 */
function extractBasicAuth(req) {
    // First try Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Basic ')) {
        const base64Credentials = authHeader.split(' ')[1];
        try {
            const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
            const [username, password] = credentials.split(':');
            if (username && password) {
                return { username, password };
            }
        }
        catch {
            // Continue to next method
        }
    }
    // Fallback: Try query parameter token
    try {
        const parsedUrl = url.parse(req.url || '', true);
        const token = parsedUrl.query.token;
        if (typeof token === 'string') {
            const credentials = Buffer.from(token, 'base64').toString('utf8');
            const [username, password] = credentials.split(':');
            if (username && password) {
                return { username, password };
            }
        }
    }
    catch {
        // Parse error, return null
    }
    return null;
}
/**
 * Validate credentials against environment variables
 *
 * @param username - The username from Basic Auth
 * @param password - The password from Basic Auth
 * @returns true if credentials match environment settings
 */
function validateCredentials(username, password) {
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
function verifyClient(info, cb) {
    const { req, origin } = info;
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
    const clientIp = req.socket.remoteAddress || 'unknown';
    const connectionCheck = manager_1.connectionManager.canAcceptConnection(clientIp);
    if (!connectionCheck.allowed) {
        console.warn(`[WebSocket] Connection rejected from ${clientIp}: ${connectionCheck.reason}`);
        cb(false, 429, `Too Many Connections: ${connectionCheck.reason}`);
        return;
    }
    // Extract Basic Auth credentials
    const credentials = extractBasicAuth(req);
    if (!credentials) {
        console.warn('[WebSocket] Connection rejected: No valid Authorization header or token');
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
    req.userId = credentials.username;
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
function verifyClientSync(info) {
    const { req, origin } = info;
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
    const credentials = extractBasicAuth(req);
    if (!credentials) {
        return false;
    }
    return validateCredentials(credentials.username, credentials.password);
}
//# sourceMappingURL=auth.js.map
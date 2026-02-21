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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const auth_1 = require("./middleware/auth");
const error_1 = require("./middleware/error");
const gateway_1 = __importDefault(require("./routes/gateway"));
const sessions_1 = __importDefault(require("./routes/sessions"));
const agents_1 = __importDefault(require("./routes/agents"));
const cron_1 = __importDefault(require("./routes/cron"));
const workspace_1 = __importDefault(require("./routes/workspace"));
const config_1 = __importDefault(require("./routes/config"));
const github_1 = __importDefault(require("./routes/github"));
const auth_2 = __importDefault(require("./routes/auth"));
const server_1 = require("./websocket/server");
// Load environment variables
dotenv_1.default.config();
// Create Express app
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Health endpoint (no auth required)
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
// Public auth routes (no auth required)
app.use('/api/auth', auth_2.default);
// Apply authentication middleware to all /api routes
app.use('/api', auth_1.authMiddleware);
// Mount gateway routes
app.use('/api/gateway', gateway_1.default);
// Mount sessions routes
app.use('/api/sessions', sessions_1.default);
// Mount agents routes
app.use('/api/agents', agents_1.default);
// Mount cron routes
app.use('/api/cron', cron_1.default);
// Mount config routes
app.use('/api/config', config_1.default);
// Mount github routes
app.use('/api/github', github_1.default);
// Mount workspace routes
app.use('/api', workspace_1.default);
// Protected change-password endpoint
app.post('/api/auth/change-password', (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        // Verify current password
        const expectedPassword = process.env.DASHBOARD_PASSWORD;
        if (currentPassword !== expectedPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        // Validate new password
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters' });
        }
        // Update .env file
        const envPath = path_1.default.resolve(process.cwd(), '.env');
        let envContent = fs_1.default.readFileSync(envPath, 'utf8');
        envContent = envContent.replace(/DASHBOARD_PASSWORD=.*/, `DASHBOARD_PASSWORD=${newPassword}`);
        fs_1.default.writeFileSync(envPath, envContent);
        process.env.DASHBOARD_PASSWORD = newPassword;
        console.log(`[SECURITY] Password changed at ${new Date().toISOString()}`);
        res.json({ message: 'Password updated successfully' });
    }
    catch (error) {
        console.error('[ERROR] Failed to change password:', error);
        res.status(500).json({ error: 'Failed to change password', details: error.message });
    }
});
// Global error handler (must be after all routes)
app.use(error_1.errorHandler);
// Start HTTPS server
const portNumber = typeof port === 'string' ? parseInt(port, 10) : port;
const certPath = process.env.SSL_CERT_PATH || '/home/ubuntu/.openclaw/certs/clawpanel.crt';
const keyPath = process.env.SSL_KEY_PATH || '/home/ubuntu/.openclaw/certs/clawpanel.key';
let server;
let wsServer = null;
if (fs_1.default.existsSync(certPath) && fs_1.default.existsSync(keyPath)) {
    const sslOptions = {
        cert: fs_1.default.readFileSync(certPath),
        key: fs_1.default.readFileSync(keyPath)
    };
    server = https_1.default.createServer(sslOptions, app);
    server.listen(portNumber, '0.0.0.0', () => {
        console.log(`HTTPS server is running on port ${portNumber}`);
    });
}
else {
    console.warn('SSL certificates not found, starting HTTP server...');
    server = http_1.default.createServer(app);
    server.listen(portNumber, '0.0.0.0', () => {
        console.log(`HTTP server is running on port ${portNumber}`);
    });
}
// Attach WebSocket server to the HTTP(S) server
wsServer = (0, server_1.createWebSocketServer)({ server: server, path: '/ws' });
console.log(`WebSocket server attached at path: /ws`);
// Graceful shutdown handling
process.on('SIGTERM', async () => {
    console.log('\n[SHUTDOWN] SIGTERM received, shutting down gracefully...');
    if (wsServer) {
        const { shutdownWebSocketServer } = await Promise.resolve().then(() => __importStar(require('./websocket/server')));
        await shutdownWebSocketServer(wsServer);
    }
    server.close(() => {
        console.log('[SHUTDOWN] HTTP server closed');
        process.exit(0);
    });
});
process.on('SIGINT', async () => {
    console.log('\n[SHUTDOWN] SIGINT received, shutting down gracefully...');
    if (wsServer) {
        const { shutdownWebSocketServer } = await Promise.resolve().then(() => __importStar(require('./websocket/server')));
        await shutdownWebSocketServer(wsServer);
    }
    server.close(() => {
        console.log('[SHUTDOWN] HTTP server closed');
        process.exit(0);
    });
});
//# sourceMappingURL=index.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const https_1 = __importDefault(require("https"));
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
// Load environment variables
dotenv_1.default.config();
// Create Express app
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
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
if (fs_1.default.existsSync(certPath) && fs_1.default.existsSync(keyPath)) {
    const sslOptions = {
        cert: fs_1.default.readFileSync(certPath),
        key: fs_1.default.readFileSync(keyPath)
    };
    https_1.default.createServer(sslOptions, app).listen(portNumber, '0.0.0.0', () => {
        console.log(`HTTPS server is running on port ${portNumber}`);
    });
}
else {
    console.warn('SSL certificates not found, starting HTTP server...');
    app.listen(portNumber, '0.0.0.0', () => {
        console.log(`HTTP server is running on port ${portNumber}`);
    });
}
//# sourceMappingURL=index.js.map
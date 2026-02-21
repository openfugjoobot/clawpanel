"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = require("./middleware/auth");
const error_1 = require("./middleware/error");
const gateway_1 = __importDefault(require("./routes/gateway"));
const sessions_1 = __importDefault(require("./routes/sessions"));
const agents_1 = __importDefault(require("./routes/agents"));
const cron_1 = __importDefault(require("./routes/cron"));
const workspace_1 = __importDefault(require("./routes/workspace"));
const config_1 = __importDefault(require("./routes/config"));
const github_1 = __importDefault(require("./routes/github"));
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
// Global error handler (must be after all routes)
app.use(error_1.errorHandler);
// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
//# sourceMappingURL=index.js.map
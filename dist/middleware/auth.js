"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const basic_auth_1 = __importDefault(require("basic-auth"));
const authMiddleware = (req, res, next) => {
    const user = (0, basic_auth_1.default)(req);
    const expectedUsername = process.env.DASHBOARD_USERNAME;
    const expectedPassword = process.env.DASHBOARD_PASSWORD;
    if (!user || !expectedUsername || !expectedPassword) {
        res.set('WWW-Authenticate', 'Basic realm="Dashboard"');
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (user.name !== expectedUsername || user.pass !== expectedPassword) {
        res.set('WWW-Authenticate', 'Basic realm="Dashboard"');
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    next();
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=auth.js.map
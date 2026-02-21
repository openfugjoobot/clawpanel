"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const openclaw_1 = require("../services/openclaw");
const child_process_1 = require("child_process");
const broadcaster_1 = require("../websocket/broadcaster");
const router = (0, express_1.Router)();
/**
 * Get OpenClaw gateway version
 */
const getGatewayVersion = () => {
    try {
        const version = (0, child_process_1.execSync)('openclaw --version', { encoding: 'utf-8', timeout: 5000 });
        return version.trim();
    }
    catch {
        return 'unknown';
    }
};
/**
 * GET /api/gateway/status
 * Get gateway health status - transforms raw gateway data to GatewayStatus format
 */
router.get('/status', async (req, res) => {
    try {
        const health = await (0, openclaw_1.gatewayHealth)();
        const version = getGatewayVersion();
        // Transform gateway response to GatewayStatus format
        const status = health.ok ? 'running' : 'error';
        const gatewayStatus = {
            status,
            version: version,
            pid: process.pid,
            // Note: OpenClaw doesn't expose real uptime, so we skip this field
            // The 'ts' field is just the health check timestamp, not start time
            raw: health
        };
        // Broadcast gateway status
        (0, broadcaster_1.broadcastGatewayStatus)(status, version);
        res.json(gatewayStatus);
    }
    catch (error) {
        // Broadcast error status
        (0, broadcaster_1.broadcastGatewayStatus)('error', 'unknown');
        res.status(503).json({
            status: 'error',
            version: 'unknown',
            pid: 0,
            error: 'Gateway unavailable',
            message: error.message
        });
    }
});
/**
 * POST /api/gateway/restart
 * Restart the gateway service
 */
router.post('/restart', async (req, res) => {
    try {
        // Get current version before restart
        const version = getGatewayVersion();
        // Broadcast stopping status before restart
        (0, broadcaster_1.broadcastGatewayStatus)('stopped', version);
        // Execute the openclaw gateway restart command
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execPromise = promisify(exec);
        const { stdout, stderr } = await execPromise('openclaw gateway restart');
        if (stderr) {
            throw new Error(stderr);
        }
        // Broadcast running status after restart
        (0, broadcaster_1.broadcastGatewayStatus)('running', version);
        res.json({
            message: 'Gateway restart initiated',
            output: stdout
        });
    }
    catch (error) {
        // Broadcast error status
        (0, broadcaster_1.broadcastGatewayStatus)('error', 'unknown');
        res.status(500).json({
            error: 'Failed to restart gateway',
            message: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=gateway.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const openclaw_1 = require("../services/openclaw");
const router = (0, express_1.Router)();
/**
 * GET /api/gateway/status
 * Get gateway health status
 */
router.get('/status', async (req, res) => {
    try {
        const health = await (0, openclaw_1.gatewayHealth)();
        res.json(health);
    }
    catch (error) {
        res.status(503).json({
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
        // Execute the openclaw gateway restart command
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execPromise = promisify(exec);
        const { stdout, stderr } = await execPromise('openclaw gateway restart');
        if (stderr) {
            throw new Error(stderr);
        }
        res.json({
            message: 'Gateway restart initiated',
            output: stdout
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to restart gateway',
            message: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=gateway.js.map
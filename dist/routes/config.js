"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const router = express_1.default.Router();
// Get the path to openclaw.json
const getConfigPath = () => {
    const homeDir = os_1.default.homedir();
    return path_1.default.join(homeDir, '.openclaw', 'openclaw.json');
};
// Create backup path with timestamp
const getBackupPath = () => {
    const homeDir = os_1.default.homedir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return path_1.default.join(homeDir, '.openclaw', `openclaw.json.backup.${timestamp}`);
};
// GET /api/config - Read the openclaw.json file
router.get('/', (req, res) => {
    try {
        const configPath = getConfigPath();
        // Check if file exists
        if (!fs_1.default.existsSync(configPath)) {
            return res.status(404).json({ error: 'Config file not found' });
        }
        // Read the file
        const configFile = fs_1.default.readFileSync(configPath, 'utf8');
        // Parse JSON to validate it
        const config = JSON.parse(configFile);
        res.json(config);
    }
    catch (error) {
        if (error instanceof SyntaxError) {
            res.status(500).json({ error: 'Invalid JSON in config file', details: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to read config file', details: error.message });
        }
    }
});
// POST /api/config - Write to the openclaw.json file
router.post('/', (req, res) => {
    try {
        const configPath = getConfigPath();
        const backupPath = getBackupPath();
        // Create backup before writing
        if (fs_1.default.existsSync(configPath)) {
            fs_1.default.copyFileSync(configPath, backupPath);
        }
        // Write the new config
        const configData = JSON.stringify(req.body, null, 2);
        fs_1.default.writeFileSync(configPath, configData);
        res.json({
            message: 'Config updated successfully',
            backup: backupPath
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update config', details: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=config.js.map
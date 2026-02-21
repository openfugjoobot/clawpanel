"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const child_process_1 = require("child_process");
const router = express_1.default.Router();
// Parse cron list output into structured data
function parseCronList(output) {
    const lines = output.trim().split('\n');
    const jobs = [];
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line)
            continue;
        // Split by 2+ spaces to handle table columns
        const columns = line.split(/\s{2,}/);
        if (columns.length >= 8) {
            jobs.push({
                id: columns[0],
                name: columns[1],
                schedule: columns[2],
                next: columns[3],
                last: columns[4],
                status: columns[5],
                target: columns[6],
                agent: columns[7]
            });
        }
    }
    return jobs;
}
// GET /api/cron -> Execute "openclaw cron list" and return output as JSON
router.get('/', (req, res) => {
    try {
        const output = (0, child_process_1.execSync)('openclaw cron list', { encoding: 'utf-8' });
        const jobs = parseCronList(output);
        res.json(jobs);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/cron -> Execute "openclaw cron add" with provided parameters
router.post('/', (req, res) => {
    try {
        const { schedule, command } = req.body;
        if (!schedule || !command) {
            return res.status(400).json({ error: 'Missing schedule or command in request body' });
        }
        const cmd = `openclaw cron add "${schedule}" "${command}"`;
        const output = (0, child_process_1.execSync)(cmd, { encoding: 'utf-8' });
        res.json({ message: 'Cron job added successfully', output: output.trim() });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// DELETE /api/cron/:id -> Execute "openclaw cron delete :id"
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const output = (0, child_process_1.execSync)(`openclaw cron delete ${id}`, { encoding: 'utf-8' });
        res.json({ message: 'Cron job deleted successfully', output: output.trim() });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=cron.js.map
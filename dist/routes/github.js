"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const child_process_1 = require("child_process");
const router = (0, express_1.Router)();
// Helper function to execute gh commands safely
const executeGHCommand = (command) => {
    try {
        const result = (0, child_process_1.execSync)(command, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 10000 // 10 second timeout
        });
        return JSON.parse(result);
    }
    catch (error) {
        // Check if it's an auth error
        const stderr = error.stderr?.toString() || '';
        const stdout = error.stdout?.toString() || '';
        if (stderr.includes('authentication') || stderr.includes('credentials') || stderr.includes('token')) {
            throw new Error('GitHub CLI not authenticated. Run "gh auth login"');
        }
        // Try to parse stdout anyway (gh sometimes returns data on error)
        try {
            if (stdout) {
                return JSON.parse(stdout);
            }
        }
        catch {
            // Ignore parse error
        }
        throw new Error(`Failed to execute GitHub CLI command: ${error.message}`);
    }
};
// GET /api/github/repos → Liste repos aus Config oder hardcoded
router.get('/repos', (req, res) => {
    try {
        // For now, return hardcoded list of repositories
        // In a real implementation, this could come from config
        const repos = [
            {
                owner: 'openfugjoobot',
                name: 'clawpanel',
                description: 'OpenClaw-based panel system'
            }
        ];
        res.json(repos);
    }
    catch (error) {
        console.error('Error fetching repositories:', error);
        res.status(503).json({ error: 'Service unavailable' });
    }
});
// GET /api/github/:owner/:repo/issues → Issues via "gh issue list --json"
router.get('/:owner/:repo/issues', (req, res) => {
    try {
        const { owner, repo } = req.params;
        // Validate owner and repo parameters
        if (!owner || !repo) {
            return res.status(400).json({ error: 'Owner and repo are required' });
        }
        // Check if gh is authenticated
        try {
            (0, child_process_1.execSync)('gh auth status', { stdio: 'pipe' });
        }
        catch {
            return res.status(401).json({ error: 'GitHub CLI not authenticated. Run "gh auth login"' });
        }
        // Execute gh issue list command
        const issues = executeGHCommand(`gh issue list --repo ${owner}/${repo} --json number,title,state,createdAt,updatedAt,assignees,labels,url`);
        res.json(issues);
    }
    catch (error) {
        console.error('Error fetching issues:', error);
        res.status(503).json({ error: error.message || 'Service unavailable' });
    }
});
// GET /api/github/:owner/:repo/pulls → PRs via "gh pr list --json"
router.get('/:owner/:repo/pulls', (req, res) => {
    try {
        const { owner, repo } = req.params;
        // Validate owner and repo parameters
        if (!owner || !repo) {
            return res.status(400).json({ error: 'Owner and repo are required' });
        }
        // Check if gh is authenticated
        try {
            (0, child_process_1.execSync)('gh auth status', { stdio: 'pipe' });
        }
        catch {
            return res.status(401).json({ error: 'GitHub CLI not authenticated. Run "gh auth login"' });
        }
        // Execute gh pr list command
        const pulls = executeGHCommand(`gh pr list --repo ${owner}/${repo} --json number,title,state,createdAt,updatedAt,author,labels,url`);
        res.json(pulls);
    }
    catch (error) {
        console.error('Error fetching pull requests:', error);
        res.status(503).json({ error: error.message || 'Service unavailable' });
    }
});
exports.default = router;
//# sourceMappingURL=github.js.map
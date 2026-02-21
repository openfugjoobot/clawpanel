"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Get the workspace path from environment variable or default to ~/.openclaw/workspace
const WORKSPACE_PATH = process.env.OPENCLAW_WORKSPACE || '/home/ubuntu/.openclaw/workspace';
const router = (0, express_1.Router)();
/**
 * GET /api/workspace?path=/
 * Read directory contents and return file listing
 */
router.get('/workspace', (req, res) => {
    try {
        // Get path parameter, default to root
        const relativePath = req.query.path && typeof req.query.path === 'string' ? req.query.path : '/';
        console.log('DEBUG: relativePath =', relativePath);
        // Resolve to absolute path and prevent path traversal
        const resolvedPath = resolveWorkspacePath(relativePath);
        console.log('DEBUG: resolvedPath =', resolvedPath);
        if (!resolvedPath) {
            return res.status(400).json({ error: 'Invalid path' });
        }
        // Check if path exists and is a directory
        if (!fs_1.default.existsSync(resolvedPath)) {
            return res.status(404).json({ error: 'Path not found' });
        }
        if (!fs_1.default.statSync(resolvedPath).isDirectory()) {
            return res.status(400).json({ error: 'Path is not a directory' });
        }
        // Read directory contents
        const items = fs_1.default.readdirSync(resolvedPath);
        const files = items.map(item => {
            const itemPath = path_1.default.join(resolvedPath, item);
            const stat = fs_1.default.statSync(itemPath);
            return {
                name: item,
                type: stat.isDirectory() ? 'directory' : 'file',
                path: path_1.default.join(relativePath, item)
            };
        });
        res.json({ files });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to read directory', message: error.message });
    }
});
/**
 * GET /api/files/:path
 * Read file content
 */
router.get('/files/:path', (req, res) => {
    try {
        // Extract path from URL params
        const relativePath = Array.isArray(req.params.path) ? req.params.path.join('/') : req.params.path;
        // Resolve to absolute path and prevent path traversal
        const resolvedPath = resolveWorkspacePath(relativePath);
        if (!resolvedPath) {
            return res.status(400).json({ error: 'Invalid path' });
        }
        // Check if file exists
        if (!fs_1.default.existsSync(resolvedPath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        // Check if it's actually a file
        if (!fs_1.default.statSync(resolvedPath).isFile()) {
            return res.status(400).json({ error: 'Path is not a file' });
        }
        // Read file content
        const content = fs_1.default.readFileSync(resolvedPath, 'utf8');
        res.json({ content });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to read file', message: error.message });
    }
});
/**
 * POST /api/files/:path
 * Write file content (with backup)
 */
router.post('/files/:path', (req, res) => {
    try {
        // Extract path from URL params
        const relativePath = Array.isArray(req.params.path) ? req.params.path.join('/') : req.params.path;
        // Resolve to absolute path and prevent path traversal
        const resolvedPath = resolveWorkspacePath(relativePath);
        if (!resolvedPath) {
            return res.status(400).json({ error: 'Invalid path' });
        }
        // Ensure parent directory exists
        const parentDir = path_1.default.dirname(resolvedPath);
        if (!fs_1.default.existsSync(parentDir)) {
            fs_1.default.mkdirSync(parentDir, { recursive: true });
        }
        // Create backup if file already exists
        if (fs_1.default.existsSync(resolvedPath)) {
            const backupPath = resolvedPath + '.backup.' + Date.now();
            fs_1.default.copyFileSync(resolvedPath, backupPath);
        }
        // Write new content
        const content = req.body.content || '';
        fs_1.default.writeFileSync(resolvedPath, content);
        res.json({ message: 'File saved successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to save file', message: error.message });
    }
});
/**
 * Resolve a relative path to an absolute path within the workspace
 * Prevents path traversal outside of workspace
 */
function resolveWorkspacePath(relativePath) {
    try {
        console.log('DEBUG: WORKSPACE_PATH =', WORKSPACE_PATH);
        // Normalize and resolve the path
        const normalizedPath = path_1.default.normalize(relativePath);
        console.log('DEBUG: normalizedPath =', normalizedPath);
        // Join with workspace path
        const fullPath = path_1.default.resolve(WORKSPACE_PATH, normalizedPath);
        console.log('DEBUG: fullPath =', fullPath);
        // Check if the resolved path is still within the workspace
        const workspacePathResolved = path_1.default.resolve(WORKSPACE_PATH);
        console.log('DEBUG: workspacePathResolved =', workspacePathResolved);
        console.log('DEBUG: fullPath.startsWith(workspacePathResolved) =', fullPath.startsWith(workspacePathResolved));
        if (!fullPath.startsWith(workspacePathResolved)) {
            return null; // Path traversal detected
        }
        return fullPath;
    }
    catch (error) {
        console.error('DEBUG: Error in resolveWorkspacePath:', error);
        return null;
    }
}
exports.default = router;
//# sourceMappingURL=workspace.js.map
import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

// Get the workspace path from environment variable or default to ~/.openclaw/workspace
const WORKSPACE_PATH = process.env.OPENCLAW_WORKSPACE || '/home/ubuntu/.openclaw/workspace';
const router = Router();

// Validation helpers
const isValidPathName = (name: string): boolean => {
  // Allow: alphanumeric, underscores, hyphens, dots, forward slashes
  // Block: .. (parent directory), control characters, and shell metacharacters
  if (!name || typeof name !== 'string') return false;
  if (name.length > 4096) return false; // Max path length
  if (name.includes('..')) return false; // Block directory traversal
  if (/[<>"|?*\x00-\x1f]/.test(name)) return false; // Block special chars
  if (/^[\/]/.test(name)) return false; // Block absolute paths
  return true;
};

/**
 * GET /api/workspace?path=/
 * Read directory contents and return file listing
 */
router.get('/workspace', (req: Request, res: Response) => {
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
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: 'Path not found' });
    }
    
    if (!fs.statSync(resolvedPath).isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory' });
    }
    
    // Read directory contents
    const items = fs.readdirSync(resolvedPath);
    const files = items.map(item => {
      const itemPath = path.join(resolvedPath, item);
      const stat = fs.statSync(itemPath);
      return {
        name: item,
        type: stat.isDirectory() ? 'directory' : 'file',
        path: path.join(relativePath, item)
      };
    });
    
    res.json({ files });
  } catch (error: any) {
    console.error('Error reading directory:', error);
    res.status(500).json({ error: 'Failed to read directory' });
  }
});

/**
 * GET /api/files/:path
 * Read file content
 */
router.get('/files/:path(^*)', (req: Request, res: Response) => {
  try {
    // Extract path from URL params - express captures the full path
    const relativePath = Array.isArray(req.params.path) ? req.params.path.join('/') : req.params.path;
    
    console.log('DEBUG: file path =', relativePath);
    
    // Resolve to absolute path and prevent path traversal
    const resolvedPath = resolveWorkspacePath(relativePath);
    if (!resolvedPath) {
      return res.status(400).json({ error: 'Invalid path' });
    }
    
    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Check if it's actually a file
    if (!fs.statSync(resolvedPath).isFile()) {
      return res.status(400).json({ error: 'Path is not a file' });
    }
    
    // Check file size to prevent reading huge files
    const stats = fs.statSync(resolvedPath);
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
    if (stats.size > MAX_FILE_SIZE) {
      return res.status(413).json({ error: 'File too large' });
    }
    
    // Read file content
    const content = fs.readFileSync(resolvedPath, 'utf8');
    res.json({ content });
  } catch (error: any) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

/**
 * POST /api/files/:path
 * Write file content (with backup)
 */
router.post('/files/:path(^*)', (req: Request, res: Response) => {
  try {
    // Extract path from URL params
    const relativePath = Array.isArray(req.params.path) ? req.params.path.join('/') : req.params.path;
    
    console.log('DEBUG: write path =', relativePath);
    
    // Resolve to absolute path and prevent path traversal
    const resolvedPath = resolveWorkspacePath(relativePath);
    if (!resolvedPath) {
      return res.status(400).json({ error: 'Invalid path' });
    }
    
    // Validate content
    const content = req.body.content;
    if (content === undefined) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'Content must be a string' });
    }
    
    // Limit content size
    const MAX_CONTENT_SIZE = 50 * 1024 * 1024; // 50MB
    if (Buffer.byteLength(content, 'utf8') > MAX_CONTENT_SIZE) {
      return res.status(413).json({ error: 'Content too large' });
    }
    
    // Ensure parent directory exists
    const parentDir = path.dirname(resolvedPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    
    // Create backup if file already exists
    if (fs.existsSync(resolvedPath)) {
      const backupPath = resolvedPath + '.backup.' + Date.now();
      fs.copyFileSync(resolvedPath, backupPath);
    }
    
    // Write new content
    fs.writeFileSync(resolvedPath, content);
    
    res.json({ message: 'File saved successfully' });
  } catch (error: any) {
    console.error('Error writing file:', error);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

/**
 * Resolve a relative path to an absolute path within the workspace
 * Prevents path traversal outside of workspace
 */
function resolveWorkspacePath(relativePath: string): string | null {
  try {
    console.log('DEBUG: WORKSPACE_PATH =', WORKSPACE_PATH);
    
    // Validate the relative path
    if (!isValidPathName(relativePath)) {
      console.error('DEBUG: Path validation failed for:', relativePath);
      return null;
    }
    
    // Normalize and resolve the path
    const normalizedPath = path.normalize(relativePath);
    console.log('DEBUG: normalizedPath =', normalizedPath);
    
    // Join with workspace path
    const fullPath = path.resolve(WORKSPACE_PATH, normalizedPath);
    console.log('DEBUG: fullPath =', fullPath);
    
    // Resolve real paths with symlinks
    let realFullPath: string;
    try {
      realFullPath = fs.realpathSync(fullPath);
    } catch {
      // If file doesn't exist, get the real path of the workspace
      const realWorkspace = fs.realpathSync(WORKSPACE_PATH);
      realFullPath = path.resolve(realWorkspace, normalizedPath);
    }
    
    // Get the real workspace path
    const realWorkspacePath = fs.realpathSync(WORKSPACE_PATH);
    console.log('DEBUG: realWorkspacePath =', realWorkspacePath);
    console.log('DEBUG: realFullPath =', realFullPath);
    
    // Check if the resolved path is still within the workspace
    // Use path.sep to ensure proper cross-platform comparison
    const normalizedFullPath = path.normalize(realFullPath + path.sep);
    const normalizedWorkspace = path.normalize(realWorkspacePath + path.sep);
    
    if (!normalizedFullPath.startsWith(normalizedWorkspace)) {
      console.error('DEBUG: Path traversal detected - path escapes workspace');
      return null;
    }
    
    return realFullPath;
  } catch (error) {
    console.error('DEBUG: Error in resolveWorkspacePath:', error);
    return null;
  }
}

export default router;

import { Router, Request, Response } from 'express';
import { execFile } from 'child_process';
import { promisify } from 'util';

const router = Router();
const execFilePromise = promisify(execFile);

// Validation helpers
const isValidRepoName = (name: string): boolean => {
  // GitHub repo names: alphanumeric, hyphens, underscores, dots
  return /^[a-zA-Z0-9_.-]+$/.test(name) && name.length >= 1 && name.length <= 100;
};

const isValidOwner = (owner: string): boolean => {
  // GitHub usernames/org names: alphanumeric, hyphens
  return /^[a-zA-Z0-9-]+$/.test(owner) && owner.length >= 1 && owner.length <= 39;
};

// Helper function to execute gh commands safely
const executeGHCommand = async (args: string[]): Promise<any> => {
  try {
    const { stdout, stderr } = await execFilePromise('gh', args, {
      timeout: 10000 // 10 second timeout
    });
    
    if (stderr) {
      console.error('gh stderr:', stderr);
    }
    
    return JSON.parse(stdout);
  } catch (error: any) {
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
    } catch {
      // Ignore parse error
    }
    
    throw new Error(`Failed to execute GitHub CLI command: ${error.message}`);
  }
};

// GET /api/github/repos -> Liste repos aus Config oder hardcoded
router.get('/repos', (req: Request, res: Response) => {
  try {
    // For now, return hardcoded list of repositories
    const repos = [
      {
        owner: 'openfugjoobot',
        name: 'clawpanel',
        description: 'OpenClaw-based panel system'
      }
    ];
    
    res.json(repos);
  } catch (error) {
    console.error('Error fetching repositories:', error);
    res.status(503).json({ error: 'Service unavailable' });
  }
});

// GET /api/github/:owner/:repo/issues -> Issues via "gh issue list --json"
router.get('/:owner/:repo/issues', async (req: Request, res: Response) => {
  try {
    const owner = Array.isArray(req.params.owner) ? req.params.owner[0] : req.params.owner;
    const repo = Array.isArray(req.params.repo) ? req.params.repo[0] : req.params.repo;
    
    // Validate owner and repo parameters
    if (!isValidOwner(owner)) {
      return res.status(400).json({ error: 'Invalid owner name' });
    }
    
    if (!isValidRepoName(repo)) {
      return res.status(400).json({ error: 'Invalid repository name' });
    }
    
    // Check if gh is authenticated
    try {
      await execFilePromise('gh', ['auth', 'status']);
    } catch {
      return res.status(401).json({ error: 'GitHub CLI not authenticated. Run "gh auth login"' });
    }
    
    // Execute gh issue list command
    const issues = await executeGHCommand([
      'issue', 'list',
      '--repo', `${owner}/${repo}`,
      '--json', 'number,title,state,createdAt,updatedAt,assignees,labels,url'
    ]);
    
    res.json(issues);
  } catch (error: any) {
    console.error('Error fetching issues:', error);
    res.status(503).json({ error: error.message || 'Service unavailable' });
  }
});

// GET /api/github/:owner/:repo/pulls -> PRs via "gh pr list --json"
router.get('/:owner/:repo/pulls', async (req: Request, res: Response) => {
  try {
    const owner = Array.isArray(req.params.owner) ? req.params.owner[0] : req.params.owner;
    const repo = Array.isArray(req.params.repo) ? req.params.repo[0] : req.params.repo;
    
    // Validate owner and repo parameters
    if (!isValidOwner(owner)) {
      return res.status(400).json({ error: 'Invalid owner name' });
    }
    
    if (!isValidRepoName(repo)) {
      return res.status(400).json({ error: 'Invalid repository name' });
    }
    
    // Check if gh is authenticated
    try {
      await execFilePromise('gh', ['auth', 'status']);
    } catch {
      return res.status(401).json({ error: 'GitHub CLI not authenticated. Run "gh auth login"' });
    }
    
    // Execute gh pr list command
    const pulls = await executeGHCommand([
      'pr', 'list',
      '--repo', `${owner}/${repo}`,
      '--json', 'number,title,state,createdAt,updatedAt,author,labels,url'
    ]);
    
    res.json(pulls);
  } catch (error: any) {
    console.error('Error fetching pull requests:', error);
    res.status(503).json({ error: error.message || 'Service unavailable' });
  }
});

export default router;

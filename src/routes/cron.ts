import { Router, Request, Response } from 'express';
import { execFile } from 'child_process';
import { promisify } from 'util';

const router = Router();
const execFilePromise = promisify(execFile);

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  next: string;
  last: string;
  status: string;
  target: string;
  agent: string;
}

// Validation helpers
const isValidCronId = (id: string): boolean => {
  // Cron IDs should be alphanumeric
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length <= 64;
};

const isValidCronSchedule = (schedule: string): boolean => {
  // Basic cron schedule validation (5 fields)
  // Allows: numbers, commas, hyphens, asterisks, slashes, spaces
  return /^[0-9*,/-\s]+$/.test(schedule) && schedule.length <= 100;
};

const isValidCommand = (command: string): boolean => {
  // Commands should only contain safe characters
  // Alphanumeric, spaces, and specific allowed symbols
  return /^[a-zA-Z0-9_\s\/\-:.]+$/.test(command) && command.length <= 500;
};

// Parse cron list output into structured data
function parseCronList(output: string): CronJob[] {
  const lines = output.trim().split('\n');
  const jobs: CronJob[] = [];
  
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
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
router.get('/', async (req: Request, res: Response) => {
  try {
    const { stdout, stderr } = await execFilePromise('openclaw', ['cron', 'list']);
    
    if (stderr) {
      console.error('Cron list stderr:', stderr);
    }
    
    const jobs = parseCronList(stdout);
    res.json(jobs);
  } catch (error: any) {
    console.error('Error listing cron jobs:', error);
    res.status(500).json({ error: error.message || 'Failed to list cron jobs' });
  }
});

// POST /api/cron -> Execute "openclaw cron add" with provided parameters
router.post('/', async (req: Request, res: Response) => {
  try {
    const { schedule, command } = req.body;
    
    if (!schedule || !command) {
      return res.status(400).json({ error: 'Missing schedule or command in request body' });
    }
    
    // Validate inputs
    if (!isValidCronSchedule(schedule)) {
      return res.status(400).json({ error: 'Invalid schedule format' });
    }
    
    if (!isValidCommand(command)) {
      return res.status(400).json({ error: 'Invalid command format' });
    }
    
    const { stdout, stderr } = await execFilePromise('openclaw', 
      ['cron', 'add', schedule, command],
      { encoding: 'utf-8' }
    );
    
    if (stderr) {
      console.error('Cron add stderr:', stderr);
    }
    
    res.json({ message: 'Cron job added successfully', output: stdout.trim() });
  } catch (error: any) {
    console.error('Error adding cron job:', error);
    res.status(500).json({ error: error.message || 'Failed to add cron job' });
  }
});

// DELETE /api/cron/:id -> Execute "openclaw cron delete :id"
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    
    // Validate ID
    if (!isValidCronId(id)) {
      return res.status(400).json({ error: 'Invalid cron job ID' });
    }
    
    const { stdout, stderr } = await execFilePromise('openclaw', 
      ['cron', 'delete', id],
      { encoding: 'utf-8' }
    );
    
    if (stderr) {
      console.error('Cron delete stderr:', stderr);
    }
    
    res.json({ message: 'Cron job deleted successfully', output: stdout.trim() });
  } catch (error: any) {
    console.error('Error deleting cron job:', error);
    res.status(500).json({ error: error.message || 'Failed to delete cron job' });
  }
});

export default router;

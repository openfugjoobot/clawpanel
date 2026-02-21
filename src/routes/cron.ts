import express from 'express';
import { execSync } from 'child_process';

const router = express.Router();

// GET /api/cron -> Execute "openclaw cron list" and return output as JSON
router.get('/', (req, res) => {
  try {
    const output = execSync('openclaw cron list', { encoding: 'utf-8' });
    // Try to parse as JSON if possible, otherwise return as text
    try {
      const jsonOutput = JSON.parse(output);
      res.json(jsonOutput);
    } catch {
      // If parsing fails, return the raw output
      res.json({ output: output.trim() });
    }
  } catch (error: any) {
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
    const output = execSync(cmd, { encoding: 'utf-8' });
    
    res.json({ message: 'Cron job added successfully', output: output.trim() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/cron/:id -> Execute "openclaw cron delete :id"
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const output = execSync(`openclaw cron delete ${id}`, { encoding: 'utf-8' });
    
    res.json({ message: 'Cron job deleted successfully', output: output.trim() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
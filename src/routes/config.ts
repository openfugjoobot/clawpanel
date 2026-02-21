import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';

const router = express.Router();

// Get the path to openclaw.json
const getConfigPath = () => {
  const homeDir = os.homedir();
  return path.join(homeDir, '.openclaw', 'openclaw.json');
};

// Create backup path with timestamp
const getBackupPath = () => {
  const homeDir = os.homedir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(homeDir, '.openclaw', `openclaw.json.backup.${timestamp}`);
};

// GET /api/config - Read the openclaw.json file
router.get('/', (req: Request, res: Response) => {
  try {
    const configPath = getConfigPath();
    
    // Check if file exists
    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ error: 'Config file not found' });
    }
    
    // Read the file
    const configFile = fs.readFileSync(configPath, 'utf8');
    
    // Parse JSON to validate it
    const config = JSON.parse(configFile);
    
    res.json(config);
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      res.status(500).json({ error: 'Invalid JSON in config file', details: error.message });
    } else {
      res.status(500).json({ error: 'Failed to read config file', details: error.message });
    }
  }
});

// POST /api/config - Write to the openclaw.json file
router.post('/', (req: Request, res: Response) => {
  try {
    const configPath = getConfigPath();
    const backupPath = getBackupPath();
    
    // Create backup before writing
    if (fs.existsSync(configPath)) {
      fs.copyFileSync(configPath, backupPath);
    }
    
    // Write the new config
    const configData = JSON.stringify(req.body, null, 2);
    fs.writeFileSync(configPath, configData);
    
    res.json({ 
      message: 'Config updated successfully',
      backup: backupPath 
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update config', details: error.message });
  }
});

export default router;
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

// Validate that the config object doesn't contain dangerous keys
const validateConfig = (config: any): { valid: boolean; error?: string } => {
  if (config === null || typeof config !== 'object') {
    return { valid: false, error: 'Config must be an object' };
  }
  
  // Check config size (prevent huge configs)
  const configStr = JSON.stringify(config);
  const MAX_CONFIG_SIZE = 10 * 1024 * 1024; // 10MB
  if (Buffer.byteLength(configStr, 'utf8') > MAX_CONFIG_SIZE) {
    return { valid: false, error: 'Config too large' };
  }
  
  // Additional validation could be added here
  // e.g., check for required fields, validate field types, etc.
  
  return { valid: true };
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
    
    // Check file size
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (Buffer.byteLength(configFile, 'utf8') > MAX_FILE_SIZE) {
      return res.status(413).json({ error: 'Config file too large' });
    }
    
    // Parse JSON to validate it
    const config = JSON.parse(configFile);
    
    res.json(config);
  } catch (error: any) {
    console.error('[Config] Error reading config:', error);
    if (error instanceof SyntaxError) {
      res.status(500).json({ error: 'Invalid JSON in config file' });
    } else {
      res.status(500).json({ error: 'Failed to read config file' });
    }
  }
});

// POST /api/config - Write to the openclaw.json file
router.post('/', (req: Request, res: Response) => {
  try {
    const configPath = getConfigPath();
    const backupPath = getBackupPath();
    
    // Validate the request body
    const validation = validateConfig(req.body);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Invalid config',
        details: validation.error 
      });
    }
    
    // Create backup before writing
    if (fs.existsSync(configPath)) {
      fs.copyFileSync(configPath, backupPath);
    }
    
    // Write the new config
    const configData = JSON.stringify(req.body, null, 2);
    fs.writeFileSync(configPath, configData);
    
    console.log(`[Config] Config updated at ${new Date().toISOString()}, backup: ${backupPath}`);
    
    res.json({ 
      message: 'Config updated successfully',
      backup: backupPath 
    });
  } catch (error: any) {
    console.error('[Config] Error writing config:', error);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

export default router;

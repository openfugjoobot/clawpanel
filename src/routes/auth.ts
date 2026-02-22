import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const router = express.Router();

// Rate limiting for forgot-password (memory-based, resets on restart)
const forgotPasswordAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5; // 5 attempts per IP per hour
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Generate a secure random password
const generateTempPassword = (length: number = 12): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  return password;
};

export { generateTempPassword };

// Helper to check rate limit
const checkRateLimit = (clientIp: string): boolean => {
  const now = Date.now();
  const record = forgotPasswordAttempts.get(clientIp);
  
  if (!record) {
    forgotPasswordAttempts.set(clientIp, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Reset if window expired
  if (now - record.lastAttempt > WINDOW_MS) {
    forgotPasswordAttempts.set(clientIp, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Check if limit exceeded
  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }
  
  // Increment count
  record.count++;
  record.lastAttempt = now;
  return true;
};

// POST /api/auth/forgot-password - Generate temporary password
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    
    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      console.warn(`[SECURITY] Rate limit exceeded for forgot-password from ${clientIp}`);
      return res.status(429).json({ 
        error: 'Too many password reset attempts. Please try again later.'
      });
    }
    
    const { username } = req.body;
    
    // Basic validation
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    // Validate username format (alphanumeric only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Invalid username format' });
    }
    
    // Check if username matches config
    const expectedUsername = process.env.DASHBOARD_USERNAME;
    if (username !== expectedUsername) {
      // Return generic success even if username doesn't exist (security)
      return res.json({ 
        message: 'If the account exists, a new password has been generated.'
      });
    }

    // Generate new temporary password
    const tempPassword = generateTempPassword();
    
    // Update .env file
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent: string;
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      
      // Replace or add DASHBOARD_PASSWORD
      if (envContent.includes('DASHBOARD_PASSWORD=')) {
        envContent = envContent.replace(
          /DASHBOARD_PASSWORD=.*/,
          `DASHBOARD_PASSWORD=${tempPassword}`
        );
      } else {
        envContent += `\nDASHBOARD_PASSWORD=${tempPassword}\n`;
      }
    } else {
      // Create minimal env file
      envContent = `DASHBOARD_USERNAME=${username}\nDASHBOARD_PASSWORD=${tempPassword}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    
    // Also update process.env for immediate effect (until restart)
    process.env.DASHBOARD_PASSWORD = tempPassword;
    
    console.log(`[SECURITY] Password reset for user ${username} at ${new Date().toISOString()} from ${clientIp}`);
    
    // Return the temporary password
    // NOTE: In production with email, this wouldn't be returned!
    res.json({
      message: 'Your temporary password has been generated. Please change it immediately after login.',
      tempPassword,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    });
    
  } catch (error: any) {
    console.error('[ERROR] Failed to reset password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;

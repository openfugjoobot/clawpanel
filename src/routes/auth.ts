import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const router = express.Router();

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

// POST /api/auth/forgot-password - Generate temporary password
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    
    // Basic validation - check if username matches config
    const expectedUsername = process.env.DASHBOARD_USERNAME;
    if (username !== expectedUsername) {
      // Return generic success even if username doesn't exist (security)
      return res.json({ 
        message: 'If the account exists, a new password has been generated.',
        tempPassword: null
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
    
    console.log(`[SECURITY] Password reset for user ${username} at ${new Date().toISOString()}`);
    
    // Return the temporary password
    // NOTE: In production with email, this wouldn't be returned!
    res.json({
      message: 'Your temporary password has been generated. Please change it immediately after login.',
      tempPassword,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    });
    
  } catch (error: any) {
    console.error('[ERROR] Failed to reset password:', error);
    res.status(500).json({ error: 'Failed to reset password', details: error.message });
  }
});

export default router;

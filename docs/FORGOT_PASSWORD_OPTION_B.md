# Password Reset - Option B (Email-Based)

## Overview
Complete email-based password reset flow with secure tokens and SMTP integration.

## Requirements

### 1. Database Changes
```sql
-- Password Reset Tokens Table
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add email column to users (if not exists)
ALTER TABLE users ADD COLUMN email VARCHAR(255);
```

### 2. Backend Endpoints

#### POST /api/auth/request-reset
Request a password reset email.
```json
{
  "email": "user@example.com"
}
```
Response (always same to prevent user enumeration):
```json
{
  "message": "If an account exists, you will receive an email shortly."
}
```

#### GET /api/auth/verify-reset/:token
Verify token validity (used by frontend).
```json
{
  "valid": true,
  "email": "user@example.com"
}
```

#### POST /api/auth/confirm-reset
Confirm password reset with token.
```json
{
  "token": "uuid-token",
  "newPassword": "new-secure-password"
}
```

### 3. Email Service (SMTP)

Configuration (add to .env):
```bash
# SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-app@gmail.com
SMTP_PASS=app-specific-password
SMTP_FROM=noreply@clawpanel.local

# Token Settings
RESET_TOKEN_EXPIRY_HOURS=1
RESET_TOKEN_LENGTH=32
```

Add `nodemailer` dependency:
```bash
npm install nodemailer
npm install -D @types/nodemailer
```

Email template (`templates/reset-email.html`):
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
    .warning { color: #dc2626; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Password Reset Request</h1>
    <p>Hello {{username}},</p>
    <p>A password reset was requested for your ClawPanel account.</p>
    <p><a href="{{resetUrl}}" class="button">Reset Password</a></p>
    <p class="warning">This link expires in {{expiryHours}} hour(s).</p>
    <p>If you didn't request this, please ignore this email.</p>
  </div>
</body>
</html>
```

### 4. Frontend Changes

#### New Pages
- `/reset-password` - Landing page with email input
- `/reset-password/confirm?token=xxx` - Set new password page

#### Flow
1. User clicks "Forgot password?" → Redirect to `/reset-password`
2. User enters email → POST to /api/auth/request-reset
3. User receives email with reset link
4. Clicks link → `/reset-password/confirm?token=xxx`
5. Token validated → Show new password form
6. Submit → POST to /api/auth/confirm-reset
7. Redirect to login with success message

### 5. Routes Implementation

```typescript
// src/routes/auth-email.ts
import express, { Request, Response } from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { addHours } from 'date-fns';

const router = express.Router();

// In-memory token storage (for dev) - use PostgreSQL/Redis in production
const tokenStore: Map<string, { email: string; expiresAt: Date }> = new Map();

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

router.post('/request-reset', async (req: Request, res: Response) => {
  const { email } = req.body;
  
  // Always return success (prevent user enumeration)
  res.json({ message: 'If an account exists, you will receive an email shortly.' });
  
  // Check if user exists (async, don't block response)
  const user = await getUserByEmail(email);
  if (!user) return;
  
  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  // Store token (expires in 1 hour)
  const expiresAt = addHours(new Date(), 1);
  await storeResetToken(user.id, tokenHash, expiresAt);
  
  // Send email
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/confirm?token=${token}`;
  
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'ClawPanel Password Reset',
    html: renderTemplate('reset-email.html', { 
      username: user.username,
      resetUrl,
      expiryHours: 1 
    }),
  });
});

export default router;
```

### 6. Security Considerations

- Tokens must be cryptographically secure (32+ bytes from crypto.randomBytes)
- Store token hashes, not plaintext tokens
- Tokens expire after 1 hour (configurable)
- One-time use only (mark as used after successful reset)
- Rate limit: max 3 reset requests per hour per email
- Rate limit: max 5 reset requests per hour per IP
- Same response regardless of email existence (prevent enumeration)
- Clear tokens on successful password change
- Invalidate all existing sessions after password reset

### 7. Migration Path

This can be implemented incrementally:
1. Add email column to user config
2. Implement email service with logging (don't send yet)
3. Verify email templates and URLs in logs
4. Enable email sending
5. Deprecate Option A flow

### 8. Testing Checklist

- [ ] Reset request sends email
- [ ] Expired tokens are rejected
- [ ] Used tokens are rejected  
- [ ] Invalid tokens show error
- [ ] New password works immediately
- [ ] Old password no longer works
- [ ] Rate limiting works
- [ ] Non-existent emails get same response
- [ ] Success flow end-to-end

## Estimates

- Backend implementation: ~3-4 hours
- Frontend implementation: ~2-3 hours
- Email setup/testing: ~1-2 hours
- **Total: ~6-9 hours**

## Optional Enhancements

1. **Magic Links**: Passwordless login via email
2. **OTP via SMS**: Twilio integration for SMS resets
3. **WebAuthn**: Passwordless with security keys
4. **Recovery Codes**: Printable backup codes for account recovery

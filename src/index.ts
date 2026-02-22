import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error';
import gatewayRoutes from './routes/gateway';
import sessionsRoutes from './routes/sessions';
import agentsRoutes from './routes/agents';
import cronRoutes from './routes/cron';
import workspaceRoutes from './routes/workspace';
import configRoutes from './routes/config';
import githubRoutes from './routes/github';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://localhost:5173',
  credentials: true
}));

// Rate limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Rate limit exceeded. Please try again later.',
    retryAfter: '15 minutes'
  }
});

// Apply rate limiting to all requests
app.use(limiter);

// More strict rate limit for sensitive operations
const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    error: 'Too many requests on sensitive endpoint. Please slow down.',
    retryAfter: '1 minute'
  }
});

// Health endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Apply authentication middleware to all /api routes
app.use('/api', authMiddleware);

// Mount gateway routes - apply strict rate limiting
app.use('/api/gateway', strictLimiter, gatewayRoutes);

// Mount sessions routes - apply strict rate limiting
app.use('/api/sessions', strictLimiter, sessionsRoutes);

// Mount agents routes - apply strict rate limiting
app.use('/api/agents', strictLimiter, agentsRoutes);

// Mount cron routes - apply strict rate limiting
app.use('/api/cron', strictLimiter, cronRoutes);

// Mount config routes
app.use('/api/config', configRoutes);

// Mount github routes
app.use('/api/github', githubRoutes);

// Mount workspace routes
app.use('/api', workspaceRoutes);

// Global error handler (must be after all routes)
app.use(errorHandler);

// Start HTTPS server
const portNumber = typeof port === 'string' ? parseInt(port, 10) : port;

// Enforce that SSL certificates are required in production
const isProduction = process.env.NODE_ENV === 'production';
const certPath = process.env.SSL_CERT_PATH || '/home/ubuntu/.openclaw/certs/clawpanel.crt';
const keyPath = process.env.SSL_KEY_PATH || '/home/ubuntu/.openclaw/certs/clawpanel.key';

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const sslOptions = {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath)
  };
  https.createServer(sslOptions, app).listen(portNumber, '0.0.0.0', () => {
    console.log(`HTTPS server is running on port ${portNumber}`);
  });
} else if (!isProduction) {
  // Allow HTTP only in non-production environments with warning
  console.warn('⚠️  SSL certificates not found, starting HTTP server (not for production!)');
  app.listen(portNumber, '0.0.0.0', () => {
    console.log(`HTTP server is running on port ${portNumber}`);
  });
} else {
  console.error('❌ SSL certificates are required in production. Set SSL_CERT_PATH and SSL_KEY_PATH or place certificates at the default path.');
  process.exit(1);
}

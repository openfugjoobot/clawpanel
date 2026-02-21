import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';
import path from 'path';
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
app.use(cors());

// Health endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Apply authentication middleware to all /api routes
app.use('/api', authMiddleware);

// Mount gateway routes
app.use('/api/gateway', gatewayRoutes);

// Mount sessions routes
app.use('/api/sessions', sessionsRoutes);

// Mount agents routes
app.use('/api/agents', agentsRoutes);

// Mount cron routes
app.use('/api/cron', cronRoutes);

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
} else {
  console.warn('SSL certificates not found, starting HTTP server...');
  app.listen(portNumber, '0.0.0.0', () => {
    console.log(`HTTP server is running on port ${portNumber}`);
  });
}
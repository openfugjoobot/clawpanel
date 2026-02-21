import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error';
import gatewayRoutes from './routes/gateway';
import sessionsRoutes from './routes/sessions';
import agentsRoutes from './routes/agents';
import cronRoutes from './routes/cron';
import workspaceRoutes from './routes/workspace';
import configRoutes from './routes/config';

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

// Mount workspace routes
app.use('/api', workspaceRoutes);

// Global error handler (must be after all routes)
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
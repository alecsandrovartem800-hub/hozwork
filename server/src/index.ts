import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config';
import { initSocket } from './socket';
import { initSupportBot, stopSupportBot } from './services/supportBot';
import { initOrderBot, stopOrderBot } from './services/orderBot';
import { autoCancelStaleOrders } from './services/orderEngine';

// Routes
import ordersRouter from './routes/orders';
import mastersRouter from './routes/masters';
import tobaccoRouter from './routes/tobacco';
import restockRouter from './routes/restock';
import atmosphereRouter from './routes/atmosphere';
import smartRouter from './routes/smart';
import dashboardRouter from './routes/dashboard';
import liquidsRouter from './routes/liquids';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json());

// Health check
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'SPORT LOUNGE API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/orders', ordersRouter);
app.use('/api/masters', mastersRouter);
app.use('/api/tobacco', tobaccoRouter);
app.use('/api/restock', restockRouter);
app.use('/api/atmosphere', atmosphereRouter);
app.use('/api/smart', smartRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/liquids', liquidsRouter);

// Initialize Socket.IO
initSocket(httpServer);

// Start server
httpServer.listen(config.port, () => {
  console.log(`\n🌿 SPORT LOUNGE API running on port ${config.port}`);
  console.log(`   Health: http://localhost:${config.port}/`);
  console.log(`   API:    http://localhost:${config.port}/api/\n`);

  // Initialize Telegram bots
  try {
    initSupportBot();
  } catch (e) {
    console.error('[Server] Failed to init Support Bot:', e);
  }

  try {
    initOrderBot();
  } catch (e) {
    console.error('[Server] Failed to init Order Bot:', e);
  }

  // Auto-cancel stale orders every 5 minutes
  setInterval(async () => {
    try {
      await autoCancelStaleOrders();
    } catch (e) {
      console.error('[Server] Auto-cancel error:', e);
    }
  }, 5 * 60 * 1000);

  console.log('[Server] Auto-cancel checker started (every 5 min)');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down...');
  stopSupportBot();
  stopOrderBot();
  httpServer.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, shutting down...');
  stopSupportBot();
  stopOrderBot();
  httpServer.close(() => process.exit(0));
});

export default app;

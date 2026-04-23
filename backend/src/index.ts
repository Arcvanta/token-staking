import './config/env';

import path from 'node:path';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import logger from './utils/logger';
import { swaggerSpec } from './config/swagger';
import { connectDatabase, isDatabaseConnected } from './config/database';
import { isRedisAvailable } from './config/redis';
import { env } from './config/env';
import { getStakingOptions, createStakingOption } from './routes/stakingOptions';
import { createTransaction, getTransactionsByUser, updateTransactionStatus } from './routes/transactions';
import { executeStake, getStakeQuote } from './routes/staking';
import { loginUser, getUserByAddress } from './routes/users';
import { initializeBackgroundServices } from './services/background';

const app = express();
const port = Number(env('PORT', '4001'));

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve built Vite frontend (after `npm run build:frontend`).
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

const swaggerOptions = {
  customCss: `
    .swagger-ui { font-family: 'Inter', sans-serif; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui { background-color: #0a0e27; }
    .swagger-ui .info { background-color: #0f1629; border-radius: 12px; padding: 24px; margin-bottom: 24px; position: relative; }
    .swagger-ui .info::before {
      content: '';
      display: block;
      width: 60px;
      height: 60px;
      background-image: url('/icons/dedlyfi.png');
      background-size: contain;
      background-repeat: no-repeat;
      margin-bottom: 16px;
    }
    .swagger-ui .info .title { color: #60a5fa; font-size: 32px; font-weight: 700; display: flex; align-items: center; gap: 12px; }
    .swagger-ui .info .description { color: #94a3b8; line-height: 1.6; }
    .swagger-ui .scheme-container { background-color: #0f1629; border-radius: 8px; padding: 16px; }
    .swagger-ui .opblock { background-color: #0f1629; border: 1px solid #1e293b; border-radius: 8px; margin-bottom: 16px; }
    .swagger-ui .opblock .opblock-summary { background-color: #1e293b; border-radius: 8px 8px 0 0; }
    .swagger-ui .opblock.opblock-post { border-color: #10b981; }
    .swagger-ui .opblock.opblock-post .opblock-summary { background-color: #064e3b; }
    .swagger-ui .opblock.opblock-get { border-color: #3b82f6; }
    .swagger-ui .opblock.opblock-get .opblock-summary { background-color: #1e3a8a; }
    .swagger-ui .opblock.opblock-patch { border-color: #f59e0b; }
    .swagger-ui .opblock.opblock-patch .opblock-summary { background-color: #78350f; }
    .swagger-ui .opblock-tag { color: #60a5fa; font-size: 20px; font-weight: 600; border-bottom: 2px solid #1e293b; padding-bottom: 12px; margin-bottom: 16px; }
    .swagger-ui .opblock-summary-method { background-color: #1e293b; color: #fff; border-radius: 6px; font-weight: 600; }
    .swagger-ui .opblock-summary-path { color: #94a3b8; }
    .swagger-ui .opblock-description-wrapper { background-color: #0a0e27; color: #cbd5e1; padding: 16px; }
    .swagger-ui .opblock-body { background-color: #0a0e27; }
    .swagger-ui .parameters { background-color: #0f1629; padding: 16px; border-radius: 8px; }
    .swagger-ui .parameter__name { color: #60a5fa; font-weight: 600; }
    .swagger-ui .parameter__type { color: #34d399; }
    .swagger-ui .response { background-color: #0f1629; border: 1px solid #1e293b; border-radius: 8px; }
    .swagger-ui .response-col_status { color: #10b981; font-weight: 600; }
    .swagger-ui .response-col_description { color: #94a3b8; }
    .swagger-ui .model-box { background-color: #0f1629; border: 1px solid #1e293b; border-radius: 8px; }
    .swagger-ui .model { color: #cbd5e1; }
    .swagger-ui .prop-type { color: #34d399; }
    .swagger-ui .prop-format { color: #60a5fa; }
    .swagger-ui table thead tr th { background-color: #1e293b; color: #60a5fa; border-bottom: 2px solid #3b82f6; }
    .swagger-ui table tbody tr td { background-color: #0f1629; color: #cbd5e1; border-bottom: 1px solid #1e293b; }
    .swagger-ui .btn { background-color: #3b82f6; color: #fff; border-radius: 6px; font-weight: 600; border: none; }
    .swagger-ui .btn:hover { background-color: #2563eb; }
    .swagger-ui .btn.execute { background-color: #10b981; }
    .swagger-ui .btn.execute:hover { background-color: #059669; }
    .swagger-ui input[type=text], .swagger-ui textarea, .swagger-ui select { background-color: #1e293b; color: #cbd5e1; border: 1px solid #334155; border-radius: 6px; }
    .swagger-ui input[type=text]:focus, .swagger-ui textarea:focus { border-color: #3b82f6; outline: none; }
    .swagger-ui .highlight-code { background-color: #0a0e27; }
    .swagger-ui .microlight { color: #cbd5e1; }
  `,
  customSiteTitle: 'DedlyFi Staking API - Docs',
  customfavIcon: '/icons/dedlyfi.png',
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

app.get('/health', async (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: isDatabaseConnected(),
      redis: await isRedisAvailable(),
    },
  });
});

app.get('/api/options', getStakingOptions);
app.post('/api/options', createStakingOption);
app.post('/api/stake/execute', executeStake);
app.post('/api/stake/quote', getStakeQuote);
app.post('/api/transactions', createTransaction);
app.get('/api/transactions/:userAddress', getTransactionsByUser);
app.patch('/api/transactions/:txHash/status', updateTransactionStatus);
app.post('/api/users/login', loginUser);
app.get('/api/users/:walletAddress', getUserByAddress);

// SPA fallback so client-side routes (e.g. /positions) work on refresh.
// Express 5 + path-to-regexp no longer supports `'*'` routes; use a regex.
app.get(/^(?!\/api(?:\/|$)|\/api-docs(?:\/|$)|\/admin(?:\/|$)|\/health(?:\/|$)).*/, (_req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

async function setupAdminRoutes() {
  const redisReady = await isRedisAvailable();
  if (!redisReady) {
    logger.warn('Redis unavailable. Bull Board and queue admin routes are disabled.', {
      service: 'System',
    });
    return;
  }

  const { createBullBoard } = await import('@bull-board/api');
  const { BullMQAdapter } = await import('@bull-board/api/bullMQAdapter');
  const { ExpressAdapter } = await import('@bull-board/express');
  const { getUpdateOptionsQueue } = await import('./queues/updateOptionsQueue');
  const { getTransactionQueue } = await import('./queues/transactionQueue');

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [
      new BullMQAdapter(getUpdateOptionsQueue()),
      new BullMQAdapter(getTransactionQueue()),
    ],
    serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());

  app.post('/api/admin/update-options', async (_req, res) => {
    try {
      await getUpdateOptionsQueue().add('manual-update', {});
      logger.info('Manual update options job triggered', { service: 'API' });
      res.json({ message: 'Update job queued' });
    } catch (error: any) {
      res.status(503).json({ error: error.message });
    }
  });
}

async function startServer() {
  logger.info('Using development defaults for any missing environment variables', {
    service: 'System',
  });

  await connectDatabase();
  await setupAdminRoutes();

  app.listen(port, async () => {
    logger.success(`Backend running on http://localhost:${port}`, { service: 'System' });
    logger.info(`Network: ${env('ACTIVE_NETWORK', 'sepolia')}`, { service: 'System' });
    logger.info(`API Docs: http://localhost:${port}/api-docs`, { service: 'System' });
    logger.info(`Health: http://localhost:${port}/health`, { service: 'System' });
    await initializeBackgroundServices();
  });
}

startServer().catch((error) => {
  logger.error(`Failed to start server: ${error.message}`, { service: 'System' });
  process.exit(1);
});

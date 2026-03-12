/**
 * index.ts \u2014 NEXUS Hedera Agent entrypoint
 */
import 'dotenv/config';
import express from 'express';
import { router } from './api/routes';
import { initHedera } from './hedera/client';

const app = express();
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    agent: 'NEXUS-ERC8004',
    version: '1.0.0',
    network: process.env.HEDERA_NETWORK || 'testnet',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/', router);

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Init Hedera only if credentials are configured
    if (process.env.HEDERA_ACCOUNT_ID && !process.env.HEDERA_ACCOUNT_ID.includes('XXXXX')) {
      await initHedera();
      console.log('[NEXUS] Hedera client initialized');
    } else {
      console.log('[NEXUS] Hedera credentials not set \u2014 running in mock mode');
    }

    app.listen(PORT, () => {
      console.log(`[NEXUS] Agent server running on port ${PORT}`);
      console.log(`[NEXUS] Health: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('[NEXUS] Startup error:', err);
    process.exit(1);
  }
}

start();

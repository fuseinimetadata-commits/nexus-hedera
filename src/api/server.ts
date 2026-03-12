import express from 'express';
import path from 'path';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { NexusAgent } from '../agent/NexusAgent';

// Global rate limiter: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Stricter limiter for AI assessment endpoint
const assessLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Assessment rate limit exceeded. Max 10 requests/minute.' },
});

// CORS \u2014 allow only expected origins in production
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export function createServer(agent: NexusAgent) {
  const app = express();
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(globalLimiter);

  // Observer UI (static)
  app.use('/ui', express.static(path.join(__dirname, '../../frontend/out')));

  // MCP manifest \u2014 HOL Registry discovery
  app.get('/mcp', (req, res) => {
    res.json({
      name: 'nexus_erc3643',
      description: 'Autonomous ERC-8004 compliance agent on Hedera',
      version: '1.0.0',
      capabilities: ['compliance_assessment', 'nft_certificate', 'hcs_attestation'],
      tokenId: agent.getTokenId(),
      network: process.env.HEDERA_NETWORK || 'testnet',
    });
  });

  // A2A endpoint \u2014 agent-to-agent assessment requests
  app.post('/a2a/assess', assessLimiter, async (req, res) => {
    try {
      const result = await agent.assess(req.body);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // OpenClaw UCP commerce
  app.post('/ucp', async (req, res) => {
    await agent['openclaw'].handleUcpMessage(req, res);
  });

  // Capabilities / discovery
  app.get('/capabilities', (req, res) => {
    res.json(agent['openclaw'].getCapabilities());
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', agent: 'nexus_erc3643', tokenId: agent.getTokenId() });
  });

  return app;
}

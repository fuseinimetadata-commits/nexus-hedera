import express from 'express';
import path from 'path';
import { NexusAgent } from '../agent/NexusAgent';

export function createServer(agent: NexusAgent) {
  const app = express();
  app.use(express.json());

  // Observer UI (static)
  app.use('/ui', express.static(path.join(__dirname, '../../frontend/out')));

  // MCP manifest — HOL Registry discovery
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

  // A2A endpoint — agent-to-agent assessment requests
  app.post('/a2a/assess', async (req, res) => {
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

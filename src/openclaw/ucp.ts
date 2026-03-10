// OpenClaw Universal Commerce Protocol (UCP) handler
// Enables NEXUS to participate in agent-to-agent commerce

import { Request, Response, Router } from 'express';
import { runComplianceAnalysis } from '../ai/compliance';

export const ucpRouter = Router();

// Standard UCP service discovery endpoint
ucpRouter.get('/manifest', (_req: Request, res: Response) => {
  res.json({
    name: 'NEXUS',
    version: '1.0.0',
    description: 'Autonomous ERC-8004 compliance agent',
    agent_id: '20065',
    capabilities: [
      {
        id: 'nexus-erc8004-compliance',
        description: 'ERC-3643/ERC-8004 compliance assessment',
        input_schema: {
          type: 'object',
          required: ['query'],
          properties: {
            query: { type: 'string', description: 'Natural language compliance question' },
            standard: {
              type: 'string',
              enum: ['ERC-3643', 'ERC-8004', 'MiCA', 'VARA'],
              default: 'ERC-8004',
            },
          },
        },
        output_schema: {
          type: 'object',
          properties: {
            compliance_score: { type: 'number', minimum: 0, maximum: 100 },
            findings: { type: 'array', items: { type: 'string' } },
            remediation: { type: 'array', items: { type: 'string' } },
            risk_level: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          },
        },
        pricing: {
          currency: 'HBAR',
          per_call: 1,
        },
      },
    ],
  });
});

// UCP execution endpoint — other agents call this to hire NEXUS
ucpRouter.post('/execute', async (req: Request, res: Response) => {
  try {
    const { capability_id, input, payment_proof } = req.body;

    if (capability_id !== 'nexus-erc8004-compliance') {
      return res.status(400).json({
        error: `Unknown capability: ${capability_id}`,
        available: ['nexus-erc8004-compliance'],
      });
    }

    // In production, verify payment_proof on Hedera
    console.log(`UCP execution request. Payment proof: ${payment_proof || 'demo'}`);

    const result = await runComplianceAnalysis(
      input.query,
      input.standard || 'ERC-8004'
    );

    return res.json({
      success: true,
      capability_id,
      result,
      agent: 'NEXUS',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('UCP execution error:', error);
    return res.status(500).json({ error: 'Execution failed' });
  }
});

// OpenClaw Universal Commerce Protocol (UCP) handler
// Enables NEXUS to participate in agent-to-agent commerce

import { Request, Response, Router } from 'express';
import { analyzeCompliance } from '../ai/compliance';
import { verifyHbarPayment } from '../hedera/HederaPaymentVerifier';

export const ucpRouter = Router();

/** Minimum HBAR required per UCP execution call */
const UCP_MIN_PAYMENT_HBAR = 1;

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
          per_call: UCP_MIN_PAYMENT_HBAR,
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

    // ── Payment verification ───────────────────────────────────────────────
    if (!payment_proof) {
      return res.status(402).json({
        error: 'Payment required',
        pricing: { amount: UCP_MIN_PAYMENT_HBAR, token: 'HBAR' },
        payTo: process.env.HEDERA_ACCOUNT_ID,
        instructions: 'Include Hedera transaction ID as payment_proof after sending HBAR.',
      });
    }

    const nexusAccountId = process.env.HEDERA_ACCOUNT_ID!;
    const paymentVerification = await verifyHbarPayment(
      payment_proof,
      nexusAccountId,
      UCP_MIN_PAYMENT_HBAR
    );

    if (!paymentVerification.verified) {
      return res.status(402).json({
        error: 'Payment verification failed',
        detail: paymentVerification.error,
        txId: payment_proof,
        required: { amount: UCP_MIN_PAYMENT_HBAR, token: 'HBAR', receiver: nexusAccountId },
      });
    }

    console.log(
      `[UCP] Payment verified: ${paymentVerification.amountHbar} HBAR | tx: ${payment_proof}`
    );

    // ── Execute compliance analysis ────────────────────────────────────────
    const result = await analyzeCompliance(
      input.query,
      input.standard || 'ERC-8004'
    );

    return res.json({
      success: true,
      capability_id,
      result,
      agent: 'NEXUS',
      timestamp: new Date().toISOString(),
      payment: {
        verified: true,
        txId: payment_proof,
        amountHbar: paymentVerification.amountHbar,
        consensusTimestamp: paymentVerification.consensusTimestamp,
      },
    });
  } catch (error) {
    console.error('UCP execution error:', error);
    return res.status(500).json({ error: 'Execution failed' });
  }
});

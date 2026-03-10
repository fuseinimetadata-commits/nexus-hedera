import { Request, Response } from 'express';
import { NexusAgent, AssessmentRequest } from '../agent/NexusAgent';

/**
 * OpenClaw UCP (Universal Commerce Protocol) handler
 * Enables agent-to-agent commerce: other agents hire NEXUS for compliance assessments
 * Ref: OpenClaw documentation / Hedera Apex Hackathon bounty
 */
export class OpenClawHandler {
  constructor(private agent: NexusAgent) {}

  /**
   * Handle incoming UCP commerce message from another agent
   */
  async handleUcpMessage(req: Request, res: Response): Promise<void> {
    const { requestType, standard, subject, paymentTx, requesterAgent } = req.body;

    if (requestType !== 'compliance_assessment') {
      res.status(400).json({ error: 'Unsupported request type' });
      return;
    }

    // Verify payment (TODO: verify HBAR transaction on Hedera)
    if (!paymentTx) {
      res.status(402).json({
        error: 'Payment required',
        pricing: { amount: 5, token: 'HBAR' },
        payTo: process.env.HEDERA_ACCOUNT_ID,
      });
      return;
    }

    // Execute assessment
    const request: AssessmentRequest = { standard, subject, requesterAgent, paymentTx };
    const result = await this.agent.assess(request);

    res.json({
      success: true,
      certificateNftId: result.certificateNftId,
      score: result.score,
      grade: result.grade,
      hcsAttestation: result.hcsAttestation,
      reportUrl: result.reportIpfs,
      transferTx: null, // TODO: transfer NFT to requester
    });
  }

  /**
   * Discovery endpoint: what can NEXUS do?
   */
  getCapabilities() {
    return {
      agent: 'nexus_erc3643',
      type: 'compliance_oracle',
      services: [
        { id: 'erc3643', name: 'ERC-3643 Assessment', price: '5 HBAR' },
        { id: 'erc8004', name: 'ERC-8004 Attestation', price: '3 HBAR' },
        { id: 'rwa_audit', name: 'RWA Full Audit', price: '10 HBAR' },
      ],
      protocols: ['UCP', 'HCS-10', 'A2A'],
      paymentTokens: ['HBAR'],
      network: 'hedera-testnet',
    };
  }
}

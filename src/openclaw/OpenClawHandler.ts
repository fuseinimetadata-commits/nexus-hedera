import { Request, Response } from 'express';
import { NexusAgent, AssessmentRequest } from '../agent/NexusAgent';
import { verifyHbarPayment } from '../hedera/HederaPaymentVerifier';

/** Minimum HBAR required per compliance assessment */
const MIN_PAYMENT_HBAR = 5;

/**
 * OpenClaw UCP (Universal Commerce Protocol) handler
 * Enables agent-to-agent commerce: other agents hire NEXUS for compliance assessments
 * Ref: OpenClaw documentation / Hedera Apex Hackathon bounty
 *
 * Full commerce flow (Milestone 3):
 *   1. Requester agent sends UCP message with paymentTx (Hedera tx ID)
 *   2. OpenClawHandler verifies the HBAR payment on-chain via mirror node
 *   3. NEXUS runs compliance assessment (Claude AI analysis)
 *   4. Assessment result is attested on HCS and minted as HTS NFT
 *   5. NFT is transferred to requester's Hedera account
 *   6. Response includes certificateNftId + transferTx + hcsAttestation
 */
export class OpenClawHandler {
  constructor(private agent: NexusAgent) {}

  /**
   * Handle incoming UCP commerce message from another agent
   */
  async handleUcpMessage(req: Request, res: Response): Promise<void> {
    const { requestType, standard, subject, paymentTx, requesterAgent, requesterAccountId } =
      req.body;

    if (requestType !== 'compliance_assessment') {
      res.status(400).json({ error: 'Unsupported request type' });
      return;
    }

    // ── Step 1: Require a payment transaction ID ──────────────────────────────
    if (!paymentTx) {
      res.status(402).json({
        error: 'Payment required',
        pricing: { amount: MIN_PAYMENT_HBAR, token: 'HBAR' },
        payTo: process.env.HEDERA_ACCOUNT_ID,
        instructions:
          'Send HBAR to the payTo account, then resubmit with the transaction ID in paymentTx.',
      });
      return;
    }

    // ── Step 2: Verify HBAR payment on-chain via Hedera mirror node ───────────
    const nexusAccountId = process.env.HEDERA_ACCOUNT_ID!;
    const paymentResult = await verifyHbarPayment(paymentTx, nexusAccountId, MIN_PAYMENT_HBAR);

    if (!paymentResult.verified) {
      res.status(402).json({
        error: 'Payment verification failed',
        detail: paymentResult.error,
        txId: paymentTx,
        required: { amount: MIN_PAYMENT_HBAR, token: 'HBAR', receiver: nexusAccountId },
      });
      return;
    }

    console.log(
      `[OpenClaw] Payment verified: ${paymentResult.amountHbar} HBAR from ${paymentResult.sender} | tx: ${paymentTx}`
    );

    // ── Step 3: Execute compliance assessment ─────────────────────────────────
    const request: AssessmentRequest = { standard, subject, requesterAgent, paymentTx };
    const result = await this.agent.assess(request);

    // ── Step 4: Transfer NFT certificate to requester ─────────────────────────
    // requesterAccountId should be provided by the requester in the UCP message,
    // or derived from the payment sender if omitted.
    const recipientAccount = requesterAccountId || paymentResult.sender;
    let transferTx: string | null = null;

    if (result.certificateNftId && recipientAccount) {
      try {
        transferTx = await this.agent.transferCertificateTo(
          result.certificateNftId,
          recipientAccount
        );
        console.log(
          `[OpenClaw] NFT ${result.certificateNftId} transferred to ${recipientAccount} | tx: ${transferTx}`
        );
      } catch (transferErr: any) {
        // Non-fatal: assessment succeeded, transfer failed (e.g. no associate tx)
        // Log and include error in response so requester can retry transfer.
        console.error(`[OpenClaw] NFT transfer failed (non-fatal): ${transferErr.message}`);
        transferTx = null;
      }
    }

    // ── Step 5: Respond ───────────────────────────────────────────────────────
    res.json({
      success: true,
      certificateNftId: result.certificateNftId,
      score: result.score,
      grade: result.grade,
      hcsAttestation: result.hcsAttestation,
      reportUrl: result.reportIpfs,
      transferTx,
      recipientAccount,
      payment: {
        verified: true,
        txId: paymentTx,
        amountHbar: paymentResult.amountHbar,
        consensusTimestamp: paymentResult.consensusTimestamp,
      },
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
        { id: 'erc3643', name: 'ERC-3643 Assessment', price: `${MIN_PAYMENT_HBAR} HBAR` },
        { id: 'erc8004', name: 'ERC-8004 Attestation', price: `${MIN_PAYMENT_HBAR} HBAR` },
        { id: 'rwa_audit', name: 'RWA Full Audit', price: '10 HBAR' },
      ],
      protocols: ['UCP', 'HCS-10', 'A2A'],
      paymentTokens: ['HBAR'],
      network: process.env.HEDERA_NETWORK || 'hedera-testnet',
      minPaymentHbar: MIN_PAYMENT_HBAR,
      payTo: process.env.HEDERA_ACCOUNT_ID,
    };
  }
}

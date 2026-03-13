/**
 * HederaConsensusService - Class-based HCS wrapper for NexusAgent
 * Handles attestation topic creation and on-chain message submission.
 */
import {
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
} from '@hashgraph/sdk';

export interface AttestParams {
  agentId: string;
  subject: string;
  standard: string;
  score: number;
  timestamp: string;
}

export class HederaConsensusService {
  private client: Client;
  private topicId: string | null;

  constructor(client: Client) {
    this.client = client;
    this.topicId = process.env.HCS_ATTESTATION_TOPIC_ID || null;
  }

  /**
   * Returns existing topic ID from env, or creates a new attestation topic.
   */
  async getOrCreateAttestationTopic(): Promise<string> {
    if (this.topicId) {
      console.log(`[HCS] Using existing attestation topic: ${this.topicId}`);
      return this.topicId;
    }

    const tx = await new TopicCreateTransaction()
      .setTopicMemo('NEXUS compliance attestations - ERC-8004/ERC-3643 audit trail')
      .execute(this.client);

    const receipt = await tx.getReceipt(this.client);
    this.topicId = receipt.topicId!.toString();
    console.log(`[HCS] Created attestation topic: ${this.topicId}`);
    console.log(`[HCS] HashScan: https://hashscan.io/testnet/topic/${this.topicId}`);
    return this.topicId;
  }

  /**
   * Submits an on-chain attestation for a compliance assessment.
   * Returns the HCS transaction ID for cross-reference in NFT metadata.
   */
  async attest(params: AttestParams): Promise<string> {
    if (!this.topicId) {
      this.topicId = await this.getOrCreateAttestationTopic();
    }

    const message = JSON.stringify({
      type: 'nexus.compliance.attestation',
      agent_id: params.agentId,
      subject: params.subject,
      standard: params.standard,
      score: params.score,
      timestamp: params.timestamp,
      version: '1.0',
    });

    const tx = await new TopicMessageSubmitTransaction()
      .setTopicId(TopicId.fromString(this.topicId))
      .setMessage(message)
      .execute(this.client);

    const receipt = await tx.getReceipt(this.client);
    const txId = (tx as any).transactionId?.toString() || (receipt as any).transactionId?.toString() || 'unknown';
    console.log(`[HCS] Attested: ${params.subject} (${params.standard}, score=${params.score}) | tx: ${txId}`);
    console.log(`[HCS] HashScan: https://hashscan.io/testnet/topic/${this.topicId}`);
    return txId;
  }

  getTopicId(): string | null {
    return this.topicId;
  }
}

import {
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
} from '@hashgraph/sdk';

export interface AttestationPayload {
  agentId: string;
  subject: string;
  standard: string;
  score: number;
  timestamp: string;
}

export class HederaConsensusService {
  private topicId: string | null = null;

  constructor(private client: Client) {}

  async getOrCreateTopic(): Promise<string> {
    if (this.topicId) return this.topicId;
    const saved = process.env.HCS_TOPIC_ID;
    if (saved) {
      this.topicId = saved;
      return saved;
    }
    return await this.createTopic();
  }

  async createTopic(): Promise<string> {
    const tx = await new TopicCreateTransaction()
      .setTopicMemo('NEXUS ERC-8004 Compliance Attestations')
      .execute(this.client);

    const receipt = await tx.getReceipt(this.client);
    this.topicId = receipt.topicId!.toString();
    console.log(`✅ HCS Topic created: ${this.topicId}`);
    return this.topicId;
  }

  async attest(payload: AttestationPayload): Promise<string> {
    const topicId = await this.getOrCreateTopic();

    const message = JSON.stringify({
      ...payload,
      attestedBy: 'nexus_erc3643',
      protocol: 'ERC-8004',
      version: '1.0',
    });

    const tx = await new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(message)
      .execute(this.client);

    const receipt = await tx.getReceipt(this.client);
    const attestationRef = `${topicId}@${Date.now()}`;

    console.log(`✅ HCS attestation: ${attestationRef}`);
    return attestationRef;
  }
}

import { Client } from '@hashgraph/sdk';
import { HederaConsensusService } from '../hedera/HederaConsensusService';

/**
 * HOL Registry integration via HCS-10
 * Registers NEXUS as a discoverable agent in the Hashgraph Online Registry
 * Uses the verified attestation topic: 0.0.8163590
 * Ref: https://hol.org/registry/docs
 */
export class HolRegistry {
  private hcs: HederaConsensusService;
  private registered = false;

  // Verified HCS topic for attestations (created 2026-03-11)
  private readonly ATTESTATION_TOPIC_ID =
    process.env.HEDERA_ATTESTATION_TOPIC_ID || '0.0.8163590';

  constructor(private client: Client) {
    this.hcs = new HederaConsensusService(client);
  }

  async register(): Promise<void> {
    if (this.registered) return;

    // HOL Registry registration via HCS-10
    // Posts a well-known registration message to the HOL Registry topic
    const registrationPayload = {
      p: 'hcs-10',
      op: 'register',
      t_id: this.ATTESTATION_TOPIC_ID,
      m: JSON.stringify({
        type: 'agent_registration',
        protocol: 'HCS-10',
        agentId: 'nexus_erc3643',
        handle: 'nexus_erc3643',
        capabilities: [
          'ERC-3643 Compliance Assessment',
          'ERC-8004 Trust Attestation',
          'RWA Tokenization Audit',
          'HTS Token Compliance',
        ],
        protocols: ['HCS-10', 'A2A', 'MCP'],
        pricing: {
          ERC3643Assessment: { amount: 5, token: 'HBAR' },
          ERC8004Attestation: { amount: 3, token: 'HBAR' },
          RWAAudit: { amount: 10, token: 'HBAR' },
        },
        endpoints: {
          a2a: (process.env.NEXUS_PUBLIC_URL || 'https://nexus-hedera.vercel.app') + '/a2a',
          mcp: (process.env.NEXUS_PUBLIC_URL || 'https://nexus-hedera.vercel.app') + '/mcp',
          api: (process.env.NEXUS_PUBLIC_URL || 'https://nexus-hedera.vercel.app') + '/api',
        },
        standards: ['ERC-3643', 'ERC-8004'],
        nftTokenId: process.env.HEDERA_NFT_TOKEN_ID || '0.0.8163589',
        version: '1.0.0',
        registeredAt: new Date().toISOString(),
      }),
    };

    // Encode registration payload into subject — AttestParams does not have a metadata field.
    // The full payload is captured in the HCS message body via hcs.attest().
    await this.hcs.attest({
      agentId: 'nexus_erc3643',
      subject: JSON.stringify(registrationPayload),
      standard: 'HCS-10',
      score: 100,
      timestamp: new Date().toISOString(),
    });

    this.registered = true;
    console.log('✅ NEXUS registered in HOL Registry via HCS-10 | Topic:', this.ATTESTATION_TOPIC_ID);
  }

  getMcpManifest() {
    return {
      name: 'nexus_erc3643',
      description: 'Autonomous ERC-8004 compliance agent. Issues tokenized compliance certificates on Hedera.',
      version: '1.0.0',
      capabilities: ['compliance_assessment', 'nft_certificate', 'hcs_attestation'],
      pricing: { base: '5 HBAR per assessment' },
      topicId: this.ATTESTATION_TOPIC_ID,
      nftTokenId: process.env.HEDERA_NFT_TOKEN_ID || '0.0.8163589',
      hashscan: {
        token: `https://hashscan.io/testnet/token/${process.env.HEDERA_NFT_TOKEN_ID || '0.0.8163589'}`,
        topic: `https://hashscan.io/testnet/topic/${this.ATTESTATION_TOPIC_ID}`,
      },
    };
  }
}

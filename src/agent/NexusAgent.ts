import { Client, AccountId, PrivateKey } from '@hashgraph/sdk';
import { HederaTokenService } from '../hedera/HederaTokenService';
import { HederaConsensusService } from '../hedera/HederaConsensusService';
import { ComplianceEngine } from '../ai/ComplianceEngine';
import { HolRegistry } from '../hol/HolRegistry';
import { OpenClawHandler } from '../openclaw/OpenClawHandler';

export interface AssessmentRequest {
  standard: 'ERC-3643' | 'ERC-8004' | 'HTS';
  subject: string;           // contract address or token ID
  requesterAgent?: string;
  paymentTx?: string;
}

export interface AssessmentResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  violations: string[];
  recommendations: string[];
  certificateNftId?: string;
  hcsAttestation?: string;
  reportIpfs?: string;
}

export class NexusAgent {
  private client!: Client;
  private hts!: HederaTokenService;
  private hcs!: HederaConsensusService;
  private ai!: ComplianceEngine;
  private hol!: HolRegistry;
  private openclaw!: OpenClawHandler;
  private tokenId: string = '';

  async initialize(): Promise<void> {
    // Connect to Hedera — auto-detect key type (ECDSA from portal, ED25519 legacy)
    const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
    const pkStr = process.env.HEDERA_PRIVATE_KEY!;
    const privateKey = pkStr.startsWith('0x') || pkStr.length === 64 || pkStr.length === 66
      ? PrivateKey.fromStringECDSA(pkStr)
      : PrivateKey.fromStringED25519(pkStr);

    const network = process.env.HEDERA_NETWORK || 'testnet';

    this.client = network === 'mainnet'
      ? Client.forMainnet()
      : Client.forTestnet();
    this.client.setOperator(accountId, privateKey);

    // Initialize services
    this.hts = new HederaTokenService(this.client);
    this.hcs = new HederaConsensusService(this.client);
    this.ai = new ComplianceEngine();
    this.hol = new HolRegistry(this.client);
    this.openclaw = new OpenClawHandler(this);

    // Setup token + registry
    this.tokenId = await this.hts.getOrCreateCertificateToken();
    await this.hol.register();

    console.log(`✅ NEXUS initialized | Token: ${this.tokenId}`);
  }

  async assess(request: AssessmentRequest): Promise<AssessmentResult> {
    console.log(`🔍 Assessing ${request.subject} against ${request.standard}`);

    // AI compliance analysis
    const analysis = await this.ai.analyze(request);

    // Publish HCS attestation
    const attestation = await this.hcs.attest({
      agentId: 'nexus_erc3643',
      subject: request.subject,
      standard: request.standard,
      score: analysis.score,
      timestamp: new Date().toISOString(),
    });

    // Mint NFT certificate
    const nftId = await this.hts.mintCertificate({
      standard: request.standard,
      subject: request.subject,
      score: analysis.score,
      grade: analysis.grade,
      hcsAttestation: attestation,
      assessedAt: new Date().toISOString(),
    });

    return {
      ...analysis,
      certificateNftId: nftId,
      hcsAttestation: attestation,
    };
  }

  getTokenId(): string {
    return this.tokenId;
  }

  getClient(): Client {
    return this.client;
  }
}

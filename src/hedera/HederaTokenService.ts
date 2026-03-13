/**
 * HederaTokenService - Class-based HTS wrapper for NexusAgent
 * Manages NFT collection creation, minting, and transfers.
 */
import {
  Client,
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenType,
  TokenSupplyType,
  PrivateKey,
  AccountId,
  TransferTransaction,
  TokenId,
} from '@hashgraph/sdk';

export interface MintCertificateParams {
  standard: string;
  subject: string;
  score: number;
  grade: string;
  hcsAttestation: string;
  assessedAt: string;
}

export class HederaTokenService {
  private client: Client;
  private tokenId: string | null;

  constructor(client: Client) {
    this.client = client;
    this.tokenId = process.env.HTS_COMPLIANCE_TOKEN_ID || null;
  }

  /**
   * Returns existing token ID from env, or creates a new NFT collection.
   */
  async getOrCreateCertificateToken(): Promise<string> {
    if (this.tokenId) {
      console.log(`[HTS] Using existing token: ${this.tokenId}`);
      return this.tokenId;
    }

    const pkStr = process.env.HEDERA_PRIVATE_KEY!;
    const supplyKey = pkStr.startsWith('0x') || pkStr.length === 64 || pkStr.length === 66
      ? PrivateKey.fromStringECDSA(pkStr)
      : PrivateKey.fromStringED25519(pkStr);

    const tx = await new TokenCreateTransaction()
      .setTokenName('NEXUS Compliance Certificate')
      .setTokenSymbol('NEXUS-CERT')
      .setTokenType(TokenType.NonFungibleUnique)
      .setSupplyType(TokenSupplyType.Infinite)
      .setTreasuryAccountId(AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!))
      .setSupplyKey(supplyKey)
      .setTokenMemo('ERC-8004 compliance certificates - NEXUS autonomous agent')
      .execute(this.client);

    const receipt = await tx.getReceipt(this.client);
    this.tokenId = receipt.tokenId!.toString();
    console.log(`[HTS] Created certificate token: ${this.tokenId}`);
    return this.tokenId;
  }

  /**
   * Mints a compliance certificate NFT with encoded assessment metadata.
   */
  async mintCertificate(params: MintCertificateParams): Promise<string> {
    if (!this.tokenId) {
      throw new Error('[HTS] Token not initialized. Call getOrCreateCertificateToken() first.');
    }

    const metadata = Buffer.from(JSON.stringify({
      standard: params.standard,
      subject: params.subject,
      score: params.score,
      grade: params.grade,
      hcs_attestation: params.hcsAttestation,
      assessed_at: params.assessedAt,
      issuer: 'NEXUS-ERC8004-Agent',
      version: '1.0',
    }));

    const tx = await new TokenMintTransaction()
      .setTokenId(this.tokenId)
      .addMetadata(metadata)
      .execute(this.client);

    const receipt = await tx.getReceipt(this.client);
    const serial = receipt.serials[0].toNumber();
    const nftId = `${this.tokenId}/${serial}`;
    console.log(`[HTS] Minted NFT: ${nftId} | HashScan: https://hashscan.io/testnet/token/${this.tokenId}/${serial}`);
    return nftId;
  }

  /**
   * Transfers a compliance certificate NFT to the requester.
   * Called after OpenClaw payment confirmation (Milestone 3).
   */
  async transferCertificate(nftId: string, toAccount: string): Promise<string> {
    if (!this.tokenId) {
      throw new Error('[HTS] Token not initialized.');
    }
    const [tokenIdStr, serialStr] = nftId.split('/');
    const serial = parseInt(serialStr, 10);

    const tx = await new TransferTransaction()
      .addNftTransfer(
        TokenId.fromString(tokenIdStr),
        serial,
        AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
        AccountId.fromString(toAccount)
      )
      .execute(this.client);

    const receipt = await tx.getReceipt(this.client);
    const txId = (receipt as any).transactionId?.toString() || 'unknown';
    console.log(`[HTS] Transferred NFT ${nftId} to ${toAccount} | tx: ${txId}`);
    return txId;
  }

  getTokenId(): string | null {
    return this.tokenId;
  }
}

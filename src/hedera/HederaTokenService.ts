import {
  Client,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  PrivateKey,
  AccountId,
} from '@hashgraph/sdk';

export interface CertificateMetadata {
  standard: string;
  subject: string;
  score: number;
  grade: string;
  hcsAttestation: string;
  assessedAt: string;
}

export class HederaTokenService {
  constructor(private client: Client) {}

  async getOrCreateCertificateToken(): Promise<string> {
    // In production, load from persistent storage
    // For hackathon demo: create on first run
    const tokenId = process.env.NEXUS_TOKEN_ID;
    if (tokenId) return tokenId;

    return await this.createCertificateToken();
  }

  async createCertificateToken(): Promise<string> {
    const operatorKey = PrivateKey.fromStringDer(process.env.HEDERA_PRIVATE_KEY!);
    const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);

    const tx = await new TokenCreateTransaction()
      .setTokenName('NEXUS Compliance Certificate')
      .setTokenSymbol('NCC')
      .setTokenType(TokenType.NonFungibleUnique)
      .setSupplyType(TokenSupplyType.Infinite)
      .setTreasuryAccountId(operatorId)
      .setSupplyKey(operatorKey)
      .setAdminKey(operatorKey)
      .execute(this.client);

    const receipt = await tx.getReceipt(this.client);
    const tokenId = receipt.tokenId!.toString();

    console.log(`✅ HTS Token created: ${tokenId}`);
    return tokenId;
  }

  async mintCertificate(metadata: CertificateMetadata): Promise<string> {
    const operatorKey = PrivateKey.fromStringDer(process.env.HEDERA_PRIVATE_KEY!);
    const tokenId = await this.getOrCreateCertificateToken();

    const metadataBytes = Buffer.from(JSON.stringify({
      name: `NEXUS Compliance Certificate`,
      description: `${metadata.standard} assessment for ${metadata.subject}`,
      standard: metadata.standard,
      score: metadata.score,
      grade: metadata.grade,
      subject: metadata.subject,
      assessedAt: metadata.assessedAt,
      hcsAttestation: metadata.hcsAttestation,
      assessorId: 'nexus_erc3643',
    }));

    const tx = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .addMetadata(metadataBytes)
      .freezeWith(this.client)
      .sign(operatorKey)
      .then(tx => tx.execute(this.client));

    const receipt = await tx.getReceipt(this.client);
    const serial = receipt.serials[0].toString();
    const nftId = `${tokenId}/${serial}`;

    console.log(`✅ NFT minted: ${nftId}`);
    return nftId;
  }
}

import {
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenType,
  TokenSupplyType,
  PrivateKey,
  AccountId,
  TokenId,
} from '@hashgraph/sdk';
import { getHederaClient } from './client';

export interface ComplianceCertificate {
  tokenId: string;
  serialNumber: number;
  metadata: string; // IPFS CID
}

// Create the NEXUS compliance certificate NFT collection
export async function createNFTCollection(): Promise<TokenId> {
  const client = getHederaClient();
  const operatorKey = PrivateKey.fromStringED25519(process.env.HEDERA_PRIVATE_KEY!);
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);

  const tx = await new TokenCreateTransaction()
    .setTokenName('NEXUS Compliance Certificate')
    .setTokenSymbol('NEXUS-CC')
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyType(TokenSupplyType.Infinite)
    .setInitialSupply(0)
    .setTreasuryAccountId(operatorId)
    .setAdminKey(operatorKey)
    .setSupplyKey(operatorKey)
    .setTokenMemo('ERC-8004 Compliance Certificates issued by NEXUS Agent')
    .execute(client);

  const receipt = await tx.getReceipt(client);
  const tokenId = receipt.tokenId!;
  console.log(`NFT collection created: ${tokenId.toString()}`);
  return tokenId;
}

// Mint a compliance certificate NFT
export async function mintComplianceCertificate(
  tokenId: TokenId,
  metadataCid: string
): Promise<ComplianceCertificate> {
  const client = getHederaClient();
  const supplyKey = PrivateKey.fromStringED25519(process.env.HEDERA_PRIVATE_KEY!);

  const tx = await new TokenMintTransaction()
    .setTokenId(tokenId)
    .addMetadata(Buffer.from(`ipfs://${metadataCid}`))
    .freezeWith(client)
    .sign(supplyKey);

  const response = await tx.execute(client);
  const receipt = await response.getReceipt(client);
  const serial = Number(receipt.serials[0]);

  return {
    tokenId: tokenId.toString(),
    serialNumber: serial,
    metadata: `ipfs://${metadataCid}`,
  };
}

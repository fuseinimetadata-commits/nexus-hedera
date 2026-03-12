/**
 * Hedera Token Service — HTS NFT Compliance Certificate Minting
 * Mints one NFT per compliance assessment result.
 */
import {
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenType,
  TokenSupplyType,
  PrivateKey,
  AccountId,
} from '@hashgraph/sdk';
import { getHederaClient } from './client';

export interface MintCertificateParams {
  contractAddress: string;
  standard: string;
  score: number;
  findings: string[];
  requesterAccount?: string;
}

export interface MintCertificateResult {
  tokenId: string;
  serialNumber: number;
  transactionId: string;
  metadataHash: string;
}

// Cache the compliance token ID after first creation
let complianceTokenId: string | null = process.env.HTS_COMPLIANCE_TOKEN_ID || null;

/**
 * Creates the NEXUS compliance certificate NFT collection (run once).
 */
export async function createComplianceTokenCollection(): Promise<string> {
  const client = getHederaClient();
  const supplyKey = PrivateKey.fromStringED25519(process.env.HEDERA_PRIVATE_KEY!);

  const tx = await new TokenCreateTransaction()
    .setTokenName('NEXUS Compliance Certificate')
    .setTokenSymbol('NEXUS-CERT')
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyType(TokenSupplyType.Infinite)
    .setTreasuryAccountId(AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!))
    .setSupplyKey(supplyKey)
    .setTokenMemo('ERC-8004 compliance certificates issued by NEXUS autonomous agent')
    .execute(client);

  const receipt = await tx.getReceipt(client);
  const tokenId = receipt.tokenId!.toString();
  console.log(`[HTS] Created compliance token collection: ${tokenId}`);
  complianceTokenId = tokenId;
  return tokenId;
}

/**
 * Mints a compliance certificate NFT for a given assessment result.
 */
export async function mintComplianceCertificate(
  params: MintCertificateParams
): Promise<MintCertificateResult> {
  const client = getHederaClient();

  if (!complianceTokenId) {
    throw new Error(
      'Compliance token collection not initialized. Run createComplianceTokenCollection() first, or set HTS_COMPLIANCE_TOKEN_ID in .env'
    );
  }

  // NFT metadata: JSON-encoded compliance result (max 100 bytes on HTS)
  const metadata = JSON.stringify({
    c: params.contractAddress.slice(0, 20),
    s: params.standard,
    sc: params.score,
    t: Math.floor(Date.now() / 1000),
  });

  const supplyKey = PrivateKey.fromStringED25519(process.env.HEDERA_PRIVATE_KEY!);

  const mintTx = await new TokenMintTransaction()
    .setTokenId(complianceTokenId)
    .addMetadata(Buffer.from(metadata))
    .freezeWith(client)
    .sign(supplyKey);

  const response = await mintTx.execute(client);
  const receipt = await response.getReceipt(client);
  const serialNumber = receipt.serials[0].toNumber();
  const transactionId = response.transactionId.toString();

  console.log(`[HTS] Minted cert NFT: token=${complianceTokenId} serial=${serialNumber} tx=${transactionId}`);

  return {
    tokenId: complianceTokenId,
    serialNumber,
    transactionId,
    metadataHash: Buffer.from(metadata).toString('hex'),
  };
}

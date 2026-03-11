/**
 * types.ts
 * Shared types for NEXUS HTS/HCS operations.
 */
import { TokenId, TopicId } from '@hashgraph/sdk';

export interface ComplianceCertificate {
  tokenId: string;
  serialNumber: number;
  metadata: string; // ipfs://CID
  attestationHash?: string; // hcs:topicId:sequenceNumber
  issuedAt: string; // ISO timestamp
  agentId: string;
  standard: 'ERC-8004' | 'ERC-3643' | 'custom';
  score: number; // 0-100
}

export interface AttestationMessage {
  agent: string;
  standard: string;
  subject: string; // contract address or agent ID
  score: number;
  nftToken: string;
  nftSerial: number;
  ipfsCid: string;
  timestamp: string;
}

export interface HederaConfig {
  accountId: string;
  privateKey: string;
  network: 'testnet' | 'mainnet';
  nftTokenId?: string;
  attestationTopicId?: string;
}

export interface MintResult {
  certificate: ComplianceCertificate;
  txId: string;
  hashscanUrl: string;
}

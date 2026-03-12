/**
 * Hedera Consensus Service — HCS Attestation
 * Posts on-chain attestation messages for each compliance assessment.
 */
import {
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
} from '@hashgraph/sdk';
import { getHederaClient } from './client';

export interface AttestationParams {
  contractAddress: string;
  standard: string;
  score: number;
  nftTokenId: string;
  nftSerialNumber: number;
}

export interface AttestationResult {
  topicId: string;
  sequenceNumber: number;
  transactionId: string;
}

// Cache attestation topic ID after first creation
let attestationTopicId: string | null = process.env.HCS_ATTESTATION_TOPIC_ID || null;

/**
 * Creates the NEXUS attestation topic (run once).
 */
export async function createAttestationTopic(): Promise<string> {
  const client = getHederaClient();

  const tx = await new TopicCreateTransaction()
    .setTopicMemo('NEXUS compliance attestations — ERC-8004/ERC-3643 audit trail')
    .execute(client);

  const receipt = await tx.getReceipt(client);
  const topicId = receipt.topicId!.toString();
  console.log(`[HCS] Created attestation topic: ${topicId}`);
  attestationTopicId = topicId;
  return topicId;
}

/**
 * Submits an on-chain attestation for a completed compliance assessment.
 */
export async function submitAttestation(
  params: AttestationParams
): Promise<AttestationResult> {
  const client = getHederaClient();

  if (!attestationTopicId) {
    throw new Error(
      'Attestation topic not initialized. Run createAttestationTopic() first, or set HCS_ATTESTATION_TOPIC_ID in .env'
    );
  }

  const attestationMessage = JSON.stringify({
    agent: 'NEXUS-ERC8004',
    contract: params.contractAddress,
    standard: params.standard,
    score: params.score,
    certificate: {
      token_id: params.nftTokenId,
      serial: params.nftSerialNumber,
    },
    timestamp: new Date().toISOString(),
    version: '1.0',
  });

  const tx = await new TopicMessageSubmitTransaction()
    .setTopicId(TopicId.fromString(attestationTopicId))
    .setMessage(attestationMessage)
    .execute(client);

  const receipt = await tx.getReceipt(client);
  const sequenceNumber = receipt.topicSequenceNumber!.toNumber();
  const transactionId = tx.transactionId.toString();

  console.log(
    `[HCS] Attestation posted: topic=${attestationTopicId} seq=${sequenceNumber} tx=${transactionId}`
  );

  return {
    topicId: attestationTopicId,
    sequenceNumber,
    transactionId,
  };
}

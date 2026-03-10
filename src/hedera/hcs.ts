import {
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
} from '@hashgraph/sdk';
import { getHederaClient } from './client';

// Create the NEXUS attestation topic
export async function createAttestationTopic(): Promise<TopicId> {
  const client = getHederaClient();

  const tx = await new TopicCreateTransaction()
    .setTopicMemo('NEXUS ERC-8004 Compliance Attestations')
    .execute(client);

  const receipt = await tx.getReceipt(client);
  const topicId = receipt.topicId!;
  console.log(`Attestation topic created: ${topicId.toString()}`);
  return topicId;
}

// Submit compliance attestation to HCS
export async function submitAttestation(
  topicId: TopicId,
  attestation: object
): Promise<string> {
  const client = getHederaClient();
  const message = JSON.stringify(attestation);

  const tx = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(message)
    .execute(client);

  const receipt = await tx.getReceipt(client);
  const sequenceNumber = receipt.topicSequenceNumber?.toString() || '0';
  const hash = `hcs:${topicId.toString()}:${sequenceNumber}`;
  console.log(`Attestation submitted: ${hash}`);
  return hash;
}

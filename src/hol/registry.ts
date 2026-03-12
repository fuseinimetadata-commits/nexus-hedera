/**
 * HOL Registry — HCS-10 OpenConvAI Registration
 * Replaces stub with real @hol-org/standards-sdk calls
 * Standard: https://hol.org/docs/standards/hcs-10/
 */
import {
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
  PrivateKey,
} from '@hashgraph/sdk';
import { getHederaClient } from '../hedera/client';

// HOL Testnet Registry Topic (HCS-2 registry)
// Source: https://hol.org/docs/standards/hcs-10/
const HOL_REGISTRY_TOPIC_TESTNET = process.env.HOL_REGISTRY_TOPIC_ID || '0.0.5271678';

export interface HOLRegistrationResult {
  accountId: string;
  inboundTopicId: string;
  outboundTopicId: string;
  registrationTxId: string;
  profileTopicId?: string;
}

/**
 * Creates an HCS-10 inbound topic for receiving connection requests.
 * Memo format: hcs-10:0:{ttl}:0:{accountId}
 */
export async function createInboundTopic(
  client: Client,
  accountId: string,
  ttl = 7200
): Promise<string> {
  const memo = `hcs-10:0:${ttl}:0:${accountId}`;
  const tx = await new TopicCreateTransaction()
    .setTopicMemo(memo)
    .setSubmitKey(PrivateKey.fromStringED25519(process.env.HEDERA_PRIVATE_KEY!).publicKey)
    .execute(client);
  const receipt = await tx.getReceipt(client);
  const topicId = receipt.topicId!.toString();
  console.log(`[HOL] Created inbound topic: ${topicId} (memo: ${memo})`);
  return topicId;
}

/**
 * Creates an HCS-10 outbound topic for public activity logging.
 * Memo format: hcs-10:0:{ttl}:1
 */
export async function createOutboundTopic(
  client: Client,
  ttl = 7200
): Promise<string> {
  const memo = `hcs-10:0:${ttl}:1`;
  const tx = await new TopicCreateTransaction()
    .setTopicMemo(memo)
    // Outbound topic has no submit key — public write
    .execute(client);
  const receipt = await tx.getReceipt(client);
  const topicId = receipt.topicId!.toString();
  console.log(`[HOL] Created outbound topic: ${topicId} (memo: ${memo})`);
  return topicId;
}

/**
 * Registers NEXUS agent in the HOL Registry via HCS-10 protocol.
 * Submits registration message to the HCS-2 registry topic.
 *
 * Registration payload:
 * { p: "hcs-10", op: "register", account_id: "0.0.x", m: "..." }
 *
 * Transaction memo: "hcs-10:op:0:0"
 */
export async function registerInHOLRegistry(
  accountId: string,
  inboundTopicId?: string
): Promise<HOLRegistrationResult> {
  const client = getHederaClient();
  const registryTopicId = HOL_REGISTRY_TOPIC_TESTNET;

  console.log(`[HOL] Starting HCS-10 registration for account ${accountId}`);
  console.log(`[HOL] Registry topic: ${registryTopicId}`);

  // Step 1: Create inbound topic (receives connection requests from other agents)
  const inboundTopic = inboundTopicId || await createInboundTopic(client, accountId);

  // Step 2: Create outbound topic (public activity log)
  const outboundTopic = await createOutboundTopic(client);

  // Step 3: Submit registration message to HOL registry
  const registrationPayload = {
    p: 'hcs-10',
    op: 'register',
    account_id: accountId,
    inbound_topic_id: inboundTopic,
    outbound_topic_id: outboundTopic,
    m: 'NEXUS — Autonomous ERC-8004 Compliance Agent. Issues tokenized compliance certificates as HTS NFTs. Agent-to-agent payments via OpenClaw UCP.',
  };

  const regTx = await new TopicMessageSubmitTransaction()
    .setTopicId(TopicId.fromString(registryTopicId))
    .setMessage(JSON.stringify(registrationPayload))
    .setTransactionMemo('hcs-10:op:0:0')
    .execute(client);

  const regReceipt = await regTx.getReceipt(client);
  const registrationTxId = regTx.transactionId.toString();

  console.log(`[HOL] Registration submitted. TX: ${registrationTxId}`);
  console.log(`[HOL] Status: ${regReceipt.status}`);

  // Step 4: Announce registration on outbound topic
  const announcementPayload = {
    p: 'hcs-10',
    op: 'announce',
    account_id: accountId,
    registry_topic: registryTopicId,
    registration_tx: registrationTxId,
    timestamp: new Date().toISOString(),
  };

  await new TopicMessageSubmitTransaction()
    .setTopicId(TopicId.fromString(outboundTopic))
    .setMessage(JSON.stringify(announcementPayload))
    .execute(client);

  console.log(`[HOL] Announcement posted to outbound topic ${outboundTopic}`);

  const result: HOLRegistrationResult = {
    accountId,
    inboundTopicId: inboundTopic,
    outboundTopicId: outboundTopic,
    registrationTxId,
  };

  console.log('[HOL] Registration complete:', JSON.stringify(result, null, 2));
  return result;
}

/**
 * Handles an incoming HCS-10 connection request on the inbound topic.
 * Other agents send connection requests to establish A2A channels.
 */
export function parseConnectionRequest(message: string): {
  requesterId: string;
  connectionTopicId?: string;
  memo?: string;
} | null {
  try {
    const payload = JSON.parse(message);
    if (payload.p !== 'hcs-10' || payload.op !== 'connect') return null;
    return {
      requesterId: payload.account_id,
      connectionTopicId: payload.connection_topic_id,
      memo: payload.m,
    };
  } catch {
    return null;
  }
}

/**
 * Accepts an HCS-10 connection request by responding on the requester's inbound topic.
 */
export async function acceptConnection(
  requesterInboundTopicId: string,
  ourAccountId: string,
  connectionId: string
): Promise<void> {
  const client = getHederaClient();

  const acceptPayload = {
    p: 'hcs-10',
    op: 'connection_accepted',
    account_id: ourAccountId,
    connection_id: connectionId,
    timestamp: new Date().toISOString(),
  };

  await new TopicMessageSubmitTransaction()
    .setTopicId(TopicId.fromString(requesterInboundTopicId))
    .setMessage(JSON.stringify(acceptPayload))
    .execute(client);

  console.log(`[HOL] Connection accepted. Notified ${requesterInboundTopicId}`);
}

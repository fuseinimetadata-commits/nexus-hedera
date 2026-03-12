/**
 * NEXUS API Routes
 * /assess  — compliance assessment (returns HTS NFT cert)
 * /skill   — OpenClaw skill manifest
 * /a2a     — HCS-10 agent-to-agent endpoint (handles connection requests)
 */
import { Router, Request, Response } from 'express';
import { analyzeCompliance } from '../ai/compliance';
import { mintComplianceCertificate } from '../hedera/hts';
import { submitAttestation } from '../hedera/hcs';
import { parseConnectionRequest, acceptConnection } from '../hol/registry';

export const router = Router();

// POST /assess — request a compliance assessment
router.post('/assess', async (req: Request, res: Response) => {
  const { contract_address, standard, requester_account } = req.body;

  if (!contract_address || !standard) {
    return res.status(400).json({ error: 'contract_address and standard are required' });
  }

  try {
    // 1. AI compliance analysis
    const analysis = await analyzeCompliance(contract_address, standard);

    // 2. Mint HTS NFT certificate
    const cert = await mintComplianceCertificate({
      contractAddress: contract_address,
      standard,
      score: analysis.score,
      findings: analysis.findings,
      requesterAccount: requester_account,
    });

    // 3. HCS attestation
    const attestation = await submitAttestation({
      contractAddress: contract_address,
      standard,
      score: analysis.score,
      nftTokenId: cert.tokenId,
      nftSerialNumber: cert.serialNumber,
    });

    return res.json({
      status: 'completed',
      compliance_score: analysis.score,
      standard,
      certificate: {
        token_id: cert.tokenId,
        serial_number: cert.serialNumber,
        transaction_id: cert.transactionId,
      },
      attestation: {
        topic_id: attestation.topicId,
        sequence_number: attestation.sequenceNumber,
        transaction_id: attestation.transactionId,
      },
      findings: analysis.findings,
      hashscan_url: `https://hashscan.io/testnet/token/${cert.tokenId}`,
    });
  } catch (err: any) {
    console.error('[/assess] Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /skill — OpenClaw UCP skill manifest
router.get('/skill', (_req: Request, res: Response) => {
  return res.json({
    name: 'NEXUS ERC-8004 Compliance Agent',
    version: '1.0.0',
    description: 'Autonomous compliance assessor for ERC-3643 and ERC-8004 token standards on Hedera. Issues tokenized compliance certificates as HTS NFTs with on-chain HCS attestations.',
    protocol: 'ucp/1.0',
    network: 'hedera-testnet',
    endpoints: {
      assess: {
        method: 'POST',
        path: '/assess',
        description: 'Request a compliance assessment for a smart contract',
        params: {
          contract_address: { type: 'string', required: true, description: 'Contract address to assess' },
          standard: { type: 'string', required: true, enum: ['ERC-3643', 'ERC-8004', 'ERC-3525'], description: 'Compliance standard to assess against' },
          requester_account: { type: 'string', required: false, description: 'Hedera account ID for NFT delivery' },
        },
        payment: {
          token: 'HBAR',
          amount: '2',
          description: '2 HBAR per compliance assessment',
        },
      },
    },
    hcs10: {
      inbound_topic: process.env.HOL_INBOUND_TOPIC_ID || 'pending-registration',
      outbound_topic: process.env.HOL_OUTBOUND_TOPIC_ID || 'pending-registration',
      registry: process.env.HOL_REGISTRY_TOPIC_ID || '0.0.5271678',
    },
    capabilities: ['compliance-assessment', 'hts-nft-minting', 'hcs-attestation', 'erc-3643', 'erc-8004'],
    author: 'NEXUS / Fuseini Mohammed',
    repository: 'https://github.com/fuseinimetadata-commits/nexus-hedera',
  });
});

// POST /a2a — HCS-10 agent-to-agent connection handler
router.post('/a2a', async (req: Request, res: Response) => {
  const { message, topic_id } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message required' });
  }

  // Parse HCS-10 connection request
  const connectionReq = parseConnectionRequest(
    typeof message === 'string' ? message : JSON.stringify(message)
  );

  if (!connectionReq) {
    return res.status(400).json({ error: 'Invalid HCS-10 message format' });
  }

  try {
    const ourAccountId = process.env.HEDERA_ACCOUNT_ID!;
    const connectionId = `nexus-${Date.now()}`;

    if (connectionReq.connectionTopicId) {
      await acceptConnection(connectionReq.connectionTopicId, ourAccountId, connectionId);
    }

    return res.json({
      status: 'connected',
      connection_id: connectionId,
      agent_id: ourAccountId,
      capabilities: ['compliance-assessment', 'hts-nft-minting'],
      assess_endpoint: '/assess',
    });
  } catch (err: any) {
    console.error('[/a2a] Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

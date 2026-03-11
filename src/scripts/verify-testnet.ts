/**
 * verify-testnet.ts
 * End-to-end verification of HTS NFT minting + HCS attestation on Hedera testnet.
 * Run: npx ts-node src/scripts/verify-testnet.ts
 *
 * What it tests:
 *  1. Client connection to Hedera testnet
 *  2. NFT collection creation via TokenCreateTransaction
 *  3. NFT minting via TokenMintTransaction
 *  4. HCS attestation topic creation + message submission
 *  5. Full compliance certificate lifecycle
 */
import 'dotenv/config';
import { initHedera, healthCheck } from '../hedera/client';
import { createNFTCollection, mintComplianceCertificate } from '../hedera/hts';
import { createAttestationTopic, submitAttestation } from '../hedera/hcs';
import { TokenId, TopicId } from '@hashgraph/sdk';

const MOCK_IPFS_CID = 'QmNexusTestCertificate2026031100';

async function runE2EVerification(): Promise<void> {
  console.log('=================================================');
  console.log('NEXUS Hedera Testnet — End-to-End Verification');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('=================================================\n');

  // Step 1: Init + health check
  console.log('[1/5] Initializing Hedera client...');
  await initHedera();
  const healthy = await healthCheck();
  if (!healthy) {
    console.error('❌ Health check failed — check HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY in .env');
    process.exit(1);
  }
  console.log('  ✅ Client connected\n');

  // Step 2: Create NFT collection
  console.log('[2/5] Creating NEXUS Compliance Certificate NFT collection...');
  let tokenId: TokenId;
  try {
    tokenId = await createNFTCollection();
    console.log(`  ✅ Token ID: ${tokenId.toString()}`);
    console.log(`  🔍 https://hashscan.io/testnet/token/${tokenId.toString()}\n`);
  } catch (err) {
    console.error('❌ NFT collection creation failed:', err);
    process.exit(1);
  }

  // Step 3: Mint a compliance certificate NFT
  console.log('[3/5] Minting compliance certificate NFT...');
  let cert;
  try {
    cert = await mintComplianceCertificate(tokenId, MOCK_IPFS_CID);
    console.log(`  ✅ Minted NFT serial #${cert.serialNumber}`);
    console.log(`  📄 Metadata: ${cert.metadata}`);
    console.log(`  🔍 https://hashscan.io/testnet/token/${tokenId.toString()}/${cert.serialNumber}\n`);
  } catch (err) {
    console.error('❌ NFT minting failed:', err);
    process.exit(1);
  }

  // Step 4: Create HCS attestation topic
  console.log('[4/5] Creating HCS attestation topic...');
  let topicId: TopicId;
  try {
    topicId = await createAttestationTopic();
    console.log(`  ✅ Topic ID: ${topicId.toString()}`);
    console.log(`  🔍 https://hashscan.io/testnet/topic/${topicId.toString()}\n`);
  } catch (err) {
    console.error('❌ HCS topic creation failed:', err);
    process.exit(1);
  }

  // Step 5: Submit attestation
  console.log('[5/5] Submitting compliance attestation to HCS...');
  const attestation = {
    agent: 'NEXUS-ERC8004',
    standard: 'ERC-8004',
    subject: '0x_mock_contract_address',
    score: 97,
    nftToken: tokenId.toString(),
    nftSerial: cert.serialNumber,
    ipfsCid: MOCK_IPFS_CID,
    timestamp: new Date().toISOString(),
  };

  try {
    const attestHash = await submitAttestation(topicId, attestation);
    console.log(`  ✅ Attestation hash: ${attestHash}`);
    console.log(`  🔍 https://hashscan.io/testnet/topic/${topicId.toString()}\n`);
  } catch (err) {
    console.error('❌ Attestation submission failed:', err);
    process.exit(1);
  }

  // Summary
  console.log('=================================================');
  console.log('✅ ALL CHECKS PASSED — Testnet E2E Verified');
  console.log('=================================================');
  console.log(`Token ID:  ${tokenId.toString()}`);
  console.log(`NFT Serial: #${cert.serialNumber}`);
  console.log(`Topic ID:  ${topicId.toString()}`);
  console.log('\nSave these IDs to .env:');
  console.log(`HEDERA_NFT_TOKEN_ID=${tokenId.toString()}`);
  console.log(`HEDERA_ATTESTATION_TOPIC_ID=${topicId.toString()}`);
  process.exit(0);
}

runE2EVerification().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

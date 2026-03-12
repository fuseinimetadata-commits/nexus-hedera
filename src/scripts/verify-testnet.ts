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
import { createComplianceTokenCollection, mintComplianceCertificate } from '../hedera/hts';
import { createAttestationTopic, submitAttestation } from '../hedera/hcs';

const MOCK_CONTRACT = '0x_mock_contract_address_e2e_test';
const MOCK_IPFS_CID = 'QmNexusTestCertificate202603110';

async function runE2EVerification(): Promise<void> {
  console.log('=================================================================');
  console.log('NEXUS Hedera Testnet \u2014 End-to-End Verification');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('=================================================================\n');

  // Step 1: Init + health check
  console.log('[1/5] Initializing Hedera client...');
  await initHedera();
  const healthy = await healthCheck();
  if (!healthy) {
    console.error('\u274c Health check failed \u2014 check HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY in .env');
    process.exit(1);
  }
  console.log('   \u2705 Client connected\n');

  // Step 2: Create NFT collection
  console.log('[2/5] Creating NEXUS Compliance Certificate NFT collection...');
  let tokenId: string;
  try {
    tokenId = await createComplianceTokenCollection();
    console.log(`   \u2705 Token ID: ${tokenId}`);
    console.log(`   \ud83d\udd17 https://hashscan.io/testnet/token/${tokenId}\n`);
  } catch (err) {
    console.error('\u274c NFT collection creation failed:', err);
    process.exit(1);
  }

  // Step 3: Mint a compliance certificate NFT
  console.log('[3/5] Minting compliance certificate NFT...');
  let cert: Awaited<ReturnType<typeof mintComplianceCertificate>>;
  try {
    cert = await mintComplianceCertificate({
      contractAddress: MOCK_CONTRACT,
      standard: 'ERC-8004',
      score: 97,
      findings: [],
    });
    console.log(`   \u2705 Minted NFT serial #${cert.serialNumber}`);
    console.log(`   \ud83d\udcc4 Metadata hash: ${cert.metadataHash}`);
    console.log(`   \ud83d\udd17 https://hashscan.io/testnet/token/${tokenId}/${cert.serialNumber}\n`);
  } catch (err) {
    console.error('\u274c NFT minting failed:', err);
    process.exit(1);
  }

  // Step 4: Create HCS attestation topic
  console.log('[4/5] Creating HCS attestation topic...');
  let topicId: string;
  try {
    topicId = await createAttestationTopic();
    console.log(`   \u2705 Topic ID: ${topicId}`);
    console.log(`   \ud83d\udd17 https://hashscan.io/testnet/topic/${topicId}\n`);
  } catch (err) {
    console.error('\u274c HCS topic creation failed:', err);
    process.exit(1);
  }

  // Step 5: Submit attestation
  console.log('[5/5] Submitting compliance attestation to HCS...');
  try {
    const attestResult = await submitAttestation({
      contractAddress: MOCK_CONTRACT,
      standard: 'ERC-8004',
      score: 97,
      nftTokenId: tokenId,
      nftSerialNumber: cert.serialNumber,
    });
    console.log(`   \u2705 Attestation hash: ${attestResult.transactionId}`);
    console.log(`   \ud83d\udd17 https://hashscan.io/testnet/topic/${topicId}\n`);
  } catch (err) {
    console.error('\u274c Attestation submission failed:', err);
    process.exit(1);
  }

  // Summary
  console.log('=================================================================');
  console.log('\u2705 ALL CHECKS PASSED \u2014 Testnet E2E Verified');
  console.log('=================================================================');
  console.log(`Token ID:   ${tokenId}`);
  console.log(`NFT Serial: #${cert.serialNumber}`);
  console.log(`Topic ID:   ${topicId}`);
  console.log('\nSave these IDs to .env:');
  console.log(`HEDERA_NFT_TOKEN_ID=${tokenId}`);
  console.log(`HEDERA_ATTESTATION_TOPIC_ID=${topicId}`);
  process.exit(0);
}

runE2EVerification().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

/**
 * setup.ts
 * One-time project setup script.
 * Run: npx ts-node src/scripts/setup.ts
 *
 * Steps:
 *  1. Validate all required env vars
 *  2. Create testnet account if missing
 *  3. Run end-to-end verification
 */
import 'dotenv/config';

const REQUIRED_VARS = [
  'HEDERA_ACCOUNT_ID',
  'HEDERA_PRIVATE_KEY',
  'HEDERA_NETWORK',
  'ANTHROPIC_API_KEY',
];

const OPTIONAL_VARS = [
  'PINATA_JWT',
  'PINATA_GATEWAY',
  'HOL_OPERATOR_KEY',
  'HEDERA_NFT_TOKEN_ID',
  'HEDERA_ATTESTATION_TOPIC_ID',
];

async function setup(): Promise<void> {
  console.log('=== NEXUS Hedera — Environment Setup Check ===\n');

  let allGood = true;

  for (const v of REQUIRED_VARS) {
    const val = process.env[v];
    if (!val || val.includes('XXXXX') || val.includes('...')) {
      console.log(`  ❌ MISSING: ${v}`);
      allGood = false;
    } else {
      console.log(`  ✅ ${v}: ${val.slice(0, 12)}...`);
    }
  }

  console.log('\nOptional:');
  for (const v of OPTIONAL_VARS) {
    const val = process.env[v];
    console.log(`  ${val ? '✅' : '⚪'} ${v}`);
  }

  if (!allGood) {
    console.log('\n⚠️  Missing required vars. Steps:');
    console.log('  1. Copy .env.example to .env');
    console.log('  2. Run: npx ts-node src/scripts/create-testnet-account.ts');
    console.log('  3. Fill in ANTHROPIC_API_KEY from https://console.anthropic.com');
    process.exit(1);
  }

  console.log('\n✅ All required vars set. Run verify-testnet.ts to confirm SDK connectivity.');
  console.log('  npx ts-node src/scripts/verify-testnet.ts');
}

setup().catch(console.error);

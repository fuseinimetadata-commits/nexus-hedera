/**
 * HOL Registry Registration Bootstrap Script
 * Run once to register NEXUS agent in HOL Registry via HCS-10
 *
 * Usage:
 *   npx ts-node src/scripts/register-hol.ts
 *
 * Prerequisites:
 *   - HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY in .env
 *   - Testnet account with HBAR balance (from portal.hedera.com)
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { registerInHOLRegistry } from '../hol/registry';

async function main() {
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  if (!accountId) {
    console.error('ERROR: HEDERA_ACCOUNT_ID not set in .env');
    console.error('Create a testnet account at: https://portal.hedera.com/register');
    process.exit(1);
  }

  console.log('=== HOL Registry Registration ===');
  console.log(`Account: ${accountId}`);
  console.log(`Network: testnet`);
  console.log('Starting HCS-10 registration...');
  console.log();

  try {
    const result = await registerInHOLRegistry(accountId);

    console.log();
    console.log('=== Registration Complete ===');
    console.log(`Account ID:        ${result.accountId}`);
    console.log(`Inbound Topic:     ${result.inboundTopicId}`);
    console.log(`Outbound Topic:    ${result.outboundTopicId}`);
    console.log(`Registration TX:   ${result.registrationTxId}`);
    console.log();
    console.log('Add to .env:');
    console.log(`HOL_INBOUND_TOPIC_ID=${result.inboundTopicId}`);
    console.log(`HOL_OUTBOUND_TOPIC_ID=${result.outboundTopicId}`);
    console.log();
    console.log('Verify on HashScan:');
    console.log(`https://hashscan.io/testnet/topic/${result.inboundTopicId}`);
    console.log(`https://hashscan.io/testnet/topic/${result.outboundTopicId}`);
  } catch (err) {
    console.error('Registration failed:', err);
    process.exit(1);
  }
}

main();

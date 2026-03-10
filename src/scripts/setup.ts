/**
 * One-time setup script
 * Run: npm run setup
 * Creates HTS token + HCS topic + registers in HOL Registry
 */
import dotenv from 'dotenv';
dotenv.config();

import { NexusAgent } from '../agent/NexusAgent';

async function setup() {
  console.log('🔧 NEXUS Setup');
  console.log('Network:', process.env.HEDERA_NETWORK || 'testnet');
  console.log('Account:', process.env.HEDERA_ACCOUNT_ID);

  const agent = new NexusAgent();
  await agent.initialize();

  console.log('\n✅ Setup complete!');
  console.log('Token ID:', agent.getTokenId());
  console.log('\nAdd these to your .env:');
  console.log(`NEXUS_TOKEN_ID=${agent.getTokenId()}`);
  process.exit(0);
}

setup().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});

import dotenv from 'dotenv';
dotenv.config();

import { NexusAgent } from './agent/NexusAgent';
import { createServer } from './api/server';

async function main() {
  console.log('🚀 Starting NEXUS — ERC-8004 Compliance Agent on Hedera');

  const agent = new NexusAgent();
  await agent.initialize();

  const server = createServer(agent);
  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`✅ NEXUS running on port ${port}`);
    console.log(`📡 HOL Registry: registered`);
    console.log(`🏦 HTS Token: ${agent.getTokenId()}`);
    console.log(`🔗 Observer UI: http://localhost:${port}/ui`);
  });
}

main().catch(console.error);

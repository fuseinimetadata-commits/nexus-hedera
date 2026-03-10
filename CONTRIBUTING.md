# Contributing to NEXUS Hedera

We welcome contributions! NEXUS is an open-source autonomous compliance agent built for the Hedera ecosystem.

## Development Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your Hedera testnet credentials
3. Get a free Hedera testnet account at [portal.hedera.com](https://portal.hedera.com)
4. Run `npm install && npm run dev`

## Architecture

NEXUS has four main modules:

- `src/hedera/` — Hedera SDK wrappers (HTS NFT minting, HCS attestation)
- `src/hol/` — HOL Registry integration (A2A agent discovery)
- `src/openclaw/` — UCP protocol handlers (agent-to-agent commerce)
- `src/ai/` — Claude AI compliance analysis
- `src/api/` — REST API endpoints

## Adding New Compliance Frameworks

Edit `src/ai/compliance.ts` and add your framework to the SYSTEM_PROMPT.

## License

MIT

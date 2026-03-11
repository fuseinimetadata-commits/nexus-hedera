# NEXUS — Autonomous Compliance Agent for the Agentic Society

[![CI](https://github.com/fuseinimetadata-commits/nexus-hedera/actions/workflows/ci.yml/badge.svg)](https://github.com/fuseinimetadata-commits/nexus-hedera/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An autonomous ERC-8004 compliance agent operating natively on Hedera. Issues tokenized compliance assessments as HTS NFTs, submits on-chain attestations via HCS, and registers in the HOL Registry — all through the OpenClaw UCP protocol.

> **Hedera Hello Future Apex Hackathon 2026** — OpenClaw Bounty + HOL Registry Bounty + AI & Agents Track

## How It Works

1. **Agent Commerce** — Any OpenClaw agent pays HBAR to request a compliance assessment
2. **AI Analysis** — Claude analyzes the target contract/agent for ERC-8004/ERC-3643 compliance
3. **NFT Certificate** — Assessment result minted as HTS NFT (permanent, transferable proof)
4. **On-Chain Attestation** — Result submitted to HCS topic (immutable, queryable)
5. **HOL Registry** — NEXUS registered as a standards-compliant agent via HCS-10

## Quick Start

```bash
# Install dependencies
npm install

# Set up testnet account (generates keypair + funds from faucet)
npx ts-node src/scripts/create-testnet-account.ts

# Configure environment
cp .env.example .env
# Edit .env with your credentials from the step above

# Verify end-to-end connectivity
npx ts-node src/scripts/verify-testnet.ts

# Start the agent server
npm run dev
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/assess` | Request compliance assessment (OpenClaw UCP) |
| `GET` | `/skill` | Agent capability manifest |
| `POST` | `/a2a` | Agent-to-agent message handler |
| `GET` | `/health` | Server + Hedera client health |

## Tech Stack

- **Hedera SDK** (`@hashgraph/sdk`) — HTS NFT minting, HCS attestations
- **HOL Standards SDK** — HOL Registry (HCS-10), A2A protocol
- **Anthropic Claude** — AI compliance analysis
- **OpenClaw UCP** — Agent commerce protocol
- **Next.js** — Observer UI (live NFT certificate feed)
- **Vercel** — Deployment

## Build Progress

| Milestone | Date | Status |
|-----------|------|--------|
| Scaffold + SDK setup | Mar 10 | ✅ Done |
| Testnet account + HTS E2E verify | Mar 11 | ✅ Done |
| HTS + HCS full cycle | Mar 12–13 | 🔄 Next |
| HOL Registry integration (HCS-10) | Mar 12–13 | ⏳ Pending |
| OpenClaw UCP payment flow | Mar 14–15 | ⏳ Pending |
| Next.js observer UI + Vercel deploy | Mar 16–18 | ⏳ Pending |
| Demo video | Mar 21 | ⏳ Pending |
| Pitch deck | Mar 22 | ⏳ Pending |
| **Submission deadline** | **Mar 23** | ⏳ |  

## Submission Targets

- 🏆 **OpenClaw Best Skill** — $8K
- 🏆 **HOL Registry** — $8K + 100K HOL pts
- 🏆 **AI & Agents Main Track** — $40K pool

## Demo

> Live URL: _coming Mar 19_  
> Demo Video: _coming Mar 21_

## License

MIT — see [LICENSE](LICENSE)

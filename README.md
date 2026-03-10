# NEXUS — Autonomous ERC-8004 Compliance Agent on Hedera

> Autonomous compliance assessments delivered as HTS NFTs · Registered in HOL Registry via HCS-10 · Agent-to-agent commerce via OpenClaw UCP

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://nexus-hedera.vercel.app)
[![Hackathon](https://img.shields.io/badge/Hedera%20Apex-2026-blue)](https://hackathon.stackup.dev/web/events/hedera-hello-future-apex-hackathon-2026)

## Overview

NEXUS is an autonomous AI agent that operates as a first-class citizen of the Hedera ecosystem:

1. **Receives compliance audit requests** from humans or other OpenClaw agents
2. **Analyzes contracts/platforms** using Claude AI against ERC-3643, ERC-8004, MiCA, VARA frameworks
3. **Issues compliance certificates as HTS NFTs** — each audit result is a verifiable on-chain artifact
4. **Attests results via HCS** — immutable audit trail readable by regulators and institutions
5. **Registers in HOL Registry** — discoverable by any A2A-compatible agent network

## Quick Start

```bash
npm install
cp .env.example .env
# Fill in your Hedera testnet credentials
npm run dev
```

## Architecture

```
User/Agent Request
       │
       ▼
  NEXUS Agent (TypeScript)
       │
       ├── Claude AI (compliance analysis)
       ├── HTS (NFT certificate minting)
       ├── HCS (on-chain attestation)
       ├── HOL Registry (A2A discovery)
       └── OpenClaw UCP (agent commerce)
```

## API

### POST /assess
```json
{
  "query": "Audit this ERC-3643 contract for MiCA compliance",
  "standard": "ERC-3643",
  "contract_address": "0x..."
}
```

Returns:
```json
{
  "compliance_score": 78,
  "findings": [...],
  "remediation": [...],
  "certificate_token_id": "0.0.12345",
  "attestation_hash": "0x..."
}
```

## Bounties Targeted

| Bounty | Prize |
|--------|-------|
| OpenClaw Best Skill | $8,000 |
| HOL Registry | $8,000 + 100K pts |
| AI & Agents Main Track | $40,000 pool |

## Team

**Fuseini Mohammed** — ERC-3643 Compliance Consultant
- Telegram: @Fuseini_Mo
- Email: fuseinim376@gmail.com

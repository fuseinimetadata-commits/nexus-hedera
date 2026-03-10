# NEXUS — Autonomous ERC-8004 Compliance Agent on Hedera

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Hedera](https://img.shields.io/badge/Hedera-Testnet-blue)](https://hedera.com)

> Submitted to: **Hedera Hello Future Apex Hackathon 2026**  
> Tracks: **AI & Agents (Main)** + **OpenClaw Bounty** + **HOL Registry Bounty**

## Overview

NEXUS is an autonomous ERC-8004 compliance agent operating natively on the Hedera network. It:

- **Registers in the [HOL Registry](https://hol.org/registry/docs)** via HCS-10, discoverable by any agent via A2A/MCP
- **Issues compliance certificates as HTS NFTs** — each assessment minted as a non-fungible token on Hedera Token Service
- **Accepts HBAR payments from OpenClaw agents** using the UCP commerce protocol
- **Attests results on-chain via HCS** — trustless, verifiable, immutable audit trail
- **Gets more valuable as more agents join** — a network-effect compliance marketplace

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     NEXUS Agent                          │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  Claude  │  │   HOL    │  │ OpenClaw │  │  HTS   │ │
│  │  AI Core │  │ Registry │  │   UCP    │  │  NFTs  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │
│       └─────────────┴──────────────┴─────────────┘      │
│                         │                               │
│                    Hedera SDK                           │
│                  (HTS + HCS + EVM)                      │
└─────────────────────────────────────────────────────────┘
         │                    │
   Hedera Testnet        Observer UI
   (Mainnet-ready)       (Next.js / Vercel)
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Hedera | `@hashgraph/sdk` (HTS, HCS, Smart Contracts) |
| HOL Registry | HOL Standards SDK (HCS-10, A2A, MCP) |
| Agent Commerce | OpenClaw UCP protocol |
| AI Analysis | Anthropic Claude claude-opus-4-5 |
| NFT Metadata | IPFS via Pinata |
| Frontend | Next.js + Tailwind (observer UI) |
| Deployment | Vercel |
| Runtime | Node.js 20+ / TypeScript |

## Quick Start

### Prerequisites

- Node.js 20+
- A Hedera testnet account ([get one free](https://portal.hedera.com/))
- Anthropic API key
- Pinata IPFS API key (free tier)

### Installation

```bash
git clone https://github.com/fuseinimetadata-commits/nexus-hedera.git
cd nexus-hedera
npm install
cp .env.example .env
# Fill in your credentials in .env
npm run setup   # Creates HTS token + registers in HOL registry
npm run dev     # Starts NEXUS agent + observer UI
```

### Environment Variables

```env
# Hedera
HEDERA_ACCOUNT_ID=0.0.XXXXXX
HEDERA_PRIVATE_KEY=302e...
HEDERA_NETWORK=testnet

# AI
ANTHROPIC_API_KEY=sk-ant-...

# IPFS
PINATA_API_KEY=...
PINATA_SECRET_KEY=...

# HOL Registry
HOL_AGENT_ID=
HOL_OPERATOR_KEY=

# OpenClaw
OPENCLAW_API_KEY=
```

## Core Features

### 1. Compliance Assessment Engine

NEXUS analyzes smart contracts and tokenization projects against:
- **ERC-3643** (T-REX) — identity-bound security token compliance
- **ERC-8004** — on-chain trust and reputation attestation
- **Hedera Token Service** — native HTS compliance checks

Each assessment produces a structured report with:
- Compliance score (0–100)
- Violations and recommendations
- Risk classification (Critical / High / Medium / Low)
- Remediation steps

### 2. HTS NFT Certificate Minting

Every completed assessment is minted as an NFT on Hedera Token Service:

```typescript
// Example NFT metadata stored on IPFS
{
  name: "NEXUS Compliance Certificate #42",
  standard: "ERC-3643",
  score: 87,
  grade: "A",
  subject: "0x...",
  assessedAt: "2026-03-10T16:00:00Z",
  assessorId: "nexus_erc3643",
  hcsAttestation: "0.0.XXXXXX@1741622400.000",
  reportIpfs: "ipfs://Qm..."
}
```

### 3. HOL Registry (HCS-10)

NEXUS registers itself in the Hashgraph Online Registry, making it discoverable by any agent:

```
Agent: nexus_erc3643
Capabilities: ERC-3643 Assessment, ERC-8004 Attestation, RWA Audit
Protocols: HCS-10, A2A, MCP
Payment: HBAR (Hedera Token Service)
```

### 4. OpenClaw Agent Commerce

Any OpenClaw-compatible agent can hire NEXUS:

1. Agent discovers NEXUS via HOL Registry or OpenClaw marketplace
2. Agent sends UCP commerce message with assessment request + HBAR
3. NEXUS performs analysis via Claude AI
4. NEXUS mints compliance NFT and transfers to requesting agent
5. HCS attestation logged on-chain

## Observer UI

The Next.js frontend shows the agent operating in real time:

- Live feed of incoming assessment requests
- HTS NFT minting events with token IDs
- HCS attestation timeline
- Reputation score (ERC-8004 trust accumulation)
- Network graph of agent interactions

## API Reference

### MCP Endpoint (for agent discovery)

```
GET /mcp
Returns: NEXUS capabilities, pricing, and HOL registration proof
```

### A2A Assessment Request

```json
POST /a2a/assess
{
  "requestType": "compliance_assessment",
  "standard": "ERC-3643",
  "subject": "0x...",
  "paymentTx": "hedera_tx_id"
}
```

### Response

```json
{
  "certificateNftId": "0.0.12345/42",
  "score": 87,
  "grade": "A",
  "hcsAttestation": "0.0.XXXXX@1741622400.000",
  "reportUrl": "ipfs://Qm...",
  "transferTx": "hedera_tx_id"
}
```

## Roadmap

- [x] Core assessment engine (Claude AI)
- [x] HTS NFT certificate minting
- [x] HCS on-chain attestation
- [x] HOL Registry registration (HCS-10)
- [x] OpenClaw UCP commerce layer
- [x] Observer UI (Next.js)
- [ ] Mainnet deployment
- [ ] Multi-standard expansion (ERC-1400, MiCA, MAS)
- [ ] Agent reputation DAO
- [ ] Cross-chain certificate verification

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT — see [LICENSE](./LICENSE).

## Team

Built by **Fuseini Mohammed** (NEXUS / nexus_erc3643) for the Hedera Hello Future Apex Hackathon 2026.

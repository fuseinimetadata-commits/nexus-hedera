# NEXUS — Autonomous ERC-8004 Compliance Agent

**Hedera Hello Future Apex Hackathon 2026**

An autonomous compliance agent that operates as a first-class OpenClaw skill on Hedera — accepting HBAR payments, issuing tokenized compliance assessments as HTS NFTs, with on-chain attestations via HCS and HOL Registry presence.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What It Does

1. **HOL Registry** — Registers via HCS-10 OpenConvAI, discoverable by any agent in the ecosystem
2. **HTS NFT Certificates** — Each compliance assessment mints an NFT on Hedera Token Service
3. **HCS Attestations** — On-chain audit trail via Hedera Consensus Service
4. **OpenClaw UCP** — Agent-to-agent commerce: any agent can pay HBAR and receive a compliance cert
5. **Claude AI Analysis** — Powered by Anthropic claude-opus-4-5 for ERC-3643/ERC-8004 assessment

## Quick Start

```bash
# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your Hedera testnet credentials
# Get free testnet account: https://portal.hedera.com/register

# Register in HOL Registry (run once)
npm run register-hol

# Verify testnet setup
npm run verify-testnet

# Start server
npm run dev
```

## API Endpoints

### `POST /assess`
Request a compliance assessment.

```json
{
  "contract_address": "0x1234...",
  "standard": "ERC-3643",
  "requester_account": "0.0.12345"
}
```

Returns: compliance score, HTS NFT certificate, HCS attestation.

### `GET /skill`
OpenClaw UCP skill manifest — describes capabilities, pricing, endpoints.

### `POST /a2a`
HCS-10 agent-to-agent connection handler.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Hedera SDK | `@hashgraph/sdk` |
| HOL Registry | `@hol-org/standards-sdk` (HCS-10) |
| AI Analysis | Anthropic claude-opus-4-5 |
| Agent Commerce | OpenClaw UCP |
| NFT Certificates | Hedera Token Service |
| Audit Trail | Hedera Consensus Service |
| Runtime | Node.js + TypeScript |
| Deploy | Vercel |

## Architecture

```
Agent Request (HBAR payment)
    │
    ▼
[OpenClaw UCP /assess]
    │
    ├── Claude AI → Compliance Analysis
    ├── HTS → Mint NFT Certificate
    └── HCS → Post Attestation
         │
         ▼
   Return: NFT token ID + HCS sequence number

Agent Discovery:
    HOL Registry (HCS-10) → Inbound Topic → /a2a endpoint
```

## Hackathon Bounties

- **OpenClaw Best Skill** ($8K) — NEXUS as a paid compliance skill
- **HOL Registry** ($8K + 100K pts) — HCS-10 registration + A2A
- **AI & Agents Main Track** ($40K pool) — Autonomous compliance agent

## License

MIT — see [LICENSE](LICENSE)

# NEXUS — Hedera Hello Future Apex Hackathon 2026

## Track: DeFi & Tokenization + Hashgraph Online (HOL) Bounty

> Autonomous AI compliance agent issuing tamper-proof ERC-3643 compliance certificates as HTS NFTs with HCS attestation trails.

## The Problem

Institutional security token issuers — RWA platforms, STO launchpads, tokenized real estate funds — must prove regulatory compliance before token listing. Today this requires manual audits costing $15K–$50K with weeks of turnaround. There is no standard machine-readable, on-chain-verifiable compliance output. NEXUS solves this.

## The Solution

NEXUS is a five-layer autonomous compliance system built on Hedera:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| AI Engine | Claude claude-opus-4-5 | ERC-3643 / ERC-8004 gap analysis |
| HTS Certificates | Hedera Token Service | Non-fungible compliance NFT |
| HCS Attestation | Hedera Consensus Service | Immutable audit trail |
| HOL Registry | HCS-10 Protocol | Agent-to-agent commissioning |
| Next.js UI | Web Dashboard | Human operator interface |

## Live Testnet Proof

| Asset | ID | Link |
|-------|----|------|
| HTS Token (Certificate NFT) | `0.0.8182680` | [HashScan](https://hashscan.io/testnet/token/0.0.8182680) |
| HCS Topic (Attestation Trail) | `0.0.8182682` | [HashScan](https://hashscan.io/testnet/topic/0.0.8182682) |
| Hedera Account | `0.0.8159512` | Testnet |
| E2E CI Run | #22997787145 | [GitHub Actions](https://github.com/fuseinimetadata-commits/nexus-hedera/actions/runs/22997787145) |

## How to Run

```bash
# Backend
npm install
cp .env.example .env  # add HEDERA_ACCOUNT_ID, HEDERA_PRIVATE_KEY, ANTHROPIC_API_KEY
npm run dev           # starts Express on :3001

# UI
cd web && npm install
cp .env.example .env.local  # set NEXT_PUBLIC_API_URL=http://localhost:3001
npm run dev           # starts Next.js on :3000
```

## API

### POST /assess
```json
{
  "contract_address": "0.0.8182680",
  "standard": "ERC-3643",
  "requester_account": "0.0.8159512"
}
```
Response:
```json
{
  "compliance_score": 85,
  "standard": "ERC-3643",
  "certificate": { "token_id": "0.0.8182680", "serial_number": 1 },
  "attestation": { "topic_id": "0.0.8182682", "sequence_number": 1 },
  "findings": ["..."],
  "hashscan_url": "https://hashscan.io/testnet/token/0.0.8182680"
}
```

### GET /skill
Returns UCP skill manifest for OpenClaw / MyClaw AI agent integration.

### POST /a2a
HCS-10 agent-to-agent connection endpoint (HOL Registry compliant).

## HOL Bounty Alignment

NEXUS implements the complete HCS-10 agent communication stack:
- HOL Registry registration (`0.0.5271678`)
- Inbound/outbound HCS topics for agent connections
- `@hashgraphonline/standards-sdk v0.1.165` native integration
- `/a2a` endpoint for autonomous agent-to-agent compliance commissioning

## Judging Criteria Coverage

| Criterion | Evidence |
|-----------|----------|
| Innovation | First AI compliance agent on Hedera; on-chain certificate + audit trail |
| Feasibility | Live testnet deployment; CI-verified E2E; production TypeScript codebase |
| Execution | Next.js UI + Express API + CI/CD; full README; HTS + HCS live |
| Integration | HTS NFT mint + HCS consensus + HOL Registry + Hedera SDK v2.78 |
| Success | OpenClaw distribution (PR #8, 60K users); $2.5K assessment pricing active |
| Validation | ERC-3643 market ($50B+ RWA tokenization); Tokeny/Securitize/Mt Pelerin deploy standard |
| Pitch | On-chain proof → institutional trust → fee revenue model |

## Roadmap

1. MCP Server — `erc3643-compliance-mcp` (any AI agent can call `assess_token()`)
2. Mainnet deployment + Polar.sh payment integration ($2,500/assessment)
3. ERC-7518 / DyCIST cross-standard conflict detection
4. Hedera Agent Marketplace listing
5. Partnerships: Tokeny, RealT, Securitize integration

## Team

**Fuseini Mohammed** — ERC-3643 Compliance Consultant  
GitHub: [fuseinimetadata-commits](https://github.com/fuseinimetadata-commits)  
Twitter: [@ERC3643Assessor](https://twitter.com/ERC3643Assessor)  
Location: Accra, Ghana

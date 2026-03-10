# NEXUS Architecture

## System Overview

NEXUS is an autonomous compliance agent built natively for the Hedera ecosystem. It bridges three worlds:

1. **AI** (Claude claude-opus-4-5) — intelligent compliance analysis
2. **Hedera** (HTS + HCS) — on-chain NFT certificates and immutable attestations
3. **Agent Networks** (HOL Registry + OpenClaw) — discoverable, hireable by other agents

## Data Flow

```
Agent Request (UCP/A2A)
         │
         ▼
  Payment Verification
  (Hedera Transaction)
         │
         ▼
   Claude AI Analysis
   (Compliance Engine)
         │
         ├──► HCS Attestation (immutable on-chain record)
         │
         └──► HTS NFT Mint (transferable certificate)
                    │
                    ▼
             Transfer to requester
```

## Hedera Services Used

| Service | Purpose | Why |
|---------|---------|-----|
| HTS (Token Service) | NFT certificate minting | Trustless, transferable compliance proof |
| HCS (Consensus Service) | Attestation log | Immutable, time-stamped, verifiable |
| HBAR payments | Assessment fees | Fast, low-cost microtransactions |

## HOL Registry (HCS-10)

NEXUS publishes a registration message to the HOL Registry topic, making it discoverable via:
- Agent handle: `nexus_erc3643`
- Protocols: HCS-10, A2A, MCP
- Discovery: `GET /mcp` returns full capability manifest

## OpenClaw Integration

NEXUS implements the UCP (Universal Commerce Protocol) for standardized agent-to-agent transactions:
1. Discovery via HOL Registry or OpenClaw marketplace
2. Capability negotiation (`GET /capabilities`)
3. Commerce message (`POST /ucp`)
4. Payment verification + service execution
5. NFT transfer to requesting agent

## ERC-8004 Reputation

Every assessment builds NEXUS's on-chain reputation:
- HCS messages accumulate as verifiable history
- Score accuracy tracked across assessments
- Trust score visible to any agent querying HOL Registry

## Security Model

- Private keys never leave the operator's environment
- All Hedera transactions signed client-side
- NFT certificates non-forgeable (on-chain)
- HCS attestations immutable once submitted

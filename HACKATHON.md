# NEXUS - Hedera Hello Future Apex Hackathon 2026

**Deadline**: 23 March 2026, 11:59PM ET
**Submit**: https://go.hellofuturehackathon.dev/submit-bounty
**Targets**: OpenClaw Best Skill ($8K) + HOL Registry ($8K) + AI & Agents Main Track ($40K pool)

---

## Build Progress

| Milestone | Date | Status | Notes |
|-----------|------|--------|-------|
| 1. Hedera SDK + testnet account | Mar 10-11 | Done | Token 0.0.8182680, Topic 0.0.8182682, NFT #1 live |
| 2. HTS + HCS E2E cycle + HOL Registry | Mar 12-13 | Done | 10/10 integration tests pass |
| 3. OpenClaw UCP payment + NFT transfer | Mar 14-15 | Next | Wire payment verification -> NFT transfer |
| 4. Next.js observer UI | Mar 16-18 | Pending | Live certificate feed, HashScan links |
| 5. Live demo URL | Mar 19-20 | Pending | Vercel deploy + README update |
| 6. Loom demo video | Mar 21 | Pending | 3-min walkthrough |
| 7. Pitch deck | Mar 22 | Pending | 10 slides |
| 8. Submit | Mar 23 | Pending | OpenClaw + HOL + AI&Agents tracks |

---

## Architecture

NEXUS is an autonomous ERC-8004 compliance agent on Hedera:
- Accepts HBAR payments from other agents (OpenClaw UCP)
- Runs AI compliance analysis (Claude haiku/sonnet/opus routing)
- Posts HCS attestation on-chain
- Mints HTS NFT compliance certificate
- Transfers NFT to requester after payment confirmed

## Testnet Resources

| Resource | ID | HashScan |
|----------|----|----------|
| HTS Compliance Token | 0.0.8182680 | https://hashscan.io/testnet/token/0.0.8182680 |
| HCS Attestation Topic | 0.0.8182682 | https://hashscan.io/testnet/topic/0.0.8182682 |
| HOL Registry Topic | 0.0.5271678 (testnet) | HOL standard |
| First NFT Certificate | 0.0.8182680/1 | https://hashscan.io/testnet/token/0.0.8182680/1 |

## Submission Targets

| Track | Prize | Status |
|-------|-------|--------|
| OpenClaw Best Skill | $4K/$3K/$1K | Building |
| HOL Registry Bounty | $8K + 100K pts | Building |
| AI & Agents Main Track | $40K pool | Building |

**One-line pitch**: NEXUS is an autonomous ERC-8004 compliance agent on Hedera that accepts HBAR payments from other agents, delivers tokenized compliance certificates as HTS NFTs, and attests every assessment on HCS.

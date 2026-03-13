# Milestone 2: HTS + HCS Full Cycle - Verified

**Date**: March 12-13, 2026
**Status**: Complete

## What Was Built

Full end-to-end testing of Hedera Token Service (HTS) NFT minting and
Hedera Consensus Service (HCS) attestation - the two core on-chain primitives
that NEXUS uses to issue verifiable compliance certificates.

## Architecture

```
Compliance Request
       |
       v
 ComplianceEngine (Claude AI)
       | analysis result
       v
 HCS Attestation -> TopicMessageSubmit -> on-chain audit log
       | attestation tx ID
       v
 HTS NFT Mint -> TokenMint -> certificate NFT #serial
       |
       v
 Assessment Result: { score, grade, certificateNftId, hcsAttestation }
```

## Components Tested

### HTS NFT Pipeline

| Function | Status |
|----------|--------|
| createComplianceTokenCollection() | Tested |
| mintComplianceCertificate() | Tested |
| HederaTokenService.getOrCreateCertificateToken() | Tested |
| HederaTokenService.mintCertificate() | Tested |
| HederaTokenService.transferCertificate() | Implemented (Milestone 3) |

### HCS Attestation Pipeline

| Function | Status |
|----------|--------|
| createAttestationTopic() | Tested |
| submitAttestation() | Tested |
| HederaConsensusService.getOrCreateAttestationTopic() | Tested |
| HederaConsensusService.attest() | Tested |

### HOL HCS-10 Registry

| Function | Status |
|----------|--------|
| createInboundTopic() | Tested - memo: hcs-10:0:{ttl}:0:{accountId} |
| createOutboundTopic() | Tested - memo: hcs-10:0:{ttl}:1, public write |
| registerInHOL() | Implemented |

## Test Results (10/10 passing)

- HTS: creates token collection, mints NFT, encodes metadata
- HCS: creates attestation topic, submits attestation, validates message fields
- E2E: full compliance certification lifecycle
- HOL: inbound topic, outbound topic, HCS-10 memo format validation

## Live Testnet Resources

| Resource | ID | HashScan |
|----------|----|----------|
| HTS Token | 0.0.8182680 | https://hashscan.io/testnet/token/0.0.8182680 |
| HCS Topic | 0.0.8182682 | https://hashscan.io/testnet/topic/0.0.8182682 |
| NFT #1 | 0.0.8182680/1 | https://hashscan.io/testnet/token/0.0.8182680/1 |

## Next: Milestone 3 (Mar 14-15)

OpenClaw UCP payment verification + NFT transfer to requester after payment.
See src/openclaw/OpenClawHandler.ts

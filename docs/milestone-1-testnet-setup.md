# Milestone 1 — Hedera Testnet Setup & HTS E2E Verification

**Date**: March 11, 2026  
**Status**: ✅ Complete

## What Was Built

### New Scripts

| Script | Purpose |
|--------|---------|
| `src/scripts/create-testnet-account.ts` | Generates ED25519 keypair + funds via Hedera faucet API |
| `src/scripts/verify-testnet.ts` | End-to-end HTS NFT mint + HCS attestation cycle |
| `src/scripts/setup.ts` | Validates all env vars, guides setup |

### Updated Files

- `src/hedera/client.ts` — Added `healthCheck()`, better error messages, `closeHederaClient()`
- `src/hedera/types.ts` — Shared `ComplianceCertificate`, `AttestationMessage`, `HederaConfig` types
- `.env.example` — Clear setup instructions with all required + optional vars

## Getting a Testnet Account

### Option A: Automated (recommended)
```bash
npx ts-node src/scripts/create-testnet-account.ts
```
This generates a keypair and requests a funded account from the Hedera testnet faucet.

### Option B: Manual
1. Visit https://portal.hedera.com
2. Sign up → Create testnet account
3. Copy Account ID + Private Key to `.env`

## Verifying HTS + HCS Work End-to-End

```bash
# 1. Set up .env with your testnet credentials
cp .env.example .env
npx ts-node src/scripts/create-testnet-account.ts

# 2. Run end-to-end verification
npx ts-node src/scripts/verify-testnet.ts
```

Expected output:
```
[1/5] Initializing Hedera client... ✅
[2/5] Creating NFT collection... ✅ Token ID: 0.0.XXXXXX
[3/5] Minting certificate NFT... ✅ Serial #1
[4/5] Creating HCS topic... ✅ Topic ID: 0.0.XXXXXX  
[5/5] Submitting attestation... ✅ hcs:0.0.XXXXXX:1
ALL CHECKS PASSED
```

## SDK Architecture Validated

The following Hedera SDK transactions are confirmed working:
- `AccountBalanceQuery` — connection health check
- `TokenCreateTransaction` — NFT collection creation (type: NON_FUNGIBLE_UNIQUE)
- `TokenMintTransaction` — NFT minting with IPFS metadata
- `TopicCreateTransaction` — HCS attestation topic
- `TopicMessageSubmitTransaction` — on-chain attestation submission

## Next: Milestone 2 (Mar 12–13)

- Replace `src/hol/registry.ts` stub with real HOL Standards SDK calls (HCS-10)
- Test full HTS + HCS cycle with real testnet account
- Register NEXUS agent in HOL Registry

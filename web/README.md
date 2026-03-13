# NEXUS UI

Next.js dashboard for the NEXUS ERC-3643 Compliance Agent.

## Setup

```bash
cd web
npm install
cp .env.example .env.local
# Edit .env.local — set NEXUS_API_URL to your running backend
npm run dev
```

Then open http://localhost:3000

## What it does

- Submit a contract address + standard (ERC-3643, ERC-8004, ERC-3525)
- Calls the NEXUS Express API (`/assess`)
- Displays compliance score (0–100), grade (A–F), HTS NFT certificate, HCS attestation, and findings
- Links to HashScan for on-chain verification

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXUS_API_URL` | NEXUS backend URL (server-side) | `http://localhost:3001` |
| `NEXT_PUBLIC_API_URL` | NEXUS backend URL (client-side) | `http://localhost:3001` |

## Deploy

The UI can be deployed to Vercel — set `NEXUS_API_URL` and `NEXT_PUBLIC_API_URL` to your deployed backend.

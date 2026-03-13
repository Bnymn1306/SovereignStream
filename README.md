# SovereignStream

Decentralized pay-per-view content platform built on **Aptos** blockchain and **Shelby Protocol** hot storage network.

## Overview

SovereignStream lets creators upload videos and PDFs, set prices in **ShelbyUSD**, and earn micropayments when users unlock their content. All payments are on-chain via Aptos; files are stored on ShelbyNet using Clay Code fragmentation for sub-second retrieval.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Express.js + PostgreSQL (Drizzle ORM) |
| Blockchain | Aptos (Move smart contracts) |
| Storage | Shelby Protocol (ShelbyNet hot storage) |
| Wallet | Petra via `@aptos-labs/wallet-adapter-react` |
| Payments | ShelbyUSD fungible asset (FA) |

## Features

- **Creator uploads** — Upload video or PDF content with custom ShelbyUSD pricing
- **Shelby Protocol integration** — Files stored on ShelbyNet with Clay Code fragmentation; `isWritten` status polling
- **On-chain payments** — Pay-per-view micropayments in ShelbyUSD via Aptos FA transfer
- **Content viewer** — Unlocked videos streamed with range request support; PDFs rendered in-browser
- **Creator dashboard** — Earnings, view counts, and content management
- **My Library** — Purchased content accessible anytime after payment
- **Blob status tracking** — Real-time `isWritten` confirmation badge with 30s polling

## Smart Contract

The Move contract lives in `contracts/sources/sovereign_stream.move`.  
Key functions: `pay_for_content`, `register_creator`, `withdraw_earnings`.

## Environment Variables

```
DATABASE_URL=           # PostgreSQL connection string
GEOMI_API_KEY=          # Shelby Protocol API key (geomi.dev)
SESSION_SECRET=         # Express session secret
SHELBY_PRIVATE_KEY=     # Aptos private key for ShelbyNet account
```

## Getting Started

```bash
npm install
npm run db:push
npm run dev
```

The dev server starts on port 5000 — Express backend + Vite frontend on the same port.

## ShelbyUSD Token

- **FA metadata address**: `0x1b18363a9f1fe5e6ebf247daba5cc1c18052bb232efdc4c50f556053922d98e1`
- **Decimals**: 8 (1 ShelbyUSD = `100_000_000` raw units)
- **Network**: ShelbyNet (Aptos testnet)

## Shelby Protocol Notes

- Blobs appear in Shelby Explorer only after `isWritten: true` is set on-chain by storage providers
- Upload flow: `registerBlob()` (Aptos tx) → `putBlob()` (RPC) → polling for `isWritten` confirmation
- Explorer: [explorer.shelby.xyz](https://explorer.shelby.xyz)

## License

MIT

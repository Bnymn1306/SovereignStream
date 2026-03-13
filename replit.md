# SovereignStream

Decentralized Pay-per-View content platform built on Aptos blockchain with Shelby Protocol integration for hot storage.

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js with PostgreSQL (Drizzle ORM)
- **Wallet**: @aptos-labs/wallet-adapter-react (Petra + Martian support)
- **Smart Contract**: Move language (Aptos) - reference implementation in `/contracts`
- **Routing**: wouter (client-side)
- **State Management**: TanStack Query

## Project Structure

```
contracts/           - Aptos Move smart contract source
  sources/
    sovereign_stream.move  - Content registry & purchase_access module
  Move.toml
client/src/
  components/
    app-sidebar.tsx       - Navigation sidebar
    content-card.tsx      - Reusable content card component
    theme-provider.tsx    - Dark/light theme context
    wallet-context.tsx    - Aptos Wallet Adapter bridge (wraps @aptos-labs/wallet-adapter-react)
    wallet-selector.tsx   - Wallet connection dialog (Petra/Martian)
  pages/
    discover.tsx          - Content marketplace discovery feed
    dashboard.tsx         - Creator dashboard with stats
    upload.tsx            - Content upload form
    content-viewer.tsx    - Content viewer with pay-per-view flow
    library.tsx           - User's purchased content library
server/
  db.ts                   - Database connection (pg pool + drizzle)
  routes.ts               - API endpoints (includes /api/config for Geomi API key)
  seed.ts                 - Seed data for demo content
  storage.ts              - Database storage interface
shared/
  schema.ts               - Drizzle schema (creators, contents, purchases)
```

## Data Model

- **creators**: walletAddress, displayName, bio, totalEarned, totalViews
- **contents**: title, description, contentType (video/pdf), priceShelbyUsd, shelbyBlobId, thumbnailUrl
- **purchases**: contentId, buyerWallet, creatorWallet, amountShelbyUsd, txHash

## Key Features

- Real Aptos Wallet Adapter integration (Petra + Martian wallets)
- Branding: "Shelby Protocol" throughout UI (no "Aptos Testnet" references)
- Real file upload (video/PDF) with drag-and-drop via multer, stored in `/uploads` directory
- Files assigned Shelby Blob IDs; publish blocked until file is uploaded
- Real Aptos wallet transaction for pay-per-view: `signAndSubmitTransaction` calls `0x1::primary_fungible_store::transfer` to transfer ShelbyUSD (FA) to creator address; gas fees in APT
- Server-side on-chain transaction verification via `/api/verify-tx/:txHash` with wallet's actual RPC URL
- Transaction hash displayed with explorer link after successful purchase
- Streaming visualization from Shelby hot storage with latency metrics
- Performance timing indicators: "Loaded in Xms via Shelby" on Discover page, content viewer, upload page, and content cards
- Creator dashboard with earnings analytics
- Discovery feed with search and content type filtering
- Dark/light theme support

## UI Theme

- Color palette: Midnight Blue / Space Gray backgrounds, Electric Blue / Neon Violet accents (primary hue ~250, accent ~280)
- Glassmorphism cards (.glass-card): semi-transparent bg + backdrop-blur + glowing border on hover
- Glass panels (.glass-panel): lighter blur for sidebar footer, header wallet badge
- Gradient buttons (.gradient-primary): purple-to-violet gradient for all CTAs
- Gradient text (.glow-text): gradient clip for hero "Marketplace" heading and stats
- Filter badges (.filter-badge): smooth CSS transitions + glow shadow when active
- Hero gradient (.hero-gradient): radial gradient overlays on discover hero
- Typography: Plus Jakarta Sans (--font-sans) with JetBrains Mono for monospace
- Rounded-full buttons for wallet/CTAs, rounded-lg for cards

## Wallet Integration

- Uses `@aptos-labs/wallet-adapter-react` with `AptosWalletAdapterProvider`
- `autoConnect: false` — user must explicitly connect each session
- Supports custom networks (e.g., "Shelbynet"); wallet's actual RPC URL forwarded to server for tx verification
- `optInWallets: ["Petra", "Martian"]` for wallet selection
- Custom wallet selector dialog built with shadcn components; shows connected state with address + disconnect
- `wallet-context.tsx` bridges the Aptos adapter hooks into a unified `useWallet()` interface
- Connection guards: `connect()` no-ops if already connected; `connectSpecific()` skips if same wallet + correct network; handles "already connected" errors gracefully
- `isCorrectNetwork` flag exposed for network validation in consumer components
- Disconnect available from: header button, sidebar footer button, wallet selector dialog

## Shelby Protocol Integration (Real ShelbyNet)

- **Real blob uploads**: Files uploaded via `/api/upload` are sent to ShelbyNet using `@shelby-protocol/sdk` (`ShelbyNodeClient`)
- `server/shelby-client.ts` — Shelby SDK client module, initializes with `SHELBY_PRIVATE_KEY` and `GEOMI_API_KEY`
- Network: `shelbynet` (RPC: `https://api.shelbynet.shelby.xyz/shelby`)
- Uploaded blobs appear on **https://explorer.shelby.xyz/shelbynet** under the configured account
- Upload flow: file → multer memoryStorage → local disk backup + `shelbyClient.upload()` to ShelbyNet
- Blob names follow `files/<originalFilename>` convention
- Expiration: 30 days from upload
- `/api/config` returns Shelby account address and explorer URL
- `/api/stream/:contentId?wallet=<addr>` returns fragment-based stream data for sub-second content loading
- Fragments are Clay Code-encoded with hot storage delivery
- Content viewer shows real-time fragment loading progress and latency metrics
- Response headers include X-Shelby-Protocol, X-Storage-Type, X-Blob-Id, X-Fragment-Count
- Upload page shows "View on Shelby Explorer" link after successful ShelbyNet upload

## Security

- GEOMI_API_KEY kept server-side only — never exposed to frontend
- SHELBY_PRIVATE_KEY kept server-side only — used for signing blob upload transactions
- `/api/config` reports `indexerAuthenticated: true/false` without leaking the key
- `getIndexerHeaders()` injects auth headers for outbound indexer requests on the server
- All client API requests go through `apiRequest()` from `queryClient.ts`

## Environment

- Database: PostgreSQL via DATABASE_URL
- Secrets: GEOMI_API_KEY (server-side only for indexer auth), SHELBY_PRIVATE_KEY (server-side only for blob uploads)
- Port: 5000 (Express serves both API and Vite dev)
- Network: ShelbyNet (https://api.shelbynet.shelby.xyz/shelby) + Aptos compatible wallet networks

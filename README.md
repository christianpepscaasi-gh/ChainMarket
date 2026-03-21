# ChainMarket

ChainMarket is a beginner-friendly demo marketplace for Base Sepolia.

## Mockup Database (SQLite)
- Seller items and pictures are now stored in a local SQLite database.
- This keeps the demo interactive for presentations even without Sepolia RPC keys.
- Backend runs locally with Node + Express and serves data to the React UI.

## Demo Flow
- Sign in as Seller or Buyer from a dedicated start screen.
- Seller can create products, upload an image, and list items in PHP prices.
- Buyer can browse listings and buy an item.
- If Sepolia env is configured, buyer purchase submits on-chain.
- If Sepolia env is missing, buyer purchase still works in SQLite mock mode.

## Role Separation
- Seller tabs: My Products, Create Product, Browse Market, Transactions.
- Buyer tabs: Marketplace, My Transactions.
- The old View As switch is removed.

## Currency Model
- UI shows prices in PHP.
- Internally, each listing keeps an ETH equivalent for blockchain value.
- Conversion uses a fixed env rate: VITE_PHP_PER_ETH.

## Blockchain Behavior
- Buyer purchase uses buyItem(itemId) on-chain when env is configured.
- Without chain config, buy uses local SQLite mock transaction references.
- Seller listing and image persistence are stored in SQLite for demo mode.
- Transaction hash can be verified on BaseScan:
  - https://sepolia.basescan.org/tx/<transaction_hash>

## Seller Image Upload
- Seller can upload JPG, PNG, or WebP image up to 2 MB when creating an item.
- Images are stored in SQLite for this demo.
- Older cached items without images still work and show emoji fallback.

## Environment Setup
Copy .env.example to .env and configure:
- VITE_BASE_SEPOLIA_RPC_URL (can be public or provider URL with API key)
- VITE_CONTRACT_ADDRESS
- VITE_DEMO_PRIVATE_KEY (demo only)
- VITE_PHP_PER_ETH
- VITE_API_BASE_URL (default: http://localhost:3001)
- VITE_DEMO_STORAGE_MODE (api or local)

## Security Note
VITE_DEMO_PRIVATE_KEY is for demo only and must never hold real funds.

## Run
1. npm install
2. npm run dev:full
3. Open the local URL and choose Seller or Buyer role

## Useful Scripts
- npm run server: Start SQLite API only.
- npm run dev: Start Vite frontend only.
- npm run dev:full: Start backend + frontend together.
- npm run db:reset: Clear SQLite demo data quickly.

## Netlify Viability (Demo Stage)
- Netlify static hosting does not reliably host the local SQLite Node server in this repo.
- For hackathon/demo deployment on Netlify, use browser storage mode.

### Netlify Demo Setup
1. Set build command to `npm run build` and publish directory to `dist`.
2. Add env var `VITE_DEMO_STORAGE_MODE=local` in Netlify project settings.
3. Optional: leave `VITE_API_BASE_URL` empty or keep default; local mode ignores it.
4. Deploy using the included `netlify.toml` SPA redirect config.

### What To Expect On Netlify
- App remains fully interactive for seller create/list and buyer buy demo flow.
- Data persists per browser using localStorage (not shared across users/devices).
- This is intended for presentation-stage demo deployment only.

## Real Tx Hash Checklist
1. Ensure .env has valid VITE_BASE_SEPOLIA_RPC_URL, VITE_CONTRACT_ADDRESS, and VITE_DEMO_PRIVATE_KEY.
2. Sign in as Seller, create and list an item.
3. Sign in as Buyer and buy the item.
4. Open the tx hash in BaseScan to confirm transaction exists.

## SQLite Mockup Checklist
1. Run npm run dev:full.
2. Sign in as Seller and create product with picture.
3. Refresh page and confirm product + picture still appear.
4. List the item and buy it as Buyer.
5. Verify transaction appears in history even without Sepolia keys.

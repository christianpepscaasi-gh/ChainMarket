PROJECT: ChainMarket — Minimal Marketplace on Base Testnet

DESCRIPTION:
Build a minimal marketplace where creators can mint limited-edition items and buyers can purchase them.
- Each item has a unique edition (#1, #2, … #N)
- Ownership is recorded on Base (Coinbase) testnet
- Off-chain UI and state used for listings and performance
- MVP only: no real payments required, no authentication required

FEATURES TO IMPLEMENT:

1. Wallet Connection
- Connect to Base testnet wallet (e.g., MetaMask / Coinbase Wallet SDK)
- Allow frontend to fetch connected account

2. Item Minting (Creator Side)
- Input: Item Name, Total Supply (e.g., 50), Description
- Generate items #1 → #N
- Mint transaction recorded on Base testnet
- Each mint returns a transaction ID

3. Marketplace Listings
- Show items for sale
- Display: Item Name, Edition (#x/N), Price, Current Owner
- Pull ownership status from Base testnet

4. Buy / Sell System
- Sell Flow: owner sets price, item listed
- Buy Flow: buyer confirms purchase → sends transaction on Base testnet
- Ownership updated from blockchain transaction
- History preserved (latest transaction = current owner)

5. Inventory / User Dashboard
- Show owned items
- Sell button for items
- Ownership status updated from blockchain

6. Off-chain Storage
- Optional local JSON or frontend state for UI listings
- Use off-chain state only for performance, all ownership proven on-chain

7. Constraints
- No real payments (testnet tokens only)
- No authentication required
- Simple frontend MVP (React.js preferred)
- Focus on speed and simplicity for demo

8. Deliverables
- React frontend scaffolded with components:
  - WalletConnect.js
  - MintItemForm.js
  - MarketplaceList.js
  - InventoryDashboard.js
- Base testnet integration with mint & transfer transactions
- Demo-ready: show minting, listing, buying, ownership update

SUCCESS CRITERIA:
- Items minted with editions on Base testnet
- Listings visible in UI
- Buy/sell works → ownership updates on testnet
- Transaction history visible (txId, timestamp, owner)
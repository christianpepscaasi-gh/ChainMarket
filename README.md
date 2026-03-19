# ChainMarket

ChainMarket is a minimal web-based marketplace demonstrating verifiable ownership and scarcity of limited-edition items. High-value items are minted on a simulated blockchain, ensuring provenance, while off-chain systems manage speed, UI, and scalability.

## Features (MVP)
- **Create Product / Mint Items**: Each product has unique edition numbers (#1, #2… #50)
- **Inventory**: View your owned items
- **Marketplace**: List items for sale and buy from other users
- **Ownership & Blockchain History**: Each transfer generates a new block, preserving a permanent record of ownership

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Storage: JSON / localStorage
- Blockchain: Simulated array of blocks

## Demo Flow
1. Creator mints product → appears in inventory
2. Owner lists item → marketplace
3. Buyer purchases item → ownership transferred
4. Blockchain history shows item provenance

## Future Scope
- Integration with Base blockchain
- Real-world and digital item trading
- Smart contracts & NFT interoperability
- Gamified NFT card game expansion (ChainLoot)

## How to Run
1. Clone this repo
2. Open `index.html` in a browser
3. Use provided JS functions to create products, sell/buy items, and view blockchain history

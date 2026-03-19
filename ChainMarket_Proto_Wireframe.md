🧩 ChainMarket – UI Wireframe (MVP)

🏠 1. MAIN DASHBOARD (Marketplace)


Layout:
--------------------------------------------------
| ChainMarket            | [My Items] [Create]    |
--------------------------------------------------

| 🔍 Search (optional)                          |

--------------------------------------------------
| [Item Card]  [Item Card]  [Item Card]          |
| [Item Card]  [Item Card]  [Item Card]          |
--------------------------------------------------


🃏 Item Card (IMPORTANT)
-------------------------
| 👜 Leather Bag        |
| Edition: #12 / 50     |
| Owner: UserA          |
| Price: ₱500           |
|                       |
| [ Buy ]               |
-------------------------


🎯 Key Notes:
Keep it grid-based
Don’t overdesign
Make BUY button obvious

🎒 2. MY INVENTORY PAGE





Layout:
--------------------------------------------------
| My Inventory                                  |
--------------------------------------------------

| [Item Card]  [Item Card]  [Item Card]          |
--------------------------------------------------


🃏 Inventory Card
-------------------------
| 👜 Leather Bag        |
| Edition: #12 / 50     |
| Status: Owned         |
|                       |
| [ Sell ]              |
-------------------------


🎯 Action:
Click Sell → opens modal

💸 3. SELL MODAL
-------------------------
| Sell Item              |
-------------------------
| Item: Bag #12          |
| Price: [ ₱____ ]       |
|                       |
| [ Confirm ]            |
-------------------------


🎯 Behavior:
After confirm → appears in marketplace
No backend needed (just update array)

🧑‍🎨 4. CREATE PRODUCT (Minting)



Layout:
-------------------------------
| Create New Product          |
-------------------------------
| Name:        [_______]      |
| Supply:      [_______]      |
| Description: [_______]      |
|                              |
| [ Create & Mint ]            |
-------------------------------


🎯 Behavior:
Generates:
Item #1 → #N
Adds to inventory
Creates blockchain entries

🔗 5. ITEM DETAIL (OPTIONAL BUT STRONG)
-------------------------------
| Leather Bag #12              |
-------------------------------
| Owner: UserB                |
| Creator: UserA              |
| Timestamp: xxxx             |
|                              |
| Blockchain History:          |
| - Block 1 → Creator         |
| - Block 2 → Buyer           |
-------------------------------


🎯 This is your “WOW” feature
👉 Shows:
Ownership history
Transparency
Blockchain concept

🧭 NAVIGATION (VERY SIMPLE)
Top bar:
[ Marketplace ] [ My Items ] [ Create ]


🎨 DESIGN RULES (IMPORTANT)
Use:
White / dark background
Simple cards
Rounded corners
Rarity colors (optional):
Common = gray
Rare = blue
Epic = purple
Legendary = gold

⚡ BUILD ORDER (DO THIS EXACTLY)
Marketplace page (static first)
Inventory page
Create product logic
Sell → list item
Buy → transfer ownership
(Optional) Blockchain viewer
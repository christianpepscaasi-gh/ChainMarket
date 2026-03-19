
# 📄 PRODUCT REQUIREMENTS DOCUMENT (PRD)

💸 **Project Name:** ChainMarket

> “A marketplace for verifiable, limited-edition assets with on-chain identity on Base testnet and off-chain UI scalability.”

---

## 🎯 1. Objective (MVP-Focused)

Build a minimal marketplace where:

* Items have unique edition IDs (#1, #69, etc.)
* Ownership is tracked on **Base testnet**
* Users can list, buy, and transfer ownership
* UI fetches current listings and ownership status from the blockchain

---

## 🧠 2. Core Philosophy

> “Scarcity is on-chain. Speed is off-chain.”

* **Blockchain (Base testnet):** proof of origin & ownership
* **Off-chain DB / local state:** listings, prices, UI responsiveness

---

## 👥 3. Target Users

* Local artisans 🧵
* Small businesses 🏪
* Digital creators 🎨
* Collectors 🧠

---

## 💡 4. Core Use Case

Example:
**“Leather Bag Summer Drop (50 units)”**

Each item:

* Bag #1/50
* Bag #2/50
* … up to Bag #50/50

Each item has:

* Unique ID
* Creator
* Ownership history on Base testnet

---

## ⚙️ 5. MVP Features (STRICT)

### 🧾 5.1 Item Minting (Creator Side)

**Description:** Creator defines a limited product and mints items on Base testnet.
**Input:**

* Item Name
* Total Supply (e.g. 50)
* Description

**Output:**

* Generates items Bag #1 → #50
* Each item = NFT-like entity on Base testnet
* Blockchain transaction ID returned

---

### 🔗 5.2 Blockchain Record (Base Testnet)

**Block Structure (simplified for reference):**

```json
{
  "txId": "0xabc123",
  "itemId": "bag-12",
  "itemName": "Leather Bag",
  "edition": 12,
  "creator": "CreatorA",
  "owner": "CreatorA",
  "timestamp": 1710000000
}
```

**Rules:**

* Minting → creates first transaction
* Transfer → new transaction with updated owner
* Ownership = latest transaction on blockchain

---

### 🛒 5.3 Marketplace Listings

**Features:**

* Display items for sale
* Show: Name, Edition (#12/50), Price, Current Owner

**Data source:**

* Query Base testnet for ownership
* Off-chain UI cache for performance

---

### 💸 5.4 Buy / Sell System

**Sell Flow:**

* Owner selects item
* Sets price
* Item appears in marketplace

**Buy Flow:**

* Buyer clicks item
* Confirms purchase
* Ownership transfers → creates transaction on Base testnet

**Transfer Logic:**

* Mint + transfer = blockchain transaction
* UI updates by querying testnet

---

### 🎒 5.5 Inventory System

**Features:**

* View owned items
* Sell button
* Ownership status updated from blockchain

---

## 🔄 6. User Flow

**Creator Flow:**

1. Create Product
2. Define supply
3. Mint items → Base testnet
4. Items appear in inventory

**Buyer Flow:**

1. Browse marketplace
2. Select item
3. Buy item → transaction on Base testnet
4. Ownership updated

**Transfer Flow:**

* New blockchain transaction created
* Ownership changes
* History preserved

---

## 🧠 7. Data Architecture

**Blockchain (Immutable Layer):**

* Stores: Creator, Timestamp, Ownership changes, Transaction ID

**Off-chain (Mutable Layer):**

* Stores: Listings, Prices, UI state

---

## ⚠️ 8. Constraints (MVP Discipline)

❌ Real payments optional (can use testnet tokens)
❌ Authentication optional (mock user if needed)
❌ Backend optional (use local JSON / frontend state for listings)

---

## 🏗 9. Scalability Plan

**Phase 2:**

* Full Base integration with smart contracts for mint + transfer

**Phase 3:**

* Real payments (crypto/fiat)
* User authentication

**Phase 4:**

* Mobile app / API for merchants

---

## 🏆 10. Success Criteria

✅ Items minted on Base testnet with editions
✅ Listings visible in UI
✅ Buy/sell works → ownership updates on testnet
✅ Ownership history queryable
✅ Testnet transactions visible (txId, timestamp, owner)

---

✅ **Key Change:**

* Blockchain layer = **Base (Coinbase) testnet**, not simulation
* UI / off-chain storage = speed + performance

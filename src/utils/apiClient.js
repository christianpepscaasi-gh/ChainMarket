import { ethToPhpNumber, getPhpPerEth } from "./currency";
import { loadAppState, saveAppState, upsertSellerPictureArchive } from "./localStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const CONFIGURED_MODE = String(import.meta.env.VITE_DEMO_STORAGE_MODE || "api").toLowerCase();
let activeMode = CONFIGURED_MODE === "local" ? "local" : "api";

function nowIso() {
  return new Date().toISOString();
}

function createItemId(name, edition, stamp) {
  const slug = String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "item"}-${stamp}-${edition}`;
}

function readLocalState() {
  const state = loadAppState();
  return {
    items: state.items || [],
    listings: state.listings || [],
    history: state.history || [],
    sellerPictures: state.sellerPictures || [],
    session: state.session || null,
  };
}

function writeLocalState(state) {
  saveAppState({
    items: state.items,
    listings: state.listings,
    history: state.history,
    session: state.session,
    sellerPictures: state.sellerPictures,
  });
}

function switchToLocalFallback(error) {
  if (activeMode !== "local") {
    activeMode = "local";
    console.warn("ChainMarket switched to local demo storage mode:", error?.message || error);
  }
}

function loadLocalState() {
  const state = readLocalState();
  return {
    items: state.items,
    listings: state.listings,
    history: state.history,
    sellerPictures: state.sellerPictures,
  };
}

function mintLocalItems(payload) {
  const state = readLocalState();
  const safeSupply = Math.min(Math.max(Number(payload.supply) || 1, 1), 100);
  const stamp = Date.now();

  const mintedItems = Array.from({ length: safeSupply }, (_, index) => {
    const edition = index + 1;
    return {
      itemId: createItemId(payload.name, edition, stamp),
      chainItemId: stamp + edition,
      name: payload.name,
      edition,
      totalSupply: safeSupply,
      description: payload.description,
      creatorName: payload.sellerName,
      creatorId: payload.sellerId,
      ownerName: payload.sellerName,
      ownerId: payload.sellerId,
      image: payload.image || null,
      status: "owned",
      createdAt: nowIso(),
    };
  });

  const mintHistory = mintedItems.map((item) => ({
    itemId: item.itemId,
    action: "MINT",
    from: "SYSTEM",
    fromId: "SYSTEM",
    to: payload.sellerName,
    toId: payload.sellerId,
    priceEth: "0",
    pricePhp: 0,
    txHash: "LOCAL_MINT",
    txMode: "local",
    timestamp: nowIso(),
  }));

  const sellerPictures = upsertSellerPictureArchive(state.sellerPictures, payload.image, {
    sellerId: payload.sellerId,
    sellerName: payload.sellerName,
    productName: payload.name,
  });

  const nextState = {
    ...state,
    items: [...mintedItems, ...state.items],
    history: [...mintHistory, ...state.history],
    sellerPictures,
  };
  writeLocalState(nextState);

  return {
    mintedItems,
    mintHistory,
    pictureCount: sellerPictures.length,
  };
}

function createLocalListing(payload) {
  const state = readLocalState();
  const item = state.items.find((entry) => entry.itemId === payload.itemId);

  if (!item) {
    throw new Error("Item not found.");
  }

  if (item.ownerId !== payload.sellerId) {
    throw new Error("Only item owner can create listing.");
  }

  const txHash = `LOCAL_LIST_${Date.now()}`;
  const listing = {
    itemId: item.itemId,
    chainItemId: item.chainItemId,
    name: item.name,
    edition: item.edition,
    totalSupply: item.totalSupply,
    ownerId: payload.sellerId,
    sellerId: payload.sellerId,
    sellerName: payload.sellerName,
    priceEth: String(payload.priceEth),
    pricePhp: Number(payload.pricePhp),
    image: item.image || null,
    txHash,
    status: "listed",
    listedAt: nowIso(),
  };

  const nextState = {
    ...state,
    listings: [listing, ...state.listings.filter((entry) => entry.itemId !== item.itemId)],
    items: state.items.map((entry) =>
      entry.itemId === item.itemId ? { ...entry, status: "listed" } : entry
    ),
    history: [
      {
        itemId: item.itemId,
        action: "LIST",
        from: payload.sellerName,
        fromId: payload.sellerId,
        to: "MARKETPLACE",
        toId: "MARKETPLACE",
        priceEth: String(payload.priceEth),
        pricePhp: Number(payload.pricePhp),
        sellerId: payload.sellerId,
        txHash,
        txMode: "local",
        timestamp: nowIso(),
      },
      ...state.history,
    ],
  };

  writeLocalState(nextState);
  return { listing };
}

function purchaseLocalListing(payload) {
  const state = readLocalState();
  const listing = state.listings.find((entry) => entry.itemId === payload.itemId);

  if (!listing) {
    throw new Error("Listing not found.");
  }

  if (listing.sellerId === payload.buyerId) {
    throw new Error("Seller cannot buy the same listing.");
  }

  const pricePhp =
    listing.pricePhp ?? ethToPhpNumber(String(listing.priceEth), getPhpPerEth());

  const nextState = {
    ...state,
    listings: state.listings.filter((entry) => entry.itemId !== payload.itemId),
    items: state.items.map((item) =>
      item.itemId === payload.itemId
        ? {
            ...item,
            ownerId: payload.buyerId,
            ownerName: payload.buyerName,
            status: "owned",
          }
        : item
    ),
    history: [
      {
        itemId: listing.itemId,
        action: "BUY",
        from: listing.sellerName || listing.sellerId || "Seller",
        fromId: listing.sellerId || "seller",
        to: payload.buyerName,
        toId: payload.buyerId,
        priceEth: String(listing.priceEth),
        pricePhp,
        sellerId: listing.sellerId,
        txHash: payload.txHash,
        txMode: payload.txMode,
        timestamp: nowIso(),
      },
      ...state.history,
    ],
  };

  writeLocalState(nextState);
  return { item: nextState.items.find((item) => item.itemId === payload.itemId) };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = "Request failed.";
    try {
      const body = await response.json();
      if (body?.message) {
        message = body.message;
      }
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function loadState() {
  if (activeMode === "local") {
    return Promise.resolve(loadLocalState());
  }

  return request("/api/state").catch((error) => {
    switchToLocalFallback(error);
    return loadLocalState();
  });
}

export function mintItems(payload) {
  if (activeMode === "local") {
    return Promise.resolve(mintLocalItems(payload));
  }

  return request("/api/items/mint", {
    method: "POST",
    body: JSON.stringify(payload),
  }).catch((error) => {
    switchToLocalFallback(error);
    return mintLocalItems(payload);
  });
}

export function createListing(payload) {
  if (activeMode === "local") {
    return Promise.resolve(createLocalListing(payload));
  }

  return request("/api/listings", {
    method: "POST",
    body: JSON.stringify(payload),
  }).catch((error) => {
    switchToLocalFallback(error);
    return createLocalListing(payload);
  });
}

export function purchaseListing(payload) {
  if (activeMode === "local") {
    return Promise.resolve(purchaseLocalListing(payload));
  }

  return request("/api/purchases", {
    method: "POST",
    body: JSON.stringify(payload),
  }).catch((error) => {
    switchToLocalFallback(error);
    return purchaseLocalListing(payload);
  });
}

export function resetData() {
  if (activeMode === "local") {
    writeLocalState({
      items: [],
      listings: [],
      history: [],
      sellerPictures: [],
      session: null,
    });
    return Promise.resolve(null);
  }

  return request("/api/reset", { method: "POST" }).catch((error) => {
    switchToLocalFallback(error);
    writeLocalState({
      items: [],
      listings: [],
      history: [],
      sellerPictures: [],
      session: null,
    });
    return null;
  });
}

export function getStorageMode() {
  return activeMode;
}

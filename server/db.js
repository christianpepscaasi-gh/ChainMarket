import path from "node:path";
import { fileURLToPath } from "node:url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultDbPath = path.join(__dirname, "chainmarket-demo.sqlite");

function createItemId(name, edition, stamp) {
  const slug = String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "item"}-${stamp}-${edition}`;
}

function nowIso() {
  return new Date().toISOString();
}

function toItem(row) {
  return {
    itemId: row.item_id,
    chainItemId: row.chain_item_id,
    name: row.name,
    edition: row.edition,
    totalSupply: row.total_supply,
    description: row.description,
    creatorName: row.creator_name,
    creatorId: row.creator_id,
    ownerName: row.owner_name,
    ownerId: row.owner_id,
    image: row.data_url
      ? {
          dataUrl: row.data_url,
          filename: row.filename,
          mimeType: row.mime_type,
          sizeBytes: row.size_bytes,
          uploadedAt: row.uploaded_at,
        }
      : null,
    status: row.status,
    createdAt: row.created_at,
  };
}

function toListing(row) {
  return {
    itemId: row.item_id,
    chainItemId: row.chain_item_id,
    name: row.name,
    edition: row.edition,
    totalSupply: row.total_supply,
    ownerId: row.owner_id,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    priceEth: row.price_eth,
    pricePhp: row.price_php,
    image: row.data_url
      ? {
          dataUrl: row.data_url,
          filename: row.filename,
          mimeType: row.mime_type,
          sizeBytes: row.size_bytes,
          uploadedAt: row.uploaded_at,
        }
      : null,
    txHash: row.tx_hash,
    status: row.listing_status,
    listedAt: row.listed_at,
  };
}

function toHistory(row) {
  return {
    itemId: row.item_id,
    action: row.action,
    from: row.from_name,
    fromId: row.from_id,
    to: row.to_name,
    toId: row.to_id,
    priceEth: row.price_eth,
    pricePhp: row.price_php,
    sellerId: row.seller_id,
    txHash: row.tx_hash,
    txMode: row.tx_mode,
    timestamp: row.timestamp,
  };
}

function toPicture(row) {
  return {
    pictureId: row.picture_id,
    dataUrl: row.data_url,
    filename: row.filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    uploadedAt: row.uploaded_at,
    updatedAt: row.updated_at,
    usageCount: row.usage_count,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    lastUsedProduct: row.last_used_product,
    lastUsedBy: row.last_used_by,
  };
}

async function insertHistory(db, entry) {
  await db.run(
    `INSERT INTO history_entries (
      item_id,
      action,
      from_name,
      from_id,
      to_name,
      to_id,
      price_eth,
      price_php,
      seller_id,
      tx_hash,
      tx_mode,
      timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.itemId,
      entry.action,
      entry.from,
      entry.fromId,
      entry.to,
      entry.toId,
      String(entry.priceEth ?? "0"),
      Number(entry.pricePhp ?? 0),
      entry.sellerId ?? null,
      entry.txHash,
      entry.txMode ?? "local",
      entry.timestamp ?? nowIso(),
    ]
  );
}

async function upsertPicture(db, image, context) {
  if (!image?.dataUrl) {
    return null;
  }

  const existing = await db.get(
    "SELECT * FROM pictures WHERE data_url = ? LIMIT 1",
    [image.dataUrl]
  );

  if (existing) {
    await db.run(
      `UPDATE pictures
       SET usage_count = usage_count + 1,
           updated_at = ?,
           last_used_product = ?,
           last_used_by = ?
       WHERE picture_id = ?`,
      [
        nowIso(),
        context.productName || existing.last_used_product || "",
        context.sellerId || existing.last_used_by || "",
        existing.picture_id,
      ]
    );
    return existing.picture_id;
  }

  const pictureId = `pic-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  await db.run(
    `INSERT INTO pictures (
      picture_id,
      data_url,
      filename,
      mime_type,
      size_bytes,
      uploaded_at,
      updated_at,
      usage_count,
      seller_id,
      seller_name,
      last_used_product,
      last_used_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      pictureId,
      image.dataUrl,
      image.filename || "uploaded-image",
      image.mimeType || "image/jpeg",
      Number(image.sizeBytes || 0),
      image.uploadedAt || nowIso(),
      nowIso(),
      1,
      context.sellerId || "",
      context.sellerName || "",
      context.productName || "",
      context.sellerId || "",
    ]
  );

  return pictureId;
}

export async function createDatabase(dbPath = process.env.DB_PATH || defaultDbPath) {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec("PRAGMA foreign_keys = ON;");

  await db.exec(`
    CREATE TABLE IF NOT EXISTS pictures (
      picture_id TEXT PRIMARY KEY,
      data_url TEXT NOT NULL UNIQUE,
      filename TEXT,
      mime_type TEXT,
      size_bytes INTEGER DEFAULT 0,
      uploaded_at TEXT NOT NULL,
      updated_at TEXT,
      usage_count INTEGER NOT NULL DEFAULT 1,
      seller_id TEXT,
      seller_name TEXT,
      last_used_product TEXT,
      last_used_by TEXT
    );

    CREATE TABLE IF NOT EXISTS items (
      item_id TEXT PRIMARY KEY,
      chain_item_id INTEGER,
      name TEXT NOT NULL,
      edition INTEGER NOT NULL,
      total_supply INTEGER NOT NULL,
      description TEXT,
      creator_name TEXT,
      creator_id TEXT,
      owner_name TEXT,
      owner_id TEXT,
      picture_id TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (picture_id) REFERENCES pictures(picture_id)
    );

    CREATE TABLE IF NOT EXISTS listings (
      item_id TEXT PRIMARY KEY,
      seller_id TEXT NOT NULL,
      seller_name TEXT,
      price_eth TEXT NOT NULL,
      price_php REAL NOT NULL,
      tx_hash TEXT,
      listing_status TEXT NOT NULL,
      listed_at TEXT NOT NULL,
      FOREIGN KEY (item_id) REFERENCES items(item_id)
    );

    CREATE TABLE IF NOT EXISTS history_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id TEXT,
      action TEXT NOT NULL,
      from_name TEXT,
      from_id TEXT,
      to_name TEXT,
      to_id TEXT,
      price_eth TEXT NOT NULL,
      price_php REAL NOT NULL,
      seller_id TEXT,
      tx_hash TEXT,
      tx_mode TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_items_owner_id ON items(owner_id);
    CREATE INDEX IF NOT EXISTS idx_items_creator_id ON items(creator_id);
    CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);
    CREATE INDEX IF NOT EXISTS idx_listings_listed_at ON listings(listed_at DESC);
    CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history_entries(timestamp DESC);
  `);

  return {
    db,
    async getState() {
      const itemsRows = await db.all(
        `SELECT i.*, p.data_url, p.filename, p.mime_type, p.size_bytes, p.uploaded_at
         FROM items i
         LEFT JOIN pictures p ON p.picture_id = i.picture_id
         ORDER BY i.created_at DESC`
      );

      const listingsRows = await db.all(
        `SELECT i.item_id, i.chain_item_id, i.name, i.edition, i.total_supply, i.owner_id,
                l.seller_id, l.seller_name, l.price_eth, l.price_php, l.tx_hash, l.listing_status, l.listed_at,
                p.data_url, p.filename, p.mime_type, p.size_bytes, p.uploaded_at
         FROM listings l
         INNER JOIN items i ON i.item_id = l.item_id
         LEFT JOIN pictures p ON p.picture_id = i.picture_id
         ORDER BY l.listed_at DESC`
      );

      const historyRows = await db.all(
        `SELECT * FROM history_entries ORDER BY timestamp DESC LIMIT 300`
      );

      const pictureRows = await db.all(
        `SELECT * FROM pictures ORDER BY uploaded_at DESC`
      );

      return {
        items: itemsRows.map(toItem),
        listings: listingsRows.map(toListing),
        history: historyRows.map(toHistory),
        sellerPictures: pictureRows.map(toPicture),
      };
    },

    async mintItems({ name, supply, description, image, sellerId, sellerName }) {
      const safeSupply = Math.min(Math.max(Number(supply) || 1, 1), 100);
      const stamp = Date.now();
      const pictureId = await upsertPicture(db, image, {
        sellerId,
        sellerName,
        productName: name,
      });

      const mintedItems = [];
      const mintHistory = [];

      await db.exec("BEGIN TRANSACTION");
      try {
        for (let index = 0; index < safeSupply; index += 1) {
          const edition = index + 1;
          const itemId = createItemId(name, edition, stamp);
          const chainItemId = stamp + edition;
          const createdAt = nowIso();

          await db.run(
            `INSERT INTO items (
              item_id,
              chain_item_id,
              name,
              edition,
              total_supply,
              description,
              creator_name,
              creator_id,
              owner_name,
              owner_id,
              picture_id,
              status,
              created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              itemId,
              chainItemId,
              name,
              edition,
              safeSupply,
              description || "",
              sellerName,
              sellerId,
              sellerName,
              sellerId,
              pictureId,
              "owned",
              createdAt,
            ]
          );

          const row = await db.get(
            `SELECT i.*, p.data_url, p.filename, p.mime_type, p.size_bytes, p.uploaded_at
             FROM items i
             LEFT JOIN pictures p ON p.picture_id = i.picture_id
             WHERE i.item_id = ?`,
            [itemId]
          );
          mintedItems.push(toItem(row));

          const historyEntry = {
            itemId,
            action: "MINT",
            from: "SYSTEM",
            fromId: "SYSTEM",
            to: sellerName,
            toId: sellerId,
            priceEth: "0",
            pricePhp: 0,
            txHash: "LOCAL_MINT",
            txMode: "local",
            timestamp: nowIso(),
          };
          await insertHistory(db, historyEntry);
          mintHistory.push(historyEntry);
        }

        await db.exec("COMMIT");
      } catch (error) {
        await db.exec("ROLLBACK");
        throw error;
      }

      const pictureCountRow = await db.get(
        "SELECT COUNT(*) AS count FROM pictures"
      );

      return {
        mintedItems,
        mintHistory,
        pictureCount: pictureCountRow?.count || 0,
      };
    },

    async createListing({ itemId, sellerId, sellerName, priceEth, pricePhp }) {
      const item = await db.get("SELECT * FROM items WHERE item_id = ? LIMIT 1", [itemId]);
      if (!item) {
        throw new Error("Item not found.");
      }

      if (item.owner_id !== sellerId) {
        throw new Error("Only item owner can create listing.");
      }

      const listedAt = nowIso();
      const txHash = `LOCAL_LIST_${Date.now()}`;

      await db.exec("BEGIN TRANSACTION");
      try {
        await db.run(
          `INSERT INTO listings (
            item_id,
            seller_id,
            seller_name,
            price_eth,
            price_php,
            tx_hash,
            listing_status,
            listed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(item_id) DO UPDATE SET
            seller_id = excluded.seller_id,
            seller_name = excluded.seller_name,
            price_eth = excluded.price_eth,
            price_php = excluded.price_php,
            tx_hash = excluded.tx_hash,
            listing_status = excluded.listing_status,
            listed_at = excluded.listed_at`,
          [
            itemId,
            sellerId,
            sellerName,
            String(priceEth),
            Number(pricePhp),
            txHash,
            "listed",
            listedAt,
          ]
        );

        await db.run(
          `UPDATE items
           SET status = ?, owner_name = ?, owner_id = ?
           WHERE item_id = ?`,
          ["listed", sellerName, sellerId, itemId]
        );

        await insertHistory(db, {
          itemId,
          action: "LIST",
          from: sellerName,
          fromId: sellerId,
          to: "MARKETPLACE",
          toId: "MARKETPLACE",
          priceEth: String(priceEth),
          pricePhp: Number(pricePhp),
          sellerId,
          txHash,
          txMode: "local",
          timestamp: nowIso(),
        });

        await db.exec("COMMIT");
      } catch (error) {
        await db.exec("ROLLBACK");
        throw error;
      }

      const row = await db.get(
        `SELECT i.item_id, i.chain_item_id, i.name, i.edition, i.total_supply, i.owner_id,
                l.seller_id, l.seller_name, l.price_eth, l.price_php, l.tx_hash, l.listing_status, l.listed_at,
                p.data_url, p.filename, p.mime_type, p.size_bytes, p.uploaded_at
         FROM listings l
         INNER JOIN items i ON i.item_id = l.item_id
         LEFT JOIN pictures p ON p.picture_id = i.picture_id
         WHERE l.item_id = ?`,
        [itemId]
      );

      return toListing(row);
    },

    async purchaseListing({ itemId, buyerId, buyerName, txHash, txMode }) {
      const listing = await db.get(
        `SELECT l.*, i.name, i.edition, i.total_supply, i.chain_item_id, i.picture_id
         FROM listings l
         INNER JOIN items i ON i.item_id = l.item_id
         WHERE l.item_id = ? LIMIT 1`,
        [itemId]
      );

      if (!listing) {
        throw new Error("Listing not found.");
      }

      if (listing.seller_id === buyerId) {
        throw new Error("Seller cannot buy the same listing.");
      }

      await db.exec("BEGIN TRANSACTION");
      try {
        await db.run(
          `UPDATE items
           SET owner_id = ?, owner_name = ?, status = ?
           WHERE item_id = ?`,
          [buyerId, buyerName, "owned", itemId]
        );

        await db.run("DELETE FROM listings WHERE item_id = ?", [itemId]);

        await insertHistory(db, {
          itemId,
          action: "BUY",
          from: listing.seller_name || listing.seller_id || "Seller",
          fromId: listing.seller_id || "seller",
          to: buyerName,
          toId: buyerId,
          priceEth: String(listing.price_eth),
          pricePhp: Number(listing.price_php),
          sellerId: listing.seller_id,
          txHash,
          txMode,
          timestamp: nowIso(),
        });

        await db.exec("COMMIT");
      } catch (error) {
        await db.exec("ROLLBACK");
        throw error;
      }

      const updatedItem = await db.get(
        `SELECT i.*, p.data_url, p.filename, p.mime_type, p.size_bytes, p.uploaded_at
         FROM items i
         LEFT JOIN pictures p ON p.picture_id = i.picture_id
         WHERE i.item_id = ?`,
        [itemId]
      );

      return toItem(updatedItem);
    },

    async resetDemoData() {
      await db.exec("BEGIN TRANSACTION");
      try {
        await db.run("DELETE FROM listings");
        await db.run("DELETE FROM history_entries");
        await db.run("DELETE FROM items");
        await db.run("DELETE FROM pictures");
        await db.exec("COMMIT");
      } catch (error) {
        await db.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

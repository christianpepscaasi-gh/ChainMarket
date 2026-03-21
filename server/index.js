import express from "express";
import cors from "cors";
import { createDatabase } from "./db.js";

const app = express();
const PORT = Number(process.env.PORT || 3001);
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: ALLOWED_ORIGIN,
  })
);
app.use(express.json({ limit: "6mb" }));

const database = await createDatabase();

app.get("/api/health", (_, res) => {
  res.json({ ok: true, service: "chainmarket-sqlite-api" });
});

app.get("/api/state", async (_, res) => {
  try {
    const state = await database.getState();
    res.json(state);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to load state." });
  }
});

app.post("/api/items/mint", async (req, res) => {
  try {
    const { name, supply, description, image, sellerId, sellerName } = req.body || {};

    if (!name || !sellerId || !sellerName) {
      res.status(400).json({ message: "Missing required item or seller fields." });
      return;
    }

    const result = await database.mintItems({
      name,
      supply,
      description,
      image,
      sellerId,
      sellerName,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to create item." });
  }
});

app.post("/api/listings", async (req, res) => {
  try {
    const { itemId, sellerId, sellerName, priceEth, pricePhp } = req.body || {};

    if (!itemId || !sellerId || !sellerName) {
      res.status(400).json({ message: "Missing listing fields." });
      return;
    }

    const listing = await database.createListing({
      itemId,
      sellerId,
      sellerName,
      priceEth,
      pricePhp,
    });

    res.status(201).json({ listing });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to list item." });
  }
});

app.post("/api/purchases", async (req, res) => {
  try {
    const { itemId, buyerId, buyerName, txHash, txMode } = req.body || {};

    if (!itemId || !buyerId || !buyerName || !txHash || !txMode) {
      res.status(400).json({ message: "Missing purchase fields." });
      return;
    }

    const item = await database.purchaseListing({
      itemId,
      buyerId,
      buyerName,
      txHash,
      txMode,
    });

    res.status(201).json({ item });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to buy item." });
  }
});

app.post("/api/reset", async (_, res) => {
  try {
    await database.resetDemoData();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to reset data." });
  }
});

app.listen(PORT, () => {
  console.log(`ChainMarket SQLite API running on http://localhost:${PORT}`);
});

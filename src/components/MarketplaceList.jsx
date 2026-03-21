import { shortAddress } from "../utils/blockchainService";
import { ethToPhpNumber, formatPhpCurrency } from "../utils/currency";

const MOCK_LISTINGS = [
  { itemId: "mock-1", name: "Vintage Leather Bag", edition: 1, totalSupply: 5, priceEth: "0.05", sellerAddress: "0xDEMO000000000000001", txHash: "0xMOCK" },
  { itemId: "mock-2", name: "Digital Art Print #7", edition: 7, totalSupply: 10, priceEth: "0.12", sellerAddress: "0xDEMO000000000000002", txHash: "0xMOCK" },
  { itemId: "mock-3", name: "Limited Sneakers", edition: 3, totalSupply: 20, priceEth: "0.08", sellerAddress: "0xDEMO000000000000003", txHash: "0xMOCK" },
  { itemId: "mock-4", name: "Collector Card - Gold", edition: 1, totalSupply: 1, priceEth: "0.25", sellerAddress: "0xDEMO000000000000004", txHash: "0xMOCK" },
  { itemId: "mock-5", name: "Smart Watch Alpha", edition: 2, totalSupply: 8, priceEth: "0.18", sellerAddress: "0xDEMO000000000000005", txHash: "0xMOCK" },
  { itemId: "mock-6", name: "Pixel Art NFT #42", edition: 42, totalSupply: 100, priceEth: "0.03", sellerAddress: "0xDEMO000000000000006", txHash: "0xMOCK" },
  { itemId: "mock-7", name: "Gaming Token Pack", edition: 1, totalSupply: 50, priceEth: "0.01", sellerAddress: "0xDEMO000000000000007", txHash: "0xMOCK" },
  { itemId: "mock-8", name: "Denim Jacket (S/M)", edition: 5, totalSupply: 15, priceEth: "0.07", sellerAddress: "0xDEMO000000000000008", txHash: "0xMOCK" },
];

function itemEmoji(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("bag") || n.includes("purse") || n.includes("wallet")) return "👜";
  if (n.includes("shoe") || n.includes("boot") || n.includes("sneak")) return "👟";
  if (n.includes("phone") || n.includes("mobile")) return "📱";
  if (n.includes("watch")) return "⌚";
  if (n.includes("laptop") || n.includes("computer") || n.includes("pc")) return "💻";
  if (n.includes("shirt") || n.includes("cloth") || n.includes("wear") || n.includes("jacket")) return "👕";
  if (n.includes("hat") || n.includes("cap")) return "🧢";
  if (n.includes("art") || n.includes("paint") || n.includes("nft")) return "🖼";
  if (n.includes("card") || n.includes("collect")) return "🃏";
  if (n.includes("game") || n.includes("token")) return "🎮";
  return "📦";
}

function isHexAddress(value) {
  return typeof value === "string" && value.startsWith("0x") && value.length >= 10;
}

function sellerLabelFor(listing, isMock) {
  if (isMock) return "Demo Seller";
  if (listing.sellerName) return listing.sellerName;

  if (isHexAddress(listing.sellerAddress)) {
    return shortAddress(listing.sellerAddress);
  }

  return listing.sellerId || "Seller";
}

export default function MarketplaceList({
  listings,
  currentUserId,
  onBuyItem,
  isSeller,
  canBuy,
  phpPerEth,
}) {
  const displayListings = listings.length > 0 ? listings : MOCK_LISTINGS;
  const isMock = listings.length === 0;

  return (
    <div>
      {/* ===== HERO BANNER ===== */}
      {isSeller ? (
        <div className="seller-hero">
          <div>
            <h2>Live Marketplace</h2>
            <p>All active listings — sign in as Buyer to purchase items</p>
          </div>
          <div className="seller-hero-icon">🛒</div>
        </div>
      ) : (
        <div className="marketplace-hero">
          <div className="hero-text">
            <h2>ChainMarket Store</h2>
            <p>Discover &amp; collect on-chain digital assets on Base Sepolia</p>
          </div>
          <div className="hero-icon">🛍</div>
        </div>
      )}

      {/* ===== FILTER ROW ===== */}
      <div className="filter-row">
        <p className="results-count">
          {isMock
            ? `${displayListings.length} demo items — list a real product to replace these`
            : `${displayListings.length} item${displayListings.length !== 1 ? "s" : ""} available`}
        </p>
        {isMock && (
          <span style={{
            fontSize: "0.76rem", fontWeight: 700,
            background: "var(--blue-light)", color: "var(--blue)",
            padding: "3px 10px", borderRadius: 999,
          }}>
            📋 Mockup Preview
          </span>
        )}
      </div>

      {/* ===== PRODUCT GRID ===== */}
      <div className="product-grid">
        {displayListings.map((listing) => {
            const listingSellerId = listing.sellerId || listing.sellerAddress;
            const isOwn = !isMock && Boolean(currentUserId) && listingSellerId === currentUserId;
            const pricePhp = listing.pricePhp ?? ethToPhpNumber(listing.priceEth, phpPerEth);

            return (
              <article className="product-card" key={listing.itemId}>
                <div className="product-img">
                  {listing.image?.dataUrl ? (
                    <img className="product-img-media" src={listing.image.dataUrl} alt={listing.name} />
                  ) : (
                    <span className="product-img-letter">{itemEmoji(listing.name)}</span>
                  )}
                  {isOwn && <span className="product-badge listed">Your Listing</span>}
                  {isMock && <span className="product-badge listed">Demo</span>}
                </div>

                <div className="product-info">
                  <p className="product-name">{listing.name}</p>
                  <p className="product-meta">
                    Edition #{listing.edition} of {listing.totalSupply}
                  </p>
                  <p className="product-price">
                    {formatPhpCurrency(pricePhp)} <span className="unit">PHP</span>
                  </p>
                  <p className="product-meta">~ {listing.priceEth} ETH</p>
                  <p className="product-seller">
                    by {sellerLabelFor(listing, isMock)}
                  </p>
                </div>

                <div className="product-footer">
                  {isOwn ? (
                    <button className="btn ghost" disabled type="button">
                      Your Listing
                    </button>
                  ) : (
                    <button
                      className="btn primary"
                      type="button"
                      disabled={!canBuy || isMock || isOwn}
                      onClick={() => !isMock && onBuyItem(listing)}
                    >
                      {isMock ? "Demo Only" : canBuy ? "Buy Now" : "Buyer Only"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
      </div>
    </div>
  );
}

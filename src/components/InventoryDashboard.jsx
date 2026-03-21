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
  return "📦";
}

export default function InventoryDashboard({ items, onSellItem }) {
  const listedCount = items.filter((i) => i.status === "listed").length;
  const availableCount = items.filter((i) => i.status === "owned").length;

  return (
    <div>
      {/* ===== SELLER HERO ===== */}
      <div className="seller-hero">
        <div>
          <h2>Seller Hub</h2>
          <p>Manage your products and track your listings</p>
        </div>
        <div className="seller-hero-icon">🏪</div>
      </div>

      {/* ===== STATS STRIP ===== */}
      <div className="seller-stats">
        <div className="stat-card">
          <div className="stat-value">{items.length}</div>
          <div className="stat-label">Total Products</div>
        </div>
        <div className="stat-card">
          <div className="stat-value blue">{listedCount}</div>
          <div className="stat-label">Listed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{availableCount}</div>
          <div className="stat-label">In Inventory</div>
        </div>
      </div>

      {/* ===== PRODUCT LIST ===== */}
      <div className="section-header">
        <h3 className="section-title">My Products</h3>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No products yet</h3>
          <p>Go to Create Product to mint your first item.</p>
        </div>
      ) : (
        <div className="product-grid">
          {items.map((item) => (
            <article className="product-card" key={item.itemId}>
              <div className="product-img">
                {item.image?.dataUrl ? (
                  <img className="product-img-media" src={item.image.dataUrl} alt={item.name} />
                ) : (
                  <span className="product-img-letter">{itemEmoji(item.name)}</span>
                )}
                <span className={`product-badge ${item.status}`}>
                  {item.status === "listed" ? "Listed" : "Owned"}
                </span>
              </div>

              <div className="product-info">
                <p className="product-name">{item.name}</p>
                <p className="product-meta">
                  Edition #{item.edition} of {item.totalSupply}
                </p>
                <p className="product-meta" style={{ marginTop: 4 }}>
                  {item.status === "listed" ? "🟢 Active listing" : "⚪ In inventory"}
                </p>
              </div>

              <div className="product-footer">
                <button
                  type="button"
                  className={item.status === "listed" ? "btn ghost" : "btn navy"}
                  disabled={item.status === "listed"}
                  onClick={() => onSellItem(item)}
                >
                  {item.status === "listed" ? "Already Listed" : "List for Sale"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

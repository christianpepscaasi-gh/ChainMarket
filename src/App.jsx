import { useCallback, useEffect, useMemo, useState } from "react";
import LoginPage from "./components/LoginPage";
import MintItemForm from "./components/MintItemForm";
import MarketplaceList from "./components/MarketplaceList";
import InventoryDashboard from "./components/InventoryDashboard";
import SellModal from "./components/SellModal";
import TransactionHistory from "./components/TransactionHistory";
import { CHAINMARKET_ABI } from "./contracts/chainMarketAbi";
import {
  validateBuyerTransactionConfig,
  runBuyTransaction,
} from "./utils/blockchainService";
import { getPhpPerEth } from "./utils/currency";
import {
  createListing,
  getStorageMode,
  loadState,
  mintItems,
  purchaseListing,
} from "./utils/apiClient";

const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS || import.meta.env.CONTRACT_ADDRESS || "";
const PHP_PER_ETH = getPhpPerEth();

const INITIAL_SESSION = {
  isSignedIn: false,
  role: "",
  profileName: "",
  userId: "",
};

const SELLER_TABS = [
  { id: "inventory", label: "📦 My Products" },
  { id: "create",    label: "➕ Create Product" },
  { id: "marketplace", label: "🛒 Browse Market" },
  { id: "history",   label: "📋 Transactions" },
];

const BUYER_TABS = [
  { id: "marketplace", label: "🏪 Marketplace" },
  { id: "history", label: "📋 My Transactions" },
];

function roleTitle(role) {
  return role === "seller" ? "Seller" : "Buyer";
}

function createSessionForRole(role) {
  if (role === "seller") {
    return {
      isSignedIn: true,
      role: "seller",
      profileName: "Seller Demo",
      userId: "demo-seller",
    };
  }

  return {
    isSignedIn: true,
    role: "buyer",
    profileName: "Buyer Demo",
    userId: "demo-buyer",
  };
}

function modeMessage() {
  const storageMode = getStorageMode();
  const validation = validateBuyerTransactionConfig(CONTRACT_ADDRESS);

  if (storageMode === "local") {
    return "Browser local demo mode is active (Netlify-friendly). Data stays in this browser.";
  }

  if (!validation.valid) {
    return "SQLite API mode is active. Purchases are saved in demo mode without Sepolia keys.";
  }

  return "Hybrid mode is active. Seller data is stored in SQLite and buyer purchases also submit on-chain to Base Sepolia.";
}

export default function App() {
  const [activeTab, setActiveTab] = useState("marketplace");
  const [session, setSession] = useState(INITIAL_SESSION);
  const [items, setItems] = useState([]);
  const [listings, setListings] = useState([]);
  const [history, setHistory] = useState([]);
  const [sellTarget, setSellTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [status, setStatus] = useState({
    type: "info",
    message: modeMessage(),
  });

  const refreshState = useCallback(async () => {
    const remote = await loadState();
    setItems(remote.items || []);
    setListings(remote.listings || []);
    setHistory(remote.history || []);
  }, []);

  useEffect(() => {
    async function bootstrap() {
      try {
        await refreshState();
      } catch (error) {
        setStatus({
          type: "error",
          message: `Cannot connect to SQLite API. Start backend with npm run server. ${error.message}`,
        });
      } finally {
        setIsBootstrapping(false);
      }
    }

    bootstrap();
  }, [refreshState]);

  const isSeller = session.role === "seller";
  const tabs = isSeller ? SELLER_TABS : BUYER_TABS;

  const ownedItems = useMemo(() => {
    if (!session.isSignedIn || !session.userId) {
      return [];
    }

    return items.filter((item) => item.ownerId === session.userId);
  }, [items, session.isSignedIn, session.userId]);

  const visibleHistory = useMemo(() => {
    if (!session.userId) {
      return history.slice(0, 25);
    }

    const filtered = history.filter(
      (entry) =>
        entry.fromId === session.userId ||
        entry.toId === session.userId ||
        (entry.action === "BUY" && entry.sellerId === session.userId)
    );

    return filtered.slice(0, 25);
  }, [history, session.userId]);

  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return listings;
    const q = searchQuery.toLowerCase();
    return listings.filter((l) => l.name?.toLowerCase().includes(q));
  }, [listings, searchQuery]);

  function onSignIn(role) {
    const nextSession = createSessionForRole(role);
    setSession(nextSession);
    setSellTarget(null);
    setActiveTab(nextSession.role === "seller" ? "inventory" : "marketplace");
    setStatus({
      type: "success",
      message: `Signed in as ${roleTitle(nextSession.role)}. ${modeMessage()}`,
    });
  }

  function onSignOut() {
    setSession(INITIAL_SESSION);
    setSellTarget(null);
    setSearchQuery("");
    setActiveTab("marketplace");
    setStatus({ type: "info", message: "Signed out. Pick a role to continue." });
  }

  async function onMintProduct({ name, supply, description, image }) {
    if (!session.isSignedIn || !isSeller) {
      setStatus({ type: "error", message: "Only seller account can create products." });
      return;
    }

    try {
      const result = await mintItems({
        name,
        supply,
        description,
        image,
        sellerId: session.userId,
        sellerName: session.profileName,
      });

      await refreshState();
      setStatus({
        type: "success",
        message: `Created ${result.mintedItems.length} item(s) as ${session.profileName}. Stored pictures: ${result.pictureCount}.`,
      });
      setActiveTab("inventory");
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function onConfirmSell({ priceEth, pricePhp }) {
    if (!sellTarget) {
      return;
    }

    if (!session.isSignedIn || !isSeller) {
      setStatus({ type: "error", message: "Only seller account can list items." });
      return;
    }

    try {
      await createListing({
        itemId: sellTarget.itemId,
        sellerId: session.userId,
        sellerName: session.profileName,
        priceEth,
        pricePhp,
      });

      await refreshState();

      setSellTarget(null);
      setActiveTab("marketplace");
      setStatus({
        type: "success",
        message: `Item listed locally at PHP ${Number(pricePhp).toFixed(2)}.`,
      });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function onBuyItem(listing) {
    if (!session.isSignedIn || isSeller) {
      setStatus({ type: "error", message: "Sign in as buyer to purchase items." });
      return;
    }

    if (listing.sellerId && listing.sellerId === session.userId) {
      setStatus({ type: "error", message: "Seller cannot buy the same listing." });
      return;
    }

    try {
      const buyerConfig = validateBuyerTransactionConfig(CONTRACT_ADDRESS);
      let tx = {
        txHash: `LOCAL_BUY_${Date.now()}`,
        mode: "local",
      };

      if (buyerConfig.valid) {
        tx = await runBuyTransaction({
          contractAddress: CONTRACT_ADDRESS,
          abi: CHAINMARKET_ABI,
          itemId: listing.chainItemId || listing.itemId,
          priceEth: listing.priceEth,
        });
      }

      await purchaseListing({
        itemId: listing.itemId,
        buyerId: session.userId,
        buyerName: session.profileName,
        txHash: tx.txHash,
        txMode: tx.mode,
      });

      await refreshState();

      setStatus({
        type: "success",
        message:
          tx.mode === "chain"
            ? `Item purchased on Base Sepolia. Tx: ${tx.txHash}`
            : `Item purchased in SQLite mock mode. Ref: ${tx.txHash}`,
      });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  if (!session.isSignedIn) {
    return <LoginPage onSignIn={onSignIn} phpPerEth={PHP_PER_ETH} />;
  }

  if (isBootstrapping) {
    return (
      <div className="status-bar">
        <div className="status-banner info">Loading SQLite demo data...</div>
      </div>
    );
  }

  return (
    <>
      {/* ===== WATERMARK ===== */}
      <img
        className="watermark-img"
        src="/ChainMarket.png"
        alt=""
        aria-hidden="true"
      />

      {/* ===== SITE HEADER ===== */}
      <header className="site-header">
        {/* TOP BAR: Logo | Nav Tabs | Session */}
        <div className="header-top">
          <div className="header-brand">
            <img className="brand-img" src="/ChainMarket.png" alt="ChainMarket" />
          </div>

          <nav className="header-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={activeTab === tab.id ? "nav-tab active" : "nav-tab"}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="header-right">
            <div className="wallet-pill">
              <span className="dot connected" />
              <span>{roleTitle(session.role)}</span>
              <span className="balance">{session.profileName}</span>
            </div>
            <button className="header-btn" onClick={onSignOut} type="button">
              Sign Out
            </button>
          </div>
        </div>

        {/* SUBNAV: Search bar */}
        <nav className="site-subnav">
          <div className="subnav-inner">
            <div className="subnav-search">
              <input
                placeholder="Search products on ChainMarket…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="subnav-search-btn" type="button">🔍 Search</button>
            </div>
          </div>
        </nav>
      </header>

      {/* ===== MODE BAR ===== */}
      <div className="role-bar-outer">
        <div className="role-bar">
          <div className="mode-note-inline">
            <span>Signed in as {roleTitle(session.role)}.</span>
            <span>{modeMessage()}</span>
          </div>
        </div>
      </div>

      {/* ===== STATUS ===== */}
      {status.message ? (
        <div className="status-bar">
          <div className={`status-banner ${status.type}`}>{status.message}</div>
        </div>
      ) : null}

      {/* ===== MAIN CONTENT ===== */}
      <div className="page-shell">
        {activeTab === "marketplace" && (
          <MarketplaceList
            listings={filteredListings}
            currentUserId={session.userId}
            onBuyItem={onBuyItem}
            isSeller={isSeller}
            canBuy={!isSeller}
            phpPerEth={PHP_PER_ETH}
          />
        )}
        {activeTab === "inventory" && (
          <InventoryDashboard
            items={ownedItems}
            onSellItem={setSellTarget}
          />
        )}
        {activeTab === "create" && (
          <MintItemForm onMintProduct={onMintProduct} />
        )}
        {activeTab === "history" && (
          <TransactionHistory entries={visibleHistory} phpPerEth={PHP_PER_ETH} />
        )}
      </div>

      <SellModal
        open={Boolean(sellTarget)}
        item={sellTarget}
        onCancel={() => setSellTarget(null)}
        onConfirm={onConfirmSell}
        phpPerEth={PHP_PER_ETH}
      />
    </>
  );
}

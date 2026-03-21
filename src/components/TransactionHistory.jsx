import { shortAddress } from "../utils/blockchainService";
import { ethToPhpNumber, formatPhpCurrency } from "../utils/currency";

function formatActor(actor) {
  if (actor === "SYSTEM" || actor === "MARKETPLACE") {
    return actor;
  }

  if (typeof actor === "string" && actor.startsWith("0x") && actor.length >= 10) {
    return shortAddress(actor);
  }

  return actor || "-";
}

function isChainTransaction(entry) {
  if (entry.txMode === "chain") {
    return true;
  }

  if (entry.txMode === "local") {
    return false;
  }

  return typeof entry.txHash === "string" && /^0x[a-fA-F0-9]{64}$/.test(entry.txHash);
}

export default function TransactionHistory({ entries, phpPerEth }) {
  return (
    <div className="history-panel">
      <h2>Transaction History</h2>

      {entries.length === 0 ? (
        <div className="empty-state" style={{ border: "none", padding: "40px 20px" }}>
          <div className="empty-icon">📋</div>
          <h3>No transactions yet</h3>
          <p>Buy or sell items to see your transaction history here.</p>
        </div>
      ) : (
        <div className="history-list">
          {entries.map((entry, index) => {
            const pricePhp = entry.pricePhp ?? ethToPhpNumber(entry.priceEth, phpPerEth);
            const isChain = isChainTransaction(entry);
            const explorerUrl = isChain ? `https://sepolia.basescan.org/tx/${entry.txHash}` : "";

            return (
              <article
                className="history-item"
                key={`${entry.itemId}-${entry.timestamp}-${index}`}
              >
              <span className={`action-badge ${entry.action}`}>{entry.action}</span>

              <div className="history-content">
                <p className="entry-id">{entry.itemId}</p>
                <p className="entry-meta">
                  From: {formatActor(entry.from)} {"→"} To: {formatActor(entry.to)}
                </p>
                <p className="entry-meta">Price: {formatPhpCurrency(pricePhp)}</p>
                {Number(entry.priceEth) > 0 ? (
                  <p className="entry-meta">Blockchain value: {entry.priceEth} ETH</p>
                ) : null}
                <p className="entry-meta">Mode: {isChain ? "On-chain" : "Local demo"}</p>
                <p className="mono">Tx: {entry.txHash}</p>
                {isChain && (
                  <p className="entry-meta">
                    <a href={explorerUrl} target="_blank" rel="noreferrer">
                      View on BaseScan
                    </a>
                  </p>
                )}
              </div>

              <div className="history-time">
                {new Date(entry.timestamp).toLocaleString()}
              </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

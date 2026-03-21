export default function WalletConnect({ wallet, isCorrectNetwork, onSwitchNetwork, onRefreshBalance }) {
  // Only shown when there is an actionable issue
  if (!wallet.connected) return null;
  if (isCorrectNetwork && !wallet.error) return null;

  return (
    <section className="wallet-section">
      <div className="wallet-header">
        <div>
          <strong style={{ fontSize: "0.88rem", color: "var(--navy)" }}>
            {!isCorrectNetwork ? "⚠ Wrong Network Detected" : "⚠ Wallet Error"}
          </strong>
          <div className="wallet-info-chips">
            {!isCorrectNetwork && (
              <span className="info-chip warn">Not connected to Base Sepolia</span>
            )}
            {wallet.error && (
              <span className="info-chip" style={{ color: "var(--error)" }}>
                {wallet.error}
              </span>
            )}
          </div>
        </div>
        <div className="wallet-actions">
          <button className="btn ghost sm" onClick={onRefreshBalance} type="button">
            ↺ Refresh Balance
          </button>
          {!isCorrectNetwork && (
            <button className="btn primary sm" onClick={onSwitchNetwork} type="button">
              Switch to Base Sepolia
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

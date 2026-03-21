import { formatPhpCurrency } from "../utils/currency";

export default function LoginPage({ onSignIn, phpPerEth }) {
  function handleSignIn(role) {
    onSignIn(role);
  }

  return (
    <div className="login-shell">
      <img className="watermark-img" src="/ChainMarket.png" alt="" aria-hidden="true" />

      <div className="login-card">
        <img className="login-logo" src="/ChainMarket.png" alt="ChainMarket" />
        <h1>Welcome to ChainMarket</h1>
        <p>
          Pick your demo role to continue. Seller can create and list products. Buyer can purchase
          listed products.
        </p>

        <div className="login-rate-note">
          Demo rate: 1 ETH = {formatPhpCurrency(phpPerEth)}
        </div>

        <div className="login-actions">
          <button type="button" className="btn navy lg" onClick={() => handleSignIn("seller")}>
            Sign in as Seller
          </button>
          <button type="button" className="btn primary lg" onClick={() => handleSignIn("buyer")}>
            Sign in as Buyer
          </button>
        </div>

        <p className="login-note">
          Buyer purchases attempt an on-chain transaction on Base Sepolia using env configuration.
        </p>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { formatPhpCurrency, phpToEthString } from "../utils/currency";

export default function SellModal({ open, item, onCancel, onConfirm, phpPerEth }) {
  const [pricePhp, setPricePhp] = useState("1000");

  useEffect(() => {
    if (open) setPricePhp("1000");
  }, [open]);

  if (!open || !item) return null;

  const convertedEth = phpToEthString(pricePhp, phpPerEth);

  function submit(event) {
    event.preventDefault();
    const value = Number(pricePhp);
    if (!Number.isFinite(value) || value <= 0) return;

    onConfirm({
      pricePhp: String(value),
      priceEth: phpToEthString(value, phpPerEth),
    });
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h3>List Item for Sale</h3>
          <button className="modal-close" type="button" onClick={onCancel}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Item preview */}
          <div className="modal-item-preview">
            <div className="modal-item-icon">
              {item.image?.dataUrl ? (
                <img className="modal-item-media" src={item.image.dataUrl} alt={item.name} />
              ) : (
                "📦"
              )}
            </div>
            <div className="modal-item-details">
              <h4>{item.name}</h4>
              <p>
                Edition #{item.edition} of {item.totalSupply}
              </p>
            </div>
          </div>

          <form onSubmit={submit}>
            <label className="field">
              Listing Price (PHP)
              <input
                value={pricePhp}
                onChange={(e) => setPricePhp(e.target.value)}
                placeholder="1000"
                type="number"
                min="1"
                step="1"
              />
            </label>

            <p className="modal-rate-note">
              {formatPhpCurrency(pricePhp)} is about {convertedEth || "0"} ETH on-chain.
            </p>

            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" className="btn primary">
                Confirm Listing
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

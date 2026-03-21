import { useState } from "react";
import {
  buildImagePayload,
  formatBytes,
  readFileAsDataUrl,
  validateImageFile,
} from "../utils/imageService";

export default function MintItemForm({ onMintProduct }) {
  const [name, setName] = useState("");
  const [supply, setSupply] = useState(1);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");

  async function onImageChange(event) {
    const selected = event.target.files?.[0];
    if (!selected) {
      return;
    }

    const validation = validateImageFile(selected);
    if (!validation.valid) {
      setImageError(validation.error);
      setImage(null);
      event.target.value = "";
      return;
    }

    setIsImageLoading(true);
    setImageError("");

    try {
      const dataUrl = await readFileAsDataUrl(selected);
      setImage(buildImagePayload(selected, dataUrl));
    } catch (error) {
      setImage(null);
      setImageError(error.message || "Could not process selected image.");
    } finally {
      setIsImageLoading(false);
    }
  }

  function removeImage() {
    setImage(null);
    setImageError("");
  }

  function submit(event) {
    event.preventDefault();
    if (!name.trim()) return;
    onMintProduct({
      name: name.trim(),
      supply: Number(supply),
      description: description.trim(),
      image,
    });
    setName("");
    setSupply(1);
    setDescription("");
    setImage(null);
    setImageError("");
  }

  return (
    <div>
      {/* ===== PAGE HERO ===== */}
      <div className="seller-hero">
        <div>
          <h2>Create New Product</h2>
          <p>Mint a new on-chain item to sell on ChainMarket</p>
        </div>
        <div className="seller-hero-icon">✨</div>
      </div>

      {/* ===== FORM ===== */}
      <div className="form-panel">
        <h2>📦 Product Details</h2>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="field">
              <label>Product Name</label>
              <input
                placeholder="e.g. Leather Bag, Digital Card…"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Supply (Editions)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={supply}
                onChange={(e) => setSupply(e.target.value)}
              />
            </div>
          </div>

          <div className="field" style={{ marginTop: 16 }}>
            <label>Description</label>
            <textarea
              placeholder="Tell buyers about your product…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="field" style={{ marginTop: 16 }}>
            <label>Post Picture</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onImageChange}
            />
            <p className="upload-hint">Upload the picture of the item you want to sell (JPG, PNG, WebP up to 2 MB).</p>
            {isImageLoading && <p className="upload-message">Processing image...</p>}
            {imageError && <p className="upload-message error">{imageError}</p>}
            {image && (
              <div className="upload-preview">
                <img className="upload-preview-img" src={image.dataUrl} alt="Item preview" />
                <div className="upload-preview-meta">
                  <strong>{image.filename}</strong>
                  <span>{formatBytes(image.sizeBytes)}</span>
                  <button type="button" className="btn ghost sm" onClick={removeImage}>
                    Remove image
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              className="btn primary lg"
              type="submit"
              disabled={!name.trim()}
              style={{ maxWidth: 260 }}
            >
              ✨ Create &amp; Mint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

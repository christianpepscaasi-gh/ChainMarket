const STORAGE_KEYS = {
  items: "chainmarket_items",
  listings: "chainmarket_listings",
  history: "chainmarket_history",
  session: "chainmarket_session",
  sellerPictures: "chainmarket_seller_pictures",
};

function safeParse(raw, fallback) {
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function loadAppState() {
  return {
    items: safeParse(localStorage.getItem(STORAGE_KEYS.items), []),
    listings: safeParse(localStorage.getItem(STORAGE_KEYS.listings), []),
    history: safeParse(localStorage.getItem(STORAGE_KEYS.history), []),
    session: safeParse(localStorage.getItem(STORAGE_KEYS.session), null),
    sellerPictures: safeParse(localStorage.getItem(STORAGE_KEYS.sellerPictures), []),
  };
}

export function saveAppState({ items, listings, history, session, sellerPictures }) {
  localStorage.setItem(STORAGE_KEYS.items, JSON.stringify(items ?? []));
  localStorage.setItem(STORAGE_KEYS.listings, JSON.stringify(listings ?? []));
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history ?? []));

  if (Array.isArray(sellerPictures)) {
    localStorage.setItem(STORAGE_KEYS.sellerPictures, JSON.stringify(sellerPictures));
  }

  if (session) {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEYS.session);
  }
}

export function clearAppState() {
  localStorage.removeItem(STORAGE_KEYS.items);
  localStorage.removeItem(STORAGE_KEYS.listings);
  localStorage.removeItem(STORAGE_KEYS.history);
  localStorage.removeItem(STORAGE_KEYS.session);
  localStorage.removeItem(STORAGE_KEYS.sellerPictures);
}

export function upsertSellerPictureArchive(archive, image, context) {
  if (!image?.dataUrl) {
    return archive || [];
  }

  const current = Array.isArray(archive) ? archive : [];
  const existingIndex = current.findIndex((entry) => entry.dataUrl === image.dataUrl);

  if (existingIndex >= 0) {
    const updated = [...current];
    const prev = updated[existingIndex];
    updated[existingIndex] = {
      ...prev,
      updatedAt: new Date().toISOString(),
      usageCount: Number(prev.usageCount || 0) + 1,
      lastUsedBy: context?.sellerId || prev.lastUsedBy || "",
      lastUsedProduct: context?.productName || prev.lastUsedProduct || "",
    };
    return updated;
  }

  return [
    {
      pictureId: `pic-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      dataUrl: image.dataUrl,
      filename: image.filename || "uploaded-image",
      mimeType: image.mimeType || "image/jpeg",
      sizeBytes: Number(image.sizeBytes) || 0,
      uploadedAt: image.uploadedAt || new Date().toISOString(),
      usageCount: 1,
      sellerId: context?.sellerId || "",
      sellerName: context?.sellerName || "",
      lastUsedProduct: context?.productName || "",
      lastUsedBy: context?.sellerId || "",
    },
    ...current,
  ];
}

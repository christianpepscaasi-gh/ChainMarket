const DEFAULT_PHP_PER_ETH = 180000;

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function getPhpPerEth() {
  const raw = import.meta.env.VITE_PHP_PER_ETH;
  const parsed = toNumber(raw, DEFAULT_PHP_PER_ETH);
  return parsed > 0 ? parsed : DEFAULT_PHP_PER_ETH;
}

export function phpToEthString(phpAmount, phpPerEth = getPhpPerEth()) {
  const safePhp = toNumber(phpAmount, 0);
  if (safePhp <= 0 || phpPerEth <= 0) {
    return "0";
  }

  const ethValue = safePhp / phpPerEth;
  return ethValue
    .toFixed(8)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?)0+$/, "$1");
}

export function ethToPhpNumber(ethAmount, phpPerEth = getPhpPerEth()) {
  const safeEth = toNumber(ethAmount, 0);
  if (safeEth <= 0 || phpPerEth <= 0) {
    return 0;
  }

  return safeEth * phpPerEth;
}

export function formatPhpCurrency(value) {
  const safeValue = toNumber(value, 0);
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeValue);
}

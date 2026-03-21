import { ethers } from "ethers";

export const BASE_SEPOLIA_CHAIN_ID = 84532;
const BASE_SEPOLIA_CHAIN_HEX = "0x14A34";
const BASE_SEPOLIA_RPC_URL =
  import.meta.env.VITE_BASE_SEPOLIA_RPC_URL ||
  import.meta.env.BASE_SEPOLIA_RPC_URL ||
  "https://sepolia.base.org";
const ENV_CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS || import.meta.env.CONTRACT_ADDRESS || "";
const DEMO_PRIVATE_KEY =
  import.meta.env.VITE_DEMO_PRIVATE_KEY || import.meta.env.DEMO_PRIVATE_KEY || "";

const BASE_SEPOLIA_PARAMS = {
  chainId: BASE_SEPOLIA_CHAIN_HEX,
  chainName: "Base Sepolia",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: [BASE_SEPOLIA_RPC_URL],
  blockExplorerUrls: ["https://sepolia.basescan.org"],
};

function asMessage(error) {
  if (error?.reason) {
    return error.reason;
  }

  if (error?.shortMessage) {
    return error.shortMessage;
  }

  if (error?.message) {
    return error.message;
  }

  return "Unexpected blockchain error.";
}

function normalizeItemId(itemId) {
  if (typeof itemId === "number" || typeof itemId === "bigint") {
    return BigInt(itemId);
  }

  const text = String(itemId);
  let hash = 0n;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31n + BigInt(text.charCodeAt(index))) % 1000000000000n;
  }

  return hash;
}

function getContract(signer, contractAddress, abi) {
  if (!signer || !contractAddress || !abi?.length) {
    return null;
  }

  return new ethers.Contract(contractAddress, abi, signer);
}

export function isMetaMaskAvailable() {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

export function hasDemoSignerConfig() {
  return Boolean(BASE_SEPOLIA_RPC_URL) && Boolean(DEMO_PRIVATE_KEY);
}

function validateDemoSignerConfig() {
  const errors = [];

  if (!BASE_SEPOLIA_RPC_URL) {
    errors.push("Missing VITE_BASE_SEPOLIA_RPC_URL in .env.");
  }

  if (!DEMO_PRIVATE_KEY) {
    errors.push("Missing VITE_DEMO_PRIVATE_KEY in .env.");
  } else {
    try {
      const normalized = DEMO_PRIVATE_KEY.startsWith("0x")
        ? DEMO_PRIVATE_KEY
        : `0x${DEMO_PRIVATE_KEY}`;
      new ethers.SigningKey(normalized);
    } catch {
      errors.push("Invalid VITE_DEMO_PRIVATE_KEY format.");
    }
  }

  return errors;
}

export function validateBuyerTransactionConfig(contractAddress = ENV_CONTRACT_ADDRESS) {
  const errors = [...validateDemoSignerConfig()];
  const address = String(contractAddress || "").trim();

  if (!address) {
    errors.push("Missing VITE_CONTRACT_ADDRESS in .env.");
  } else if (!ethers.isAddress(address)) {
    errors.push("Invalid VITE_CONTRACT_ADDRESS format.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function createDemoSigner() {
  const signerErrors = validateDemoSignerConfig();

  if (signerErrors.length > 0) {
    throw new Error(signerErrors.join(" "));
  }

  try {
    const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC_URL, BASE_SEPOLIA_CHAIN_ID);
    return new ethers.Wallet(DEMO_PRIVATE_KEY, provider);
  } catch {
    throw new Error("Invalid VITE_DEMO_PRIVATE_KEY format.");
  }
}

export async function connectInjectedWallet() {
  if (!isMetaMaskAvailable()) {
    throw new Error("MetaMask is not installed in this browser.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();
  const balanceWei = await provider.getBalance(address);

  return {
    provider,
    signer,
    address,
    chainId: Number(network.chainId),
    balanceEth: ethers.formatEther(balanceWei),
  };
}

export async function switchToBaseSepolia() {
  if (!isMetaMaskAvailable()) {
    throw new Error("MetaMask is not available for network switching.");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_SEPOLIA_CHAIN_HEX }],
    });
  } catch (error) {
    if (error?.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [BASE_SEPOLIA_PARAMS],
      });
      return;
    }

    throw new Error(asMessage(error));
  }
}

export async function fetchBalance(provider, address) {
  const balanceWei = await provider.getBalance(address);
  return ethers.formatEther(balanceWei);
}

export function shortAddress(address) {
  if (!address || address.length < 10) {
    return address || "";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function mockHash() {
  return ethers.hexlify(ethers.randomBytes(32));
}

export async function runListTransaction({
  signer,
  contractAddress,
  abi,
  itemId,
  priceEth,
}) {
  const contract = getContract(signer, contractAddress, abi);

  if (!contract) {
    return {
      txHash: mockHash(),
      mode: "local",
    };
  }

  try {
    const itemIdForChain = normalizeItemId(itemId);
    const priceWei = ethers.parseEther(String(priceEth));
    const tx = await contract.listItem(itemIdForChain, priceWei);
    const receipt = await tx.wait();

    return {
      txHash: receipt?.hash || tx.hash,
      mode: "chain",
    };
  } catch (error) {
    throw new Error(asMessage(error));
  }
}

export async function runBuyTransaction({
  signer,
  contractAddress,
  abi,
  itemId,
  priceEth,
}) {
  if (!contractAddress) {
    throw new Error("Missing VITE_CONTRACT_ADDRESS in .env.");
  }

  if (!ethers.isAddress(contractAddress)) {
    throw new Error("Invalid contract address. Check VITE_CONTRACT_ADDRESS in .env.");
  }

  if (!abi?.length) {
    throw new Error("Contract ABI is missing. Cannot execute buyer transaction.");
  }

  let txSigner = signer;

  if (!txSigner) {
    txSigner = createDemoSigner();
  }

  const contract = getContract(txSigner, contractAddress, abi);

  if (!contract) {
    throw new Error("Unable to create contract instance for buyer transaction.");
  }

  try {
    const itemIdForChain = normalizeItemId(itemId);
    const priceWei = ethers.parseEther(String(priceEth));
    const tx = await contract.buyItem(itemIdForChain, { value: priceWei });
    const receipt = await tx.wait();

    return {
      txHash: receipt?.hash || tx.hash,
      mode: "chain",
    };
  } catch (error) {
    throw new Error(asMessage(error));
  }
}

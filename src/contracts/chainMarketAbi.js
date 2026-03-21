export const CHAINMARKET_ABI = [
  "function listItem(uint256 itemId, uint256 price) external",
  "function buyItem(uint256 itemId) external payable",
  "event ItemListed(uint256 indexed itemId, address indexed seller, uint256 price)",
  "event ItemBought(uint256 indexed itemId, address indexed buyer, uint256 price)",
];

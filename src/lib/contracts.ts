/**
 * Contract Configuration for Meridian Protocol
 * Contains ABIs and addresses for all deployed contracts
 */

// Contract Addresses (update after deployment)
export const CONTRACT_ADDRESSES = {
  // Mantle Testnet (Sepolia)
  testnet: {
    MeridianToken: import.meta.env.VITE_MERIDIAN_TOKEN_ADDRESS || "",
    MeridianVault: import.meta.env.VITE_MERIDIAN_VAULT_ADDRESS || "",
    YieldAggregator: import.meta.env.VITE_YIELD_AGGREGATOR_ADDRESS || "",
    ZKKYCVerifier: import.meta.env.VITE_ZKKYC_VERIFIER_ADDRESS || "",
    ComplianceRegistry: import.meta.env.VITE_COMPLIANCE_REGISTRY_ADDRESS || "",
  },
  // Mantle Mainnet
  mainnet: {
    MeridianToken: "",
    MeridianVault: "",
    YieldAggregator: "",
    ZKKYCVerifier: "",
    ComplianceRegistry: "",
  },
} as const;

// Network Configuration
export const NETWORK_CONFIG = {
  testnet: {
    chainId: 5003,
    name: "Mantle Sepolia",
    rpc: import.meta.env.VITE_MANTLE_TESTNET_RPC || "https://rpc.sepolia.mantle.xyz",
    explorer: "https://sepolia.mantlescan.xyz",
    nativeCurrency: {
      name: "MNT",
      symbol: "MNT",
      decimals: 18,
    },
  },
  mainnet: {
    chainId: 5000,
    name: "Mantle",
    rpc: import.meta.env.VITE_MANTLE_MAINNET_RPC || "https://rpc.mantle.xyz",
    explorer: "https://mantlescan.xyz",
    nativeCurrency: {
      name: "MNT",
      symbol: "MNT",
      decimals: 18,
    },
  },
} as const;

// Minimal ABIs for frontend interaction
export const ABIS = {
  MeridianToken: [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)",
  ],

  MeridianVault: [
    // ERC-4626
    "function asset() view returns (address)",
    "function totalAssets() view returns (uint256)",
    "function convertToShares(uint256 assets) view returns (uint256)",
    "function convertToAssets(uint256 shares) view returns (uint256)",
    "function maxDeposit(address receiver) view returns (uint256)",
    "function previewDeposit(uint256 assets) view returns (uint256)",
    "function deposit(uint256 assets, address receiver) returns (uint256)",
    "function maxMint(address receiver) view returns (uint256)",
    "function previewMint(uint256 shares) view returns (uint256)",
    "function mint(uint256 shares, address receiver) returns (uint256)",
    "function maxWithdraw(address owner) view returns (uint256)",
    "function previewWithdraw(uint256 assets) view returns (uint256)",
    "function withdraw(uint256 assets, address receiver, address owner) returns (uint256)",
    "function maxRedeem(address owner) view returns (uint256)",
    "function previewRedeem(uint256 shares) view returns (uint256)",
    "function redeem(uint256 shares, address receiver, address owner) returns (uint256)",
    // ERC-20
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    // Meridian specific
    "function isCompliant(address account) view returns (bool)",
    "function availableLiquidity() view returns (uint256)",
    "function totalYieldGenerated() view returns (uint256)",
    "function currentAPY() view returns (uint256)",
    "function requestWithdraw(uint256 shares, uint256 minAssets) returns (uint256)",
    "function processWithdraw(uint256 requestId) returns (uint256)",
    "function emergencyWithdraw(uint256 shares) returns (uint256)",
    // Events
    "event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)",
    "event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)",
    "event YieldHarvested(uint256 amount, uint256 timestamp)",
  ],

  YieldAggregator: [
    "function baseAsset() view returns (address)",
    "function totalValueLocked() view returns (uint256)",
    "function pendingYield() view returns (uint256)",
    "function userShares(address user) view returns (uint256)",
    "function totalShares() view returns (uint256)",
    "function deposit(uint256 amount)",
    "function withdraw(uint256 amount)",
    "function harvestAll()",
    "function rebalance()",
    "function needsRebalance() view returns (bool)",
    "event DepositToStrategy(address indexed vault, uint256 amount)",
    "event WithdrawFromStrategy(address indexed vault, uint256 amount)",
    "event Rebalanced(uint256 timestamp, uint256 totalValue)",
  ],

  ComplianceRegistry: [
    "function canInteract(address account, address vault) view returns (bool)",
    "function canTransfer(address from, address to, address vault) view returns (bool)",
    "function isOperator(address account) view returns (bool)",
    "function getRegisteredVaults() view returns (address[])",
    "event ComplianceStatusUpdated(address indexed account, bool compliant, uint256 timestamp)",
    "event AccountFrozen(address indexed account, string reason)",
    "event AccountUnfrozen(address indexed account)",
  ],

  ZKKYCVerifier: [
    "function isVerified(address account) view returns (bool)",
    "function getAccreditation(address account) view returns (uint8)",
    "function isJurisdictionAllowed(bytes32 jurisdictionCode) view returns (bool)",
    "function isAuthorizedIssuer(address issuer) view returns (bool)",
    "event CredentialIssued(address indexed account, bytes32 indexed credentialHash, uint256 expiry, uint8 credentialType)",
    "event VerificationCompleted(address indexed account, bool success, bytes32 proofHash)",
    "event AccreditationVerified(address indexed account, uint8 accreditationType)",
  ],
} as const;

// Helper to get current network
export function getCurrentNetwork() {
  const chainId = Number(import.meta.env.VITE_MANTLE_TESTNET_CHAIN_ID) || 5003;
  return chainId === 5000 ? "mainnet" : "testnet";
}

// Helper to get contract address
export function getContractAddress(contractName: keyof typeof CONTRACT_ADDRESSES.testnet) {
  const network = getCurrentNetwork();
  return CONTRACT_ADDRESSES[network][contractName];
}

// Helper to get network config
export function getNetworkConfig() {
  const network = getCurrentNetwork();
  return NETWORK_CONFIG[network];
}

// Contract constants
export const MODULE_ADDRESS = import.meta.env.VITE_MODULE_ADDRESS || "0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a";

// Network configuration
export const APTOS_NETWORK = import.meta.env.VITE_APTOS_NETWORK || "devnet";

// API endpoints
export const APTOS_FULLNODE_URL = APTOS_NETWORK === "mainnet"
  ? "https://fullnode.mainnet.aptoslabs.com"
  : "https://fullnode.devnet.aptoslabs.com";

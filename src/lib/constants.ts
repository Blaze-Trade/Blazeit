// Contract constants
export const MODULE_ADDRESS =
  import.meta.env.VITE_MODULE_ADDRESS ||
  "0x5fb97dfeb76077901d88b70f6f02f9f164e83828cc173998f52d019777aa931a";

// Network configuration
const APTOS_NETWORK = import.meta.env.VITE_APTOS_NETWORK || "devnet";

// API endpoints
export const APTOS_FULLNODE_URL = APTOS_NETWORK === "mainnet"
  ? "https://fullnode.mainnet.aptoslabs.com"
  : "https://fullnode.devnet.aptoslabs.com";

import { Network } from "@aptos-labs/ts-sdk";

// Contract constants
export const MODULE_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x5fb97dfeb76077901d88b70f6f02f9f164e83828cc173998f52d019777aa931a";

// Network configuration
const APTOS_NETWORK_ENV = process.env.NEXT_PUBLIC_APTOS_NETWORK || "devnet";

/**
 * Get Aptos Network enum from environment variable
 */
export function getAptosNetwork(): Network {
  switch (APTOS_NETWORK_ENV.toLowerCase()) {
    case "mainnet":
      return Network.MAINNET;
    case "testnet":
      return Network.TESTNET;
    case "devnet":
    default:
      return Network.DEVNET;
  }
}

/**
 * Get network name as string
 */
export function getNetworkName(): string {
  return APTOS_NETWORK_ENV.toLowerCase();
}

/**
 * Check if current network is mainnet
 */
export function isMainnet(): boolean {
  return APTOS_NETWORK_ENV.toLowerCase() === "mainnet";
}

/**
 * Check if current network is testnet
 */
export function isTestnet(): boolean {
  return APTOS_NETWORK_ENV.toLowerCase() === "testnet";
}

/**
 * Check if current network is devnet
 */
export function isDevnet(): boolean {
  return APTOS_NETWORK_ENV.toLowerCase() === "devnet";
}

// API endpoints
export const APTOS_FULLNODE_URL =
  APTOS_NETWORK_ENV === "mainnet"
    ? "https://fullnode.mainnet.aptoslabs.com"
    : APTOS_NETWORK_ENV === "testnet"
    ? "https://fullnode.testnet.aptoslabs.com"
    : "https://fullnode.devnet.aptoslabs.com";

// Export the network for backward compatibility
export const APTOS_NETWORK = APTOS_NETWORK_ENV;

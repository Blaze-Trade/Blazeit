/**
 * Blaze Launchpad V2 SDK
 *
 * SDK for frontend integration with Blaze Launchpad V2 using Bancor bonding curves
 * and automatic Hyperion DEX migration (pump.fun model)
 */

import {
  Aptos,
  AptosConfig,
  Network
} from "@aptos-labs/ts-sdk";
import { getAptosNetwork, getNetworkName } from "./constants";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Blaze Launchpad V2 contract address (update after deployment) */
export const CONTRACT_ADDRESS_V2 = process.env.NEXT_PUBLIC_LAUNCHPAD_V2_ADDRESS || "0xf2ca7e5f4e8fb07ea86f701ca1fd1da98d5c41d2f87979be0723a13da3bca125";

/** Default network configuration from environment */
export const DEFAULT_NETWORK = getAptosNetwork();

/** APT decimals constant */
export const APT_DECIMALS = 8;

// ============================================================================
// TYPES
// ============================================================================

export interface CreatePoolParams {
  /** Token name (e.g., "My Token") */
  name: string;

  /** Token ticker symbol, 1-10 characters (e.g., "MTK") */
  ticker: string;

  /** Token image URI */
  imageUri: string;

  /** Token description (optional) */
  description?: string;

  /** Website URL (optional) */
  website?: string;

  /** Twitter handle (optional) */
  twitter?: string;

  /** Telegram link (optional) */
  telegram?: string;

  /** Discord link (optional) */
  discord?: string;

  /** Maximum token supply (optional, undefined = unlimited) */
  maxSupply?: bigint;

  /** Number of decimals (default: 8) */
  decimals?: number;

  /** Reserve ratio percentage 1-100 (default: 50) */
  reserveRatio?: number;

  /** Initial APT reserve amount in APT (e.g., 0.1 for 0.1 APT) */
  initialReserveApt: number;

  /** Market cap threshold in USD (optional, default: 75000) */
  thresholdUsd?: number;
}

export interface PoolData {
  metadata: TokenMetadata;
  curve: BancorCurve;
  settings: PoolSettings;
}

export interface TokenMetadata {
  name: string;
  ticker: string;
  token_image_uri: string;
  description?: string;
  social_links: SocialLinks;
  created_at: number;
  creator: string;
}

export interface SocialLinks {
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
}

export interface BancorCurve {
  reserve_ratio: number;
  reserve_balance: number;
  is_active: boolean;
}

export interface PoolSettings {
  market_cap_threshold_usd: number;
  hyperion_pool_address?: string;
  migration_completed: boolean;
  migration_timestamp?: number;
  trading_enabled: boolean;
}

export interface TransactionResult {
  /** Transaction hash */
  hash: string;

  /** Explorer URL */
  explorerUrl: string;

  /** Success status */
  success: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get Aptos client instance
 */
export function getAptosClient(network: Network = DEFAULT_NETWORK): Aptos {
  const config = new AptosConfig({ network });
  return new Aptos(config);
}

/**
 * Get explorer URL for a transaction
 */
export function getExplorerUrl(txHash: string): string {
  const networkName = getNetworkName();
  return `https://explorer.aptoslabs.com/txn/${txHash}?network=${networkName}`;
}

/**
 * Convert APT to octas (1 APT = 100,000,000 octas)
 */
export function aptToOctas(apt: number): number {
  return Math.floor(apt * 100_000_000);
}

/**
 * Convert octas to APT
 */
export function octasToApt(octas: number): number {
  return octas / 100_000_000;
}

/**
 * Convert tokens to base units (with decimals)
 */
export function tokensToBaseUnits(tokens: number, decimals: number = 8): number {
  return Math.floor(tokens * Math.pow(10, decimals));
}

/**
 * Convert base units to tokens
 */
export function baseUnitsToTokens(baseUnits: number, decimals: number = 8): number {
  return baseUnits / Math.pow(10, decimals);
}

// ============================================================================
// CONTRACT VALIDATION
// ============================================================================

/**
 * Check if the V2 contract exists and is accessible
 */
export async function validateContract(network: Network = DEFAULT_NETWORK): Promise<boolean> {
  const aptos = getAptosClient(network);

  try {
    console.log(`🔍 Validating contract: ${CONTRACT_ADDRESS_V2}`);

    // Try to get account info to see if contract exists
    const accountInfo = await aptos.getAccountInfo({
      accountAddress: CONTRACT_ADDRESS_V2,
    });

    console.log("✅ Contract account info:", accountInfo);
    return true;
  } catch (error) {
    console.error("❌ Contract validation failed:", error);
    return false;
  }
}

// ============================================================================
// VIEW FUNCTIONS
// ============================================================================

/**
 * Get all pool IDs from the registry
 */
export async function getPools(network: Network = DEFAULT_NETWORK): Promise<string[]> {
  const aptos = getAptosClient(network);

  try {
    console.log(`🔍 Calling getPools on contract: ${CONTRACT_ADDRESS_V2}`);
    console.log(`🌐 Network: ${network}`);

    const result = await aptos.view({
      payload: {
        function: `${CONTRACT_ADDRESS_V2}::launchpad_v2::get_pools`,
        functionArguments: [],
      }
    });

    console.log("📋 Raw contract response:", result);

    // Result is an array of {inner: "0x..."} objects
    const pools = result[0] as Array<{inner: string}>;
    const poolIds = pools.map(p => p.inner);

    console.log("📋 Processed pool IDs:", poolIds);
    return poolIds;
  } catch (error) {
    console.error("❌ Error fetching pools:", error);
    console.error("Contract address:", CONTRACT_ADDRESS_V2);
    console.error("Network:", network);
    return [];
  }
}

/**
 * Get pool data (metadata, curve, settings)
 */
export async function getPool(
  poolId: string,
  network: Network = DEFAULT_NETWORK
): Promise<PoolData | null> {
  const aptos = getAptosClient(network);

  try {
    const result = await aptos.view({
      payload: {
        function: `${CONTRACT_ADDRESS_V2}::launchpad_v2::get_pool`,
        functionArguments: [poolId],
      }
    });

    return {
      metadata: result[0] as TokenMetadata,
      curve: result[1] as BancorCurve,
      settings: result[2] as PoolSettings,
    };
  } catch (error) {
    console.error("Error fetching pool:", error);
    return null;
  }
}

/**
 * Get pool APT reserve balance
 */
export async function getPoolBalance(
  poolId: string,
  network: Network = DEFAULT_NETWORK
): Promise<number> {
  const aptos = getAptosClient(network);

  try {
    const result = await aptos.view({
      payload: {
        function: `${CONTRACT_ADDRESS_V2}::launchpad_v2::get_pool_balance`,
        functionArguments: [poolId],
      }
    });

    return parseInt(result[0] as string);
  } catch (error) {
    console.error("Error fetching pool balance:", error);
    return 0;
  }
}

/**
 * Get current token price (in octas per token)
 */
export async function getCurrentPrice(
  poolId: string,
  network: Network = DEFAULT_NETWORK
): Promise<number> {
  const aptos = getAptosClient(network);

  try {
    const result = await aptos.view({
      payload: {
        function: `${CONTRACT_ADDRESS_V2}::launchpad_v2::get_current_price`,
        functionArguments: [poolId],
      }
    });

    return parseInt(result[0] as string);
  } catch (error) {
    console.error("Error fetching current price:", error);
    return 0;
  }
}

/**
 * Get current token supply
 */
export async function getCurrentSupply(
  poolId: string,
  network: Network = DEFAULT_NETWORK
): Promise<bigint> {
  const aptos = getAptosClient(network);

  try {
    const result = await aptos.view({
      payload: {
        function: `${CONTRACT_ADDRESS_V2}::launchpad_v2::get_current_supply`,
        functionArguments: [poolId],
      }
    });

    return BigInt(result[0] as string);
  } catch (error) {
    console.error("Error fetching current supply:", error);
    return BigInt(0);
  }
}

/**
 * Calculate market cap in USD cents
 */
export async function calculateMarketCapUsd(
  poolId: string,
  network: Network = DEFAULT_NETWORK
): Promise<number> {
  const aptos = getAptosClient(network);

  try {
    const result = await aptos.view({
      payload: {
        function: `${CONTRACT_ADDRESS_V2}::launchpad_v2::calculate_market_cap_usd`,
        functionArguments: [poolId],
      }
    });

    return parseInt(result[0] as string);
  } catch (error) {
    console.error("Error calculating market cap:", error);
    return 0;
  }
}

/**
 * Check if migration threshold has been reached
 */
export async function isMigrationThresholdReached(
  poolId: string,
  network: Network = DEFAULT_NETWORK
): Promise<boolean> {
  const aptos = getAptosClient(network);

  try {
    const result = await aptos.view({
      payload: {
        function: `${CONTRACT_ADDRESS_V2}::launchpad_v2::is_migration_threshold_reached`,
        functionArguments: [poolId],
      }
    });

    return result[0] as boolean;
  } catch (error) {
    console.error("Error checking migration threshold:", error);
    return false;
  }
}

/**
 * Calculate tokens received for APT amount (before fees)
 */
export async function calculatePurchaseReturn(
  poolId: string,
  aptAmount: number,
  network: Network = DEFAULT_NETWORK
): Promise<number> {
  const aptos = getAptosClient(network);

  try {
    const aptAmountOctas = aptToOctas(aptAmount);
    const result = await aptos.view({
      payload: {
        function: `${CONTRACT_ADDRESS_V2}::launchpad_v2::calculate_curved_mint_return`,
        functionArguments: [poolId, aptAmountOctas],
      }
    });

    return parseInt(result[0] as string);
  } catch (error) {
    console.error("Error calculating purchase return:", error);
    return 0;
  }
}

/**
 * Calculate APT received for token amount (before fees)
 */
export async function calculateSaleReturn(
  poolId: string,
  tokenAmount: number,
  decimals: number = 8,
  network: Network = DEFAULT_NETWORK
): Promise<number> {
  const aptos = getAptosClient(network);

  try {
    const tokenAmountBase = tokensToBaseUnits(tokenAmount, decimals);
    const result = await aptos.view({
      payload: {
        function: `${CONTRACT_ADDRESS_V2}::launchpad_v2::calculate_curved_burn_return`,
        functionArguments: [poolId, tokenAmountBase],
      }
    });

    return parseInt(result[0] as string);
  } catch (error) {
    console.error("Error calculating sale return:", error);
    return 0;
  }
}

/**
 * Get all token metadata
 */
export async function getAllTokens(
  network: Network = DEFAULT_NETWORK
): Promise<TokenMetadata[]> {
  const aptos = getAptosClient(network);

  try {
    const result = await aptos.view({
      payload: {
        function: `${CONTRACT_ADDRESS_V2}::launchpad_v2::get_tokens`,
        functionArguments: [],
      }
    });

    return result[0] as TokenMetadata[];
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return [];
  }
}

/**
 * Get current APT/USD price from oracle (in USD cents)
 */
export async function getAptUsdPrice(
  network: Network = DEFAULT_NETWORK
): Promise<number> {
  const aptos = getAptosClient(network);

  try {
    const result = await aptos.view({
      payload: {
        function: `${CONTRACT_ADDRESS_V2}::launchpad_v2::get_apt_usd_price`,
        functionArguments: [],
      }
    });

    return parseInt(result[0] as string);
  } catch (error) {
    console.error("Error fetching APT/USD price:", error);
    return 850; // Default $8.50
  }
}

// ============================================================================
// TRANSACTION BUILDER HELPERS
// ============================================================================

/**
 * Build create pool transaction payload
 */
export function buildCreatePoolPayload(params: CreatePoolParams) {
  const decimals = params.decimals ?? 8;
  const reserveRatio = params.reserveRatio ?? 50;
  const initialReserveOctas = aptToOctas(params.initialReserveApt);
  const thresholdCents = params.thresholdUsd ? params.thresholdUsd * 100 : 7500000;

  return {
    function: `${CONTRACT_ADDRESS_V2}::launchpad_v2::create_pool` as `${string}::${string}::${string}`,
    functionArguments: [
      params.name,
      params.ticker,
      params.imageUri,
      params.description || null,
      params.website || null,
      params.twitter || null,
      params.telegram || null,
      params.discord || null,
      params.maxSupply || null,
      decimals,
      reserveRatio,
      initialReserveOctas,
      thresholdCents
    ],
  };
}

/**
 * Build buy transaction payload
 */
export function buildBuyPayload(
  poolId: string,
  aptAmount: number,
  minTokensOut: number = 0,
  deadlineMinutes: number = 5
) {
  const aptAmountOctas = aptToOctas(aptAmount);
  const deadline = Math.floor(Date.now() / 1000) + (deadlineMinutes * 60);

  minTokensOut = 0
  // console.log("🔍 Building buy payload:", {
  //   function: `${CONTRACT_ADDRESS_V2}::launchpad_v2::buy` as `${string}::${string}::${string}`,
  //   poolId,
  //   aptAmountOctas,
  //   minTokensOut,
  //   deadline
  // });
  return {
    function: `${CONTRACT_ADDRESS_V2}::launchpad_v2::buy` as `${string}::${string}::${string}`,
    functionArguments: [
      poolId,
      aptAmountOctas,
      minTokensOut,
      deadline
    ],
  };
}

/**
 * Build sell transaction payload
 */
export function buildSellPayload(
  poolId: string,
  tokenAmount: number,
  decimals: number = 8,
  minAptOut: number = 0,
  deadlineMinutes: number = 5
) {
  const tokenAmountBase = tokensToBaseUnits(tokenAmount, decimals);
  const minAptOutOctas = aptToOctas(minAptOut);
  const deadline = Math.floor(Date.now() / 1000) + (deadlineMinutes * 60);

  return {
    function: `${CONTRACT_ADDRESS_V2}::launchpad_v2::sell` as `${string}::${string}::${string}`,
    functionArguments: [
      poolId,
      tokenAmountBase,
      minAptOutOctas,
      deadline
    ],
  };
}

/**
 * Build migrate to Hyperion DEX transaction payload
 * This function should be called when a token reaches its market cap threshold
 * @param poolId - Pool ID to migrate
 * @returns Transaction payload
 */
export function buildMigrateToHyperionPayload(poolId: string) {
  return {
    function: `${CONTRACT_ADDRESS_V2}::launchpad_v2::migrate_to_hyperion` as `${string}::${string}::${string}`,
    functionArguments: [poolId],
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Constants
  CONTRACT_ADDRESS_V2,
  DEFAULT_NETWORK,
  APT_DECIMALS,

  // View functions
  getPools,
  getPool,
  getPoolBalance,
  getCurrentPrice,
  getCurrentSupply,
  calculateMarketCapUsd,
  isMigrationThresholdReached,
  calculatePurchaseReturn,
  calculateSaleReturn,
  getAllTokens,
  getAptUsdPrice,

  // Payload builders
  buildCreatePoolPayload,
  buildBuyPayload,
  buildSellPayload,
  buildMigrateToHyperionPayload,

  // Helper functions
  getAptosClient,
  getExplorerUrl,
  aptToOctas,
  octasToApt,
  tokensToBaseUnits,
  baseUnitsToTokens,
};


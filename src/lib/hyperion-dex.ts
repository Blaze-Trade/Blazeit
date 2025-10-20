/**
 * Hyperion DEX Integration
 *
 * Handles trading for tokens that have migrated from bonding curve to Hyperion DEX
 * https://hyperion.xyz - Aptos native DEX
 */

import { Network } from "@aptos-labs/ts-sdk";
import { aptToOctas, tokensToBaseUnits } from "./blaze-sdk";
import { APTOS_FULLNODE_URL, getAptosNetwork } from "./constants";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Hyperion DEX contract addresses
 * Main Hyperion contract: 0x69faed94da99abb7316cb3ec2eeaa1b961a47349fad8c584f67a930b0d14fec7
 *
 * Based on Hyperion documentation:
 * - Router: Main contract with router_v3 module
 * - Factory: Main contract with factory module
 * - Pool: Main contract with pool_v3 module
 */
export const HYPERION_ADDRESSES = {
  // Main Hyperion contract (contains all modules)
  contract: "0x69faed94da99abb7316cb3ec2eeaa1b961a47349fad8c584f67a930b0d14fec7",

  // Router contract for swaps (same as main contract)
  router: "0x69faed94da99abb7316cb3ec2eeaa1b961a47349fad8c584f67a930b0d14fec7",

  // Factory contract for pool management (same as main contract)
  factory: "0x69faed94da99abb7316cb3ec2eeaa1b961a47349fad8c584f67a930b0d14fec7",
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface HyperionSwapParams {
  poolAddress: string;
  amountIn: number;
  minAmountOut: number;
  deadline: number;
}

export interface HyperionPoolInfo {
  poolAddress: string;
  token0: string;
  token1: string;
  reserve0: number;
  reserve1: number;
  totalSupply: number;
}

// ============================================================================
// VIEW FUNCTIONS
// ============================================================================

/**
 * Get Hyperion pool information using pool_v3 module
 * Based on Hyperion documentation: pool_v3::get_pool_info
 * @param poolAddress - Hyperion pool address
 * @param network - Network to query
 * @returns Pool information or null if not found
 */
export async function getHyperionPoolInfo(
  poolAddress: string,
  network: Network = getAptosNetwork()
): Promise<HyperionPoolInfo | null> {
  try {
    const { Aptos, AptosConfig } = await import("@aptos-labs/ts-sdk");

    const aptos = new Aptos(new AptosConfig({
      network: network,
      fullnode: APTOS_FULLNODE_URL,
    }));

    // Query pool_v3 module for pool information
    // Based on Hyperion docs: pool_v3::get_pool_info(pool_address)
    const result = await aptos.view({
      payload: {
        function: `${HYPERION_ADDRESSES.contract}::pool_v3::get_pool_info`,
        typeArguments: [],
        functionArguments: [poolAddress],
      },
    });

    if (result && result[0]) {
      const poolData = result[0] as any;
      return {
        poolAddress,
        token0: poolData.token_x_type || poolData.token0 || "",
        token1: poolData.token_y_type || poolData.token1 || "",
        reserve0: parseFloat(poolData.reserve_x || poolData.reserve0 || "0"),
        reserve1: parseFloat(poolData.reserve_y || poolData.reserve1 || "0"),
        totalSupply: parseFloat(poolData.total_supply || "0"),
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to get Hyperion pool info:", error);
    return null;
  }
}

/**
 * Calculate output amount for swap using swap_math module
 * Based on Hyperion documentation: swap_math::get_amount_out
 * @param poolAddress - Hyperion pool address
 * @param amountIn - Input amount
 * @param isAptToToken - True if swapping APT for token, false for token to APT
 * @param network - Network to query
 * @returns Estimated output amount
 */
export async function calculateSwapOutput(
  poolAddress: string,
  amountIn: number,
  isAptToToken: boolean,
  network: Network = getAptosNetwork()
): Promise<number> {
  try {
    const { Aptos, AptosConfig } = await import("@aptos-labs/ts-sdk");

    const aptos = new Aptos(new AptosConfig({
      network: network,
      fullnode: APTOS_FULLNODE_URL,
    }));

    // Convert amount to appropriate units
    const amountInOctas = aptToOctas(amountIn);

    // Query swap_math module for output calculation
    // Based on Hyperion docs: swap_math::get_amount_out(pool_address, amount_in, is_x_to_y)
    const result = await aptos.view({
      payload: {
        function: `${HYPERION_ADDRESSES.contract}::swap_math::get_amount_out`,
        typeArguments: [],
        functionArguments: [
          poolAddress,
          amountInOctas,
          isAptToToken, // is_x_to_y parameter
        ],
      },
    });

    if (result && result[0]) {
      return parseInt(result[0] as string);
    }

    return 0;
  } catch (error) {
    console.error("Failed to calculate swap output:", error);
    return 0;
  }
}

/**
 * Build create pool transaction payload for Hyperion DEX
 * Based on Hyperion documentation: factory::create_pool
 * @param tokenAddress - Token address (FA metadata)
 * @param initialAptReserve - Initial APT reserve amount
 * @param initialTokenReserve - Initial token reserve amount
 * @param fee - Pool fee (e.g., 3000 for 0.3%)
 * @returns Transaction payload
 */
export function buildCreatePoolPayload(
  tokenAddress: string,
  initialAptReserve: number,
  initialTokenReserve: number,
  fee: number = 3000 // 0.3% default fee
) {
  const aptReserveOctas = aptToOctas(initialAptReserve);
  const tokenReserveBase = tokensToBaseUnits(initialTokenReserve, 8); // Assuming 8 decimals

  // Based on Hyperion docs: factory::create_pool(token_x_type, token_y_type, fee, initial_x, initial_y)
  return {
    function: `${HYPERION_ADDRESSES.factory}::factory::create_pool` as `${string}::${string}::${string}`,
    typeArguments: [
      "0x1::aptos_coin::AptosCoin", // token_x_type (APT)
      "0x1::fungible_asset::FungibleAsset", // token_y_type (Token)
    ],
    functionArguments: [
      tokenAddress, // token_y_address
      fee, // fee
      aptReserveOctas, // initial_x (APT)
      tokenReserveBase, // initial_y (Token)
    ],
  };
}

// ============================================================================
// TRANSACTION BUILDERS
// ============================================================================

/**
 * Build swap APT for token transaction payload
 * Based on Hyperion documentation: router_v3::swap_exact_input
 * @param poolAddress - Hyperion pool address
 * @param aptAmount - Amount of APT to swap
 * @param minTokensOut - Minimum tokens to receive (slippage protection)
 * @param deadlineMinutes - Deadline in minutes from now
 * @returns Transaction payload
 */
export function buildSwapAptForTokenPayload(
  poolAddress: string,
  aptAmount: number,
  minTokensOut: number = 0,
  deadlineMinutes: number = 5
) {
  const aptAmountOctas = aptToOctas(aptAmount);
  const deadline = Math.floor(Date.now() / 1000) + (deadlineMinutes * 60);

  // Based on Hyperion docs: router_v3::swap_exact_input(pool_address, amount_in, min_amount_out, deadline)
  return {
    function: `${HYPERION_ADDRESSES.router}::router_v3::swap_exact_input` as `${string}::${string}::${string}`,
    typeArguments: [
      "0x1::aptos_coin::AptosCoin", // APT type
      "0x1::fungible_asset::FungibleAsset", // Token type (generic FA)
    ],
    functionArguments: [
      poolAddress,
      aptAmountOctas,
      minTokensOut,
      deadline
    ],
  };
}

/**
 * Build swap token for APT transaction payload
 * Based on Hyperion documentation: router_v3::swap_exact_input
 * @param poolAddress - Hyperion pool address
 * @param tokenAmount - Amount of tokens to swap
 * @param decimals - Token decimals
 * @param minAptOut - Minimum APT to receive (slippage protection)
 * @param deadlineMinutes - Deadline in minutes from now
 * @returns Transaction payload
 */
export function buildSwapTokenForAptPayload(
  poolAddress: string,
  tokenAmount: number,
  decimals: number = 8,
  minAptOut: number = 0,
  deadlineMinutes: number = 5
) {
  const tokenAmountBase = tokensToBaseUnits(tokenAmount, decimals);
  const minAptOutOctas = aptToOctas(minAptOut);
  const deadline = Math.floor(Date.now() / 1000) + (deadlineMinutes * 60);

  // Based on Hyperion docs: router_v3::swap_exact_input(pool_address, amount_in, min_amount_out, deadline)
  return {
    function: `${HYPERION_ADDRESSES.router}::router_v3::swap_exact_input` as `${string}::${string}::${string}`,
    typeArguments: [
      "0x1::fungible_asset::FungibleAsset", // Token type (generic FA)
      "0x1::aptos_coin::AptosCoin", // APT type
    ],
    functionArguments: [
      poolAddress,
      tokenAmountBase,
      minAptOutOctas,
      deadline
    ],
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get Hyperion DEX URL for a pool
 * Based on Hyperion documentation: https://app.hyperion.xyz
 * @param poolAddress - Hyperion pool address
 * @returns URL to Hyperion DEX pool page
 */
export function getHyperionPoolUrl(poolAddress: string): string {
  // Based on Hyperion docs: https://app.hyperion.xyz/pool/{pool_address}
  return `https://app.hyperion.xyz/pool/${poolAddress}`;
}

/**
 * Check if Hyperion DEX is available for this network
 * Based on Hyperion documentation: Available on Devnet, Testnet, and Mainnet
 * @param network - Network to check
 * @returns True if Hyperion is deployed on this network
 */
export function isHyperionAvailable(network: Network): boolean {
  // Based on Hyperion docs: Available on all Aptos networks
  return network === Network.DEVNET || network === Network.TESTNET || network === Network.MAINNET;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // View functions
  getHyperionPoolInfo,
  calculateSwapOutput,

  // Transaction builders
  buildCreatePoolPayload,
  buildSwapAptForTokenPayload,
  buildSwapTokenForAptPayload,

  // Helper functions
  getHyperionPoolUrl,
  isHyperionAvailable,

  // Constants
  HYPERION_ADDRESSES,
};


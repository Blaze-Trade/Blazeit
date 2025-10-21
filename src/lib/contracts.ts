import { getNetworkName } from "./constants";

// Contract configuration and addresses
const CONTRACT_CONFIG = {
  // Network configuration
  network: getNetworkName(),

  // Contract addresses
  addresses: {
    // V1 (DEPRECATED - use V2 for new tokens)
    blazeTokenLaunchpadV1: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,

    // V2 - Bancor bonding curve with Hyperion DEX migration
    blazeTokenLaunchpadV2: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,

    // Hyperion DEX - Aptos native DEX
    hyperionRouter:
      "0x69faed94da99abb7316cb3ec2eeaa1b961a47349fad8c584f67a930b0d14fec7",
    hyperionFactory:
      "0x69faed94da99abb7316cb3ec2eeaa1b961a47349fad8c584f67a930b0d14fec7",
  },

  // Contract module names
  modules: {
    launchpadV1: "blaze_token_launchpad::launchpad",
    launchpadV2: "blaze_token_launchpad::launchpad_v2",
  },

  // Gas configuration
  gas: {
    defaultGasUnitPrice: 100,
    maxGasAmount: 100000,
  },

  // V2 Configuration
  v2: {
    defaultReserveRatio: 50, // 50% Bancor reserve ratio
    defaultInitialReserve: 0.1, // 0.1 APT
    defaultMarketCapThreshold: 75000, // $75,000 USD
    defaultDecimals: 8,
  },

  // Quest configuration
  quest: {
    maxParticipants: 100,
    minEntryFee: 1000000, // 0.001 APT
    maxEntryFee: 100000000, // 0.1 APT
  },
} as const;

// Contract function signatures for the launchpad
export const CONTRACT_FUNCTIONS = {
  // V1 Launchpad (DEPRECATED)
  launchpadV1: {
    createToken: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV1}::launchpad::create_token`,
    getTokenInfo: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV1}::launchpad::get_token_info`,
    createQuest: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV1}::launchpad::create_quest`,
    joinQuest: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV1}::launchpad::join_quest`,
    getQuestInfo: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV1}::launchpad::get_quest_info`,
    hasJoinedQuest: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV1}::launchpad::has_joined_quest`,
    buyToken: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV1}::launchpad::buy_token`,
    sellToken: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV1}::launchpad::sell_token`,
    getPortfolioInfo: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV1}::launchpad::get_portfolio`,
  },

  // V2 Launchpad (CURRENT - Bancor + Hyperion)
  launchpadV2: {
    // Pool management
    createPool: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV2}::launchpad_v2::create_pool`,
    getPools: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV2}::launchpad_v2::get_pools`,
    getPool: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV2}::launchpad_v2::get_pool`,

    // Trading (bonding curve)
    buy: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV2}::launchpad_v2::buy`,
    sell: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV2}::launchpad_v2::sell`,

    // View functions
    getCurrentPrice: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV2}::launchpad_v2::get_current_price`,
    getCurrentSupply: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV2}::launchpad_v2::get_current_supply`,
    getPoolBalance: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV2}::launchpad_v2::get_pool_balance`,
    calculateMarketCapUsd: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV2}::launchpad_v2::calculate_market_cap_usd`,
    isMigrationThresholdReached: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV2}::launchpad_v2::is_migration_threshold_reached`,
    calculatePurchaseReturn: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV2}::launchpad_v2::calculate_curved_mint_return`,
    calculateSaleReturn: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV2}::launchpad_v2::calculate_curved_burn_return`,
    getAllTokens: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV2}::launchpad_v2::get_tokens`,
    getAptUsdPrice: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV2}::launchpad_v2::get_apt_usd_price`,

    // Admin functions
    setAdmin: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV2}::launchpad_v2::set_admin`,
    setTreasury: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV2}::launchpad_v2::set_treasury`,
    updateFee: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV2}::launchpad_v2::update_fee`,
    updateOraclePrice: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV2}::launchpad_v2::update_oracle_price`,
    forceMigrate: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV2}::launchpad_v2::force_migrate_to_hyperion`,
  },

  // For backward compatibility, keep old launchpad reference pointing to V1
  launchpad: {
    createToken: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV1}::launchpad::create_token`,
    getTokenInfo: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV1}::launchpad::get_token_info`,
    createQuest: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV1}::launchpad::create_quest`,
    joinQuest: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV1}::launchpad::join_quest`,
    getQuestInfo: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV1}::launchpad::get_quest_info`,
    hasJoinedQuest: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV1}::launchpad::has_joined_quest`,
    buyToken: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV1}::launchpad::buy_token`,
    sellToken: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV1}::launchpad::sell_token`,
    getPortfolioInfo: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpadV1}::launchpad::get_portfolio`,
  },
} as const;

// Type definitions for contract interactions
export interface TokenCreationParams {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  decimals: number;
}

export interface QuestCreationParams {
  name: string;
  description: string;
  entryFee: number;
  prizePool: number;
  startTime: number;
  endTime: number;
  maxParticipants: number;
}

export interface TokenTradeParams {
  questId: string;
  tokenAddress: string;
  symbol: string;
  quantity: number;
  cost: number;
}

// Helper functions for contract interactions
export const createTransactionPayload = (
  functionName: string,
  typeArguments: string[] = [],
  functionArguments: any[] = []
) => ({
  function: functionName,
  typeArguments,
  functionArguments,
});

// Export configuration
export { CONTRACT_CONFIG };

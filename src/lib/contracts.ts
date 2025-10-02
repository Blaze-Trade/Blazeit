// Contract configuration and addresses
export const CONTRACT_CONFIG = {
  // Network configuration
  network: process.env.NODE_ENV === "production" ? "mainnet" : "devnet",

  // Contract addresses - using the deployed blaze-contracts
  addresses: {
    blazeTokenLaunchpad:
      "0x5fb97dfeb76077901d88b70f6f02f9f164e83828cc173998f52d019777aa931a",
  },

  // Contract module names
  modules: {
    launchpad: "blaze_token_launchpad::launchpad",
  },

  // Gas configuration
  gas: {
    defaultGasUnitPrice: 100,
    maxGasAmount: 100000,
  },

  // Token creation fee (in octas)
  tokenCreationFee: 100000000, // 0.1 APT

  // Quest configuration
  quest: {
    maxParticipants: 100,
    minEntryFee: 1000000, // 0.001 APT
    maxEntryFee: 100000000, // 0.1 APT
  },
} as const;

// Contract function signatures for the launchpad
export const CONTRACT_FUNCTIONS = {
  // Launchpad functions
  launchpad: {
    // Token functions
    createToken: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpad}::launchpad::create_token`,
    getTokenInfo: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpad}::launchpad::get_token_info`,

    // Quest functions
    createQuest: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpad}::launchpad::create_quest`,
    joinQuest: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpad}::launchpad::join_quest`,
    getQuestInfo: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpad}::launchpad::get_quest_info`,
    hasJoinedQuest: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpad}::launchpad::has_joined_quest`,

    // Trading functions
    buyToken: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpad}::launchpad::buy_token`,
    sellToken: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpad}::launchpad::sell_token`,
    getPortfolioInfo: `${CONTRACT_CONFIG.addresses.blazeTokenLaunchpad}::launchpad::get_portfolio`,
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

export const formatAptAmount = (amount: number): string => {
  return (amount / 100000000).toFixed(8); // Convert octas to APT
};

export const parseAptAmount = (amount: string): number => {
  return Math.floor(parseFloat(amount) * 100000000); // Convert APT to octas
};

// Contract state queries
export const CONTRACT_QUERIES = {
  // Token queries
  getTokenInfo: async (client: any, symbol: string) => {
    try {
      const payload = createTransactionPayload(
        CONTRACT_FUNCTIONS.launchpad.getTokenInfo,
        [],
        [symbol]
      );
      return await client.view(payload);
    } catch (error) {
      console.error("Error fetching token info:", error);
      return null;
    }
  },

  // Quest queries
  getQuestInfo: async (client: any, questId: string) => {
    try {
      const payload = createTransactionPayload(
        CONTRACT_FUNCTIONS.launchpad.getQuestInfo,
        [],
        [questId]
      );
      return await client.view(payload);
    } catch (error) {
      console.error("Error fetching quest info:", error);
      return null;
    }
  },

  // Portfolio queries
  getPortfolioInfo: async (
    client: any,
    questId: string,
    participant: string
  ) => {
    try {
      const payload = createTransactionPayload(
        CONTRACT_FUNCTIONS.launchpad.getPortfolioInfo,
        [],
        [questId, participant]
      );
      return await client.view(payload);
    } catch (error) {
      console.error("Error fetching portfolio info:", error);
      return null;
    }
  },
} as const;

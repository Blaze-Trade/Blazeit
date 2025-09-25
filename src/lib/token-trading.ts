import { CONTRACT_FUNCTIONS } from "@/lib/contracts";
import { convertAmountFromHumanReadableToOnChain } from "@/lib/utils";
import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

export type BuyTokenArguments = {
  faObj: string; // The fungible asset object address
  amount: number; // Amount of tokens to buy
  decimals: number; // Token decimals
};

export const buyToken = (args: BuyTokenArguments): InputTransactionData => {
  const { faObj, amount, decimals } = args;
  return {
    data: {
      function: CONTRACT_FUNCTIONS.launchpad.buyToken,
      typeArguments: [],
      functionArguments: [
        faObj,
        convertAmountFromHumanReadableToOnChain(amount, decimals)
      ],
    },
  };
};

// Helper function to get token address from token object
export const getTokenAddress = (token: any): string => {
  // If token has an address field, use it
  if (token.address) {
    return token.address;
  }

  // Fallback to mock addresses for tokens without address
  const mockAddresses: Record<string, string> = {
    'APT': '0x1::aptos_coin::AptosCoin',
    'BTC': '0x1::bitcoin::Bitcoin',
    'ETH': '0x1::ethereum::Ethereum',
    'SUI': '0x1::sui::Sui',
    'SOL': '0x1::solana::Solana',
  };

  return mockAddresses[token.symbol] || `0x1::mock_${token.symbol.toLowerCase()}::MockToken`;
};

// Helper function to get token decimals
export const getTokenDecimals = (token: any): number => {
  // If token has decimals field, use it
  if (token.decimals !== undefined) {
    return token.decimals;
  }

  // Default decimals for common tokens
  const defaultDecimals: Record<string, number> = {
    'APT': 8,
    'BTC': 8,
    'ETH': 18,
    'SUI': 9,
    'SOL': 9,
  };

  return defaultDecimals[token.symbol] || 8; // Default to 8 decimals
};

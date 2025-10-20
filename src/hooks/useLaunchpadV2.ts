/**
 * React hook for Blaze Launchpad V2 integration
 * Provides convenient access to V2 contract functions with wallet adapter
 */

import {
    buildBuyPayload,
    buildCreatePoolPayload,
    buildMigrateToHyperionPayload,
    buildSellPayload,
    calculateMarketCapUsd,
    calculatePurchaseReturn,
    calculateSaleReturn,
    DEFAULT_NETWORK,
    getAllTokens,
    getAptUsdPrice,
    getCurrentPrice,
    getCurrentSupply,
    getPool,
    getPoolBalance,
    getPools,
    isMigrationThresholdReached,
    type CreatePoolParams,
    type PoolData,
    type TokenMetadata
} from "@/lib/blaze-sdk";
import { Network } from "@aptos-labs/ts-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: any;
}

export function useLaunchpadV2(network: Network = DEFAULT_NETWORK) {
  const { signAndSubmitTransaction, account } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  // Generic transaction executor
  const executeTransaction = useCallback(
    async (
      description: string,
      payload: any,
      successMessage?: string
    ): Promise<TransactionResult> => {
      if (!account) {
        toast.error("Please connect your wallet first");
        return { success: false, error: "No wallet connected" };
      }

      if (!signAndSubmitTransaction) {
        toast.error("Wallet not properly connected");
        return { success: false, error: "signAndSubmitTransaction not available" };
      }

      setIsLoading(true);
      const toastId = toast.loading(`Processing ${description}...`, {
        description: "Please approve the transaction in your wallet.",
      });

      try {
        const result = await signAndSubmitTransaction({
          data: payload,
        });

        toast.success(successMessage || `${description} successful!`, {
          id: toastId,
          description: `Transaction: ${result.hash.slice(0, 10)}...`,
        });

        return { success: true, hash: result.hash };
      } catch (error: any) {
        console.error(`${description} failed:`, error);

        const isUserRejection = error?.message?.includes("User rejected");

        toast.error(
          isUserRejection ? "Transaction rejected" : `${description} failed`,
          {
            id: toastId,
            description: isUserRejection
              ? "You cancelled the transaction."
              : error?.message || "Unknown error occurred",
          }
        );

        return { success: false, error };
      } finally {
        setIsLoading(false);
      }
    },
    [signAndSubmitTransaction, account]
  );

  // Create pool
  const createPool = useCallback(
    async (params: CreatePoolParams): Promise<TransactionResult> => {
      const payload = buildCreatePoolPayload(params);
      return executeTransaction(
        "Pool creation",
        payload,
        `Pool ${params.ticker} created successfully!`
      );
    },
    [executeTransaction]
  );

  // Buy tokens from bonding curve
  const buy = useCallback(
    async (
      poolId: string,
      aptAmount: number,
      minTokensOut: number = 0,
      deadlineMinutes: number = 5
    ): Promise<TransactionResult> => {
      const payload = buildBuyPayload(poolId, aptAmount, minTokensOut, deadlineMinutes);
      return executeTransaction(
        "Token purchase",
        payload,
        "Tokens purchased successfully!"
      );
    },
    [executeTransaction]
  );

  // Sell tokens to bonding curve
  const sell = useCallback(
    async (
      poolId: string,
      tokenAmount: number,
      decimals: number = 8,
      minAptOut: number = 0,
      deadlineMinutes: number = 5
    ): Promise<TransactionResult> => {
      const payload = buildSellPayload(poolId, tokenAmount, decimals, minAptOut, deadlineMinutes);
      return executeTransaction(
        "Token sale",
        payload,
        "Tokens sold successfully!"
      );
    },
    [executeTransaction]
  );

  // Migrate pool to Hyperion DEX
  const migrateToHyperion = useCallback(
    async (poolId: string): Promise<TransactionResult> => {
      const payload = buildMigrateToHyperionPayload(poolId);
      return executeTransaction(
        "Pool migration",
        payload,
        "Pool migrated to Hyperion DEX successfully!"
      );
    },
    [executeTransaction]
  );

  // View functions
  const fetchPools = useCallback(async () => {
    return getPools(network);
  }, [network]);

  const fetchPool = useCallback(
    async (poolId: string): Promise<PoolData | null> => {
      return getPool(poolId, network);
    },
    [network]
  );

  const fetchPoolBalance = useCallback(
    async (poolId: string): Promise<number> => {
      return getPoolBalance(poolId, network);
    },
    [network]
  );

  const fetchCurrentPrice = useCallback(
    async (poolId: string): Promise<number> => {
      return getCurrentPrice(poolId, network);
    },
    [network]
  );

  const fetchCurrentSupply = useCallback(
    async (poolId: string): Promise<bigint> => {
      return getCurrentSupply(poolId, network);
    },
    [network]
  );

  const fetchMarketCapUsd = useCallback(
    async (poolId: string): Promise<number> => {
      return calculateMarketCapUsd(poolId, network);
    },
    [network]
  );

  const checkMigrationThreshold = useCallback(
    async (poolId: string): Promise<boolean> => {
      return isMigrationThresholdReached(poolId, network);
    },
    [network]
  );

  const estimatePurchaseReturn = useCallback(
    async (poolId: string, aptAmount: number): Promise<number> => {
      return calculatePurchaseReturn(poolId, aptAmount, network);
    },
    [network]
  );

  const estimateSaleReturn = useCallback(
    async (poolId: string, tokenAmount: number, decimals: number = 8): Promise<number> => {
      return calculateSaleReturn(poolId, tokenAmount, decimals, network);
    },
    [network]
  );

  const fetchAllTokens = useCallback(async (): Promise<TokenMetadata[]> => {
    return getAllTokens(network);
  }, [network]);

  const fetchAptUsdPrice = useCallback(async (): Promise<number> => {
    return getAptUsdPrice(network);
  }, [network]);

  return {
    // State
    isLoading,

    // Transaction functions
    createPool,
    buy,
    sell,
    migrateToHyperion,

    // View functions
    fetchPools,
    fetchPool,
    fetchPoolBalance,
    fetchCurrentPrice,
    fetchCurrentSupply,
    fetchMarketCapUsd,
    checkMigrationThreshold,
    estimatePurchaseReturn,
    estimateSaleReturn,
    fetchAllTokens,
    fetchAptUsdPrice,

    // Network
    network,
  };
}


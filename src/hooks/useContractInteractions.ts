import { useState, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { toast } from 'sonner';
import {
  CONTRACT_CONFIG,
  CONTRACT_FUNCTIONS,
  createTransactionPayload,
  formatAptAmount,
  parseAptAmount,
  type TokenCreationParams,
  type QuestCreationParams,
  type TokenTradeParams,
} from "@/lib/contracts";

// Enhanced Aptos client singleton
let aptosSingleton: any | null = null;
async function getAptosClient() {
  if (aptosSingleton) return aptosSingleton;
  const mod = await import("@aptos-labs/ts-sdk");

  const config = {
    network: CONTRACT_CONFIG.network,
    fullnode:
      CONTRACT_CONFIG.network === "mainnet"
        ? "https://fullnode.mainnet.aptoslabs.com"
        : "https://fullnode.devnet.aptoslabs.com",
  };

  aptosSingleton = new mod.Aptos(config);
  return aptosSingleton;
}

export function useContractInteractions() {
  const { signAndSubmitTransaction, account } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  // Generic transaction handler
  const executeTransaction = useCallback(
    async (description: string, payload: any, successMessage?: string) => {
      if (!account) {
        toast.error("Please connect your wallet first");
        return { success: false, error: "No wallet connected" };
      }

      setIsLoading(true);
      const toastId = toast.loading(`Processing ${description}...`, {
        description: "Please approve the transaction in your wallet.",
      });

      try {
        const result = await signAndSubmitTransaction(payload);
        const client = await getAptosClient();
        await client.waitForTransaction({ transactionHash: result.hash });

        toast.success(successMessage || `${description} successful!`, {
          id: toastId,
          description: `Transaction: ${result.hash.slice(0, 10)}...`,
        });

        return { success: true, hash: result.hash };
      } catch (error: any) {
        const isUserRejection = error.message?.includes(
          "User rejected the request"
        );
        console.error(`${description} failed:`, error);

        toast.error(
          isUserRejection ? "Transaction rejected" : `${description} failed`,
          {
            id: toastId,
            description: isUserRejection
              ? "You cancelled the transaction."
              : error?.message || "Please try again.",
          }
        );

        return { success: false, error };
      } finally {
        setIsLoading(false);
      }
    },
    [signAndSubmitTransaction, account]
  );

  // Token creation functions
  const createToken = useCallback(
    async (params: TokenCreationParams) => {
      const payload = createTransactionPayload(
        CONTRACT_FUNCTIONS.launchpad.createToken,
        [],
        [
          params.name,
          params.symbol,
          params.description,
          params.imageUrl,
          params.decimals,
        ]
      );

      return executeTransaction(
        "Token creation",
        payload,
        "Token created successfully!"
      );
    },
    [executeTransaction]
  );

  // Quest management functions
  const createQuest = useCallback(
    async (params: QuestCreationParams) => {
      const payload = createTransactionPayload(
        CONTRACT_FUNCTIONS.launchpad.createQuest,
        [],
        [
          params.name,
          params.description,
          parseAptAmount(params.entryFee.toString()),
          parseAptAmount(params.prizePool.toString()),
          Math.floor(params.startTime / 1000), // Convert to seconds
          Math.floor(params.endTime / 1000), // Convert to seconds
          params.maxParticipants,
        ]
      );

      return executeTransaction(
        "Quest creation",
        payload,
        "Quest created successfully!"
      );
    },
    [executeTransaction]
  );

  const joinQuest = useCallback(
    async (questId: string) => {
      const payload = createTransactionPayload(
        CONTRACT_FUNCTIONS.launchpad.joinQuest,
        [],
        [questId]
      );

      return executeTransaction(
        "Quest join",
        payload,
        "Successfully joined the quest!"
      );
    },
    [executeTransaction]
  );

  const endQuest = useCallback(
    async (questId: string, winner: string) => {
      const payload = createTransactionPayload(
        CONTRACT_FUNCTIONS.launchpad.endQuest,
        [],
        [questId, winner]
      );

      return executeTransaction(
        "Quest end",
        payload,
        "Quest ended successfully!"
      );
    },
    [executeTransaction]
  );

  // Portfolio trading functions
  const initializePortfolio = useCallback(
    async (questId: string, participant: string, initialBalance: number) => {
      const payload = createTransactionPayload(
        CONTRACT_FUNCTIONS.launchpad.initializePortfolio,
        [],
        [questId, participant, parseAptAmount(initialBalance.toString())]
      );

      return executeTransaction(
        "Portfolio initialization",
        payload,
        "Portfolio initialized successfully!"
      );
    },
    [executeTransaction]
  );

  const buyToken = useCallback(
    async (params: TokenTradeParams) => {
      const payload = createTransactionPayload(
        CONTRACT_FUNCTIONS.launchpad.buyToken,
        [],
        [
          "0x0bdb81a0137733aad37c06fa51a5936ffa4a8c57bde190c5174c66afc2725bb",
          "1",
        ]
      );

      return executeTransaction(
        "Token purchase",
        payload,
        "Token purchased successfully!"
      );
    },
    [executeTransaction]
  );

  const sellToken = useCallback(
    async (
      questId: string,
      tokenAddress: string,
      quantity: number,
      proceeds: number
    ) => {
      const payload = createTransactionPayload(
        CONTRACT_FUNCTIONS.launchpad.sellToken,
        [],
        [questId, tokenAddress, quantity, parseAptAmount(proceeds.toString())]
      );

      return executeTransaction(
        "Token sale",
        payload,
        "Token sold successfully!"
      );
    },
    [executeTransaction]
  );

  // View functions (read-only)
  const getTokenAddress = useCallback(async (symbol: string) => {
    try {
      const client = await getAptosClient();
      const payload = createTransactionPayload(
        CONTRACT_FUNCTIONS.launchpad.getTokenAddress,
        [],
        [symbol]
      );
      return await client.view(payload);
    } catch (error) {
      console.error("Error fetching token address:", error);
      return null;
    }
  }, []);

  const getTokenMetadata = useCallback(async (tokenAddress: string) => {
    try {
      const client = await getAptosClient();
      const payload = createTransactionPayload(
        CONTRACT_FUNCTIONS.launchpad.getTokenMetadata,
        [],
        [tokenAddress]
      );
      return await client.view(payload);
    } catch (error) {
      console.error("Error fetching token metadata:", error);
      return null;
    }
  }, []);

  const getQuestInfo = useCallback(async (questId: string) => {
    try {
      const client = await getAptosClient();
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
  }, []);

  const hasJoinedQuest = useCallback(
    async (questId: string, participant: string) => {
      try {
        const client = await getAptosClient();
        const payload = createTransactionPayload(
          CONTRACT_FUNCTIONS.launchpad.hasJoinedQuest,
          [],
          [questId, participant]
        );
        return await client.view(payload);
      } catch (error) {
        console.error("Error checking quest participation:", error);
        return false;
      }
    },
    []
  );

  const getPortfolioInfo = useCallback(
    async (questId: string, participant: string) => {
      try {
        const client = await getAptosClient();
        const payload = createTransactionPayload(
          CONTRACT_FUNCTIONS.launchpad.getPortfolio,
          [],
          [questId, participant]
        );
        return await client.view(payload);
      } catch (error) {
        console.error("Error fetching portfolio info:", error);
        return null;
      }
    },
    []
  );

  const getTokenHolding = useCallback(
    async (questId: string, participant: string, tokenAddress: string) => {
      try {
        const client = await getAptosClient();
        const payload = createTransactionPayload(
          CONTRACT_FUNCTIONS.launchpad.getTokenHolding,
          [],
          [questId, participant, tokenAddress]
        );
        return await client.view(payload);
      } catch (error) {
        console.error("Error fetching token holding:", error);
        return null;
      }
    },
    []
  );

  return {
    // State
    isLoading,

    // Token functions
    createToken,
    getTokenAddress,
    getTokenMetadata,

    // Quest functions
    createQuest,
    joinQuest,
    endQuest,
    getQuestInfo,
    hasJoinedQuest,

    // Portfolio functions
    initializePortfolio,
    buyToken,
    sellToken,
    getPortfolioInfo,
    getTokenHolding,

    // Utility functions
    formatAptAmount,
    parseAptAmount,
  };
}

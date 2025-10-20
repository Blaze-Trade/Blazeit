import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

// Aptos client singleton
let aptosSingleton: any | null = null;
async function getAptosClient() {
  if (aptosSingleton) return aptosSingleton;
  const mod = await import("@aptos-labs/ts-sdk");
  const config = new mod.AptosConfig({ network: mod.Network.DEVNET });
  aptosSingleton = new mod.Aptos(config);
  return aptosSingleton;
}

// Quest module configuration
// NOTE: Devnet resets periodically, so you'll need to redeploy your contract
// After redeploying, update the NEXT_PUBLIC_QUEST_MODULE_ADDRESS in your .env file
const QUEST_MODULE_ADDRESS =
  process.env.NEXT_PUBLIC_QUEST_MODULE_ADDRESS ||
  "0x5fb97dfeb76077901d88b70f6f02f9f164e83828cc173998f52d019777aa931a"; // Your last known address

// Log warning if using default address
if (!process.env.NEXT_PUBLIC_QUEST_MODULE_ADDRESS) {
  console.warn(
    "⚠️ Using default QUEST_MODULE_ADDRESS. This may not work if devnet was reset.\n" +
      "To fix:\n" +
      "1. Redeploy your quest_staking contract to devnet\n" +
      "2. Create .env file with: NEXT_PUBLIC_QUEST_MODULE_ADDRESS=<your-new-address>\n" +
      "3. Restart your dev server"
  );
}

// APT has 8 decimals (octas)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const APT_DECIMALS = 8;
const OCTAS_PER_APT = 100000000; // 10^8

/**
 * Convert APT to Octas (blockchain unit)
 * Example: 10 APT = 1000000000 octas
 */
function aptToOctas(apt: number): string {
  return Math.floor(apt * OCTAS_PER_APT).toString();
}

/**
 * Convert Octas to APT (human readable)
 */
function octasToApt(octas: string | number): number {
  return Number(octas) / OCTAS_PER_APT;
}

/**
 * Hook for interacting with Quest Staking smart contract
 */
export function useQuestStaking() {
  const wallet = useWallet();
  const { signAndSubmitTransaction, account } = wallet;
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Generic transaction executor with proper error handling
   */
  const executeTransaction = useCallback(
    async (description: string, payload: any, successMessage?: string) => {
      if (!account) {
        toast.error("Please connect your wallet first");
        return { success: false, error: "No wallet connected" };
      }

      if (!signAndSubmitTransaction) {
        toast.error("Wallet not properly connected");
        return {
          success: false,
          error: "signAndSubmitTransaction not available",
        };
      }

      setIsLoading(true);
      const toastId = toast.loading(`Processing ${description}...`, {
        description: "Please approve the transaction in your wallet.",
      });

      try {
        const client = await getAptosClient();

        // Build wallet payload
        const walletPayload = {
          data: {
            function: payload.function as `${string}::${string}::${string}`,
            typeArguments: payload.typeArguments || [],
            functionArguments: payload.functionArguments,
          },
        };

        console.log("Executing transaction:", {
          function: payload.function,
          args: payload.functionArguments,
        });

        // Submit transaction
        const result = await signAndSubmitTransaction(walletPayload);

        // Wait for confirmation
        await client.waitForTransaction({ transactionHash: result.hash });

        toast.success(successMessage || `${description} successful!`, {
          id: toastId,
          description: `Transaction: ${result.hash.slice(0, 10)}...`,
        });

        return { success: true, hash: result.hash, result };
      } catch (error: any) {
        console.error(`${description} failed:`, error);

        const isUserRejection = error?.message?.includes("User rejected");
        const errorMessage = isUserRejection
          ? "You cancelled the transaction"
          : error?.message || "Transaction failed";

        toast.error(
          isUserRejection ? "Transaction rejected" : `${description} failed`,
          {
            id: toastId,
            description: errorMessage,
          }
        );

        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [signAndSubmitTransaction, account]
  );

  /**
   * Create a new quest on the blockchain
   *
   * @param name - Quest name
   * @param entryFeeAPT - Entry fee in APT (e.g., 10 APT)
   * @param buyInHours - Hours until quest starts (buy-in period)
   * @param resultHours - Hours until quest ends (total duration)
   */
  const createQuest = useCallback(
    async (params: {
      name: string;
      entryFeeAPT: number;
      buyInHours: number;
      resultHours: number;
    }) => {
      const { name, entryFeeAPT, buyInHours, resultHours } = params;

      // Convert APT to octas for entry fee
      const entryFeeOctas = aptToOctas(entryFeeAPT);

      // Convert hours to seconds for blockchain timestamps
      const buyInSeconds = Math.floor(buyInHours * 3600);
      const resultSeconds = Math.floor(resultHours * 3600);

      const payload = {
        function: `${QUEST_MODULE_ADDRESS}::quest_staking::create_quest`,
        typeArguments: [],
        functionArguments: [
          name,
          entryFeeOctas,
          buyInSeconds.toString(),
          resultSeconds.toString(),
        ],
      };

      return executeTransaction(
        "Quest creation",
        payload,
        `Quest "${name}" created successfully!`
      );
    },
    [executeTransaction]
  );

  /**
   * Join an existing quest by paying the entry fee
   *
   * @param questId - Blockchain quest ID (u64)
   */
  const joinQuest = useCallback(
    async (questId: number) => {
      const payload = {
        function: `${QUEST_MODULE_ADDRESS}::quest_staking::join_quest`,
        typeArguments: [],
        functionArguments: [questId.toString()],
      };

      return executeTransaction(
        "Joining quest",
        payload,
        "Successfully joined the quest!"
      );
    },
    [executeTransaction]
  );

  /**
   * Select portfolio for a quest
   * Must select 1-5 tokens (as per smart contract)
   *
   * @param questId - Blockchain quest ID
   * @param tokenAddresses - Array of token contract addresses
   * @param amountsUSDC - Array of investment amounts in USDC (6 decimals)
   */
  const selectPortfolio = useCallback(
    async (params: {
      questId: number;
      tokenAddresses: string[];
      amountsUSDC: string[];
    }) => {
      const { questId, tokenAddresses, amountsUSDC } = params;

      // Validate portfolio size (1-5 tokens as per smart contract)
      if (tokenAddresses.length < 1 || tokenAddresses.length > 5) {
        toast.error("You must select between 1 and 5 tokens");
        return { success: false, error: "Invalid portfolio size" };
      }

      if (tokenAddresses.length !== amountsUSDC.length) {
        toast.error("Token addresses and amounts must match");
        return { success: false, error: "Mismatched arrays" };
      }

      const payload = {
        function: `${QUEST_MODULE_ADDRESS}::quest_staking::select_portfolio`,
        typeArguments: [],
        functionArguments: [questId.toString(), tokenAddresses, amountsUSDC],
      };

      return executeTransaction(
        "Portfolio selection",
        payload,
        "Portfolio submitted successfully!"
      );
    },
    [executeTransaction]
  );

  /**
   * Declare winner for a quest (admin only)
   *
   * @param questId - Blockchain quest ID
   * @param winnerAddress - Winner's wallet address
   */
  const declareWinner = useCallback(
    async (questId: number, winnerAddress: string) => {
      const payload = {
        function: `${QUEST_MODULE_ADDRESS}::quest_staking::declare_winner`,
        typeArguments: [],
        functionArguments: [questId.toString(), winnerAddress],
      };

      return executeTransaction(
        "Declaring winner",
        payload,
        "Winner declared and rewards distributed!"
      );
    },
    [executeTransaction]
  );

  // ============= VIEW FUNCTIONS (READ-ONLY) ============= //

  /**
   * Get quest information from blockchain
   */
  const getQuestInfo = useCallback(async (questId: number) => {
    try {
      const client = await getAptosClient();
      const result = await client.view({
        payload: {
          function: `${QUEST_MODULE_ADDRESS}::quest_staking::get_quest_info`,
          typeArguments: [],
          functionArguments: [questId.toString()],
        },
      });

      console.log("Quest info from blockchain:", result);
      return { success: true, data: result };
    } catch (error: any) {
      console.error("Error fetching quest info:", error);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Get user's participation details for a quest
   */
  const getUserParticipation = useCallback(
    async (userAddress: string, questId: number) => {
      try {
        const client = await getAptosClient();
        const result = await client.view({
          payload: {
            function: `${QUEST_MODULE_ADDRESS}::quest_staking::get_user_participation`,
            typeArguments: [],
            functionArguments: [userAddress, questId.toString()],
          },
        });

        console.log("User participation:", result);
        return { success: true, data: result };
      } catch (error: any) {
        console.error("Error fetching user participation:", error);
        return { success: false, error: error.message };
      }
    },
    []
  );

  /**
   * Check if user has participated in a quest
   */
  const hasUserParticipated = useCallback(
    async (userAddress: string, questId: number) => {
      try {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🔍 [useQuestStaking] Checking participation:");
        console.log(
          "   Function:",
          `${QUEST_MODULE_ADDRESS}::quest_staking::has_user_participated`
        );
        console.log("   User Address:", userAddress);
        console.log("   Quest ID:", questId);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        const client = await getAptosClient();
        const result = await client.view({
          payload: {
            function: `${QUEST_MODULE_ADDRESS}::quest_staking::has_user_participated`,
            typeArguments: [],
            functionArguments: [userAddress, questId.toString()],
          },
        });

        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📊 [useQuestStaking] Participation check raw result:");
        console.log("   Full result:", result);
        console.log("   result[0]:", result[0]);
        console.log("   Type:", typeof result[0]);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        return { success: true, hasParticipated: result[0] as boolean };
      } catch (error: any) {
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("❌ [useQuestStaking] Error checking participation:");
        console.error("   Error:", error);
        console.error("   Message:", error.message);
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        return { success: false, hasParticipated: false };
      }
    },
    []
  );

  /**
   * Get all quests from blockchain
   */
  const getAllQuests = useCallback(async () => {
    try {
      const client = await getAptosClient();
      const result = await client.view({
        payload: {
          function: `${QUEST_MODULE_ADDRESS}::quest_staking::get_all_quests`,
          typeArguments: [],
          functionArguments: [],
        },
      });

      console.log("All quests from blockchain:", result);
      return { success: true, data: result };
    } catch (error: any) {
      console.error("Error fetching all quests:", error);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Get participants for a quest
   */
  const getQuestParticipants = useCallback(async (questId: number) => {
    try {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("👥 [useQuestStaking] Fetching participants:");
      console.log(
        "   Function:",
        `${QUEST_MODULE_ADDRESS}::quest_staking::get_quest_participants`
      );
      console.log("   Quest ID:", questId);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      const client = await getAptosClient();
      const result = await client.view({
        payload: {
          function: `${QUEST_MODULE_ADDRESS}::quest_staking::get_quest_participants`,
          typeArguments: [],
          functionArguments: [questId.toString()],
        },
      });

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("👥 [useQuestStaking] Participants result:");
      console.log("   Full result:", result);
      console.log("   result[0]:", result[0]);
      console.log("   Type:", typeof result[0]);
      console.log("   Is Array:", Array.isArray(result[0]));
      console.log("   Length:", result[0]?.length);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      return { success: true, data: result[0] as string[] };
    } catch (error: any) {
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("❌ [useQuestStaking] Error fetching participants:");
      console.error("   Error:", error);
      console.error("   Message:", error.message);
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      return { success: false, error: error.message, data: [] };
    }
  }, []);

  return {
    // State
    isLoading,

    // Write functions (transactions)
    createQuest,
    joinQuest,
    selectPortfolio,
    declareWinner,

    // Read functions (views)
    getQuestInfo,
    getUserParticipation,
    hasUserParticipated,
    getAllQuests,
    getQuestParticipants,

    // Utility functions
    aptToOctas,
    octasToApt,
    getAptosClient,

    // Contract address
    contractAddress: QUEST_MODULE_ADDRESS,
  };
}



import {
  APT_DECIMALS,
  convertAmountFromHumanReadableToOnChain,
} from "@/lib/utils";
import {
  InputTransactionData,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

// Enhanced Aptos client singleton
let aptosSingleton: any | null = null;
async function getAptosClient() {
  if (aptosSingleton) return aptosSingleton;
  const mod = await import("@aptos-labs/ts-sdk");

  const config = new mod.AptosConfig({
    network: mod.Network.DEVNET,
  });

  aptosSingleton = new mod.Aptos(config);
  return aptosSingleton;
}

// Contract configuration
const LAUNCHPAD_ADDRESS =
  "0x5fb97dfeb76077901d88b70f6f02f9f164e83828cc173998f52d019777aa931a";

// Type definitions matching the reference implementation
export type CreateTokenArguments = {
  maxSupply: number; // The total amount of the asset in full unit that can be minted.
  name: string; // The name of the asset
  symbol: string; // The symbol of the asset
  decimal: number; // How many 0's constitute one full unit of the asset. For example, APT has 8.
  iconURL: string; // The asset icon URL
  projectURL: string; // Your project URL (i.e https://mydomain.com)
  targetSupply: number; // Target supply for bonding curve
  virtualLiquidity: number; // Virtual liquidity for bonding curve (in APT)
  curveExponent: number; // Curve exponent for bonding curve (typically 2)
  maxMintPerAccount?: number; // The maximum amount in full unit that any single individual address can mint
};

export function useLaunchpadIntegration() {
  const wallet = useWallet();
  const { signAndSubmitTransaction, account } = wallet;

  const [isLoading, setIsLoading] = useState(false);

  // Generic transaction handler
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
        // Validate payload before sending
        if (!payload || typeof payload !== "object") {
          throw new Error("Invalid payload: payload is not an object");
        }

        if (!payload.function) {
          throw new Error("Invalid payload: missing function field");
        }

        if (!Array.isArray(payload.arguments)) {
          throw new Error("Invalid payload: arguments is not an array");
        }
        const client = await getAptosClient();
        const processedArguments = payload.arguments.map((arg: any) => {
          // Ensure proper serialization for different data types
          if (typeof arg === "number") {
            // Convert numbers to strings for proper serialization
            return arg.toString();
          }
          return arg;
        });

        const walletPayload = {
          data: {
            function: payload.function,
            typeArguments: payload.typeArguments,
            functionArguments: processedArguments,
          },
        };

        // Use the wallet's signAndSubmitTransaction method
        const result = await signAndSubmitTransaction(walletPayload);
        await client.waitForTransaction({ transactionHash: result.hash });

        toast.success(successMessage || `${description} successful!`, {
          id: toastId,
          description: `Transaction: ${result.hash.slice(0, 10)}...`,
        });

        return { success: true, hash: result.hash };
      } catch (error: any) {
        console.error(`${description} failed:`, error);
        console.error("Error details:", {
          message: error?.message,
          stack: error?.stack,
          name: error?.name,
          payload: payload,
          errorType: typeof error,
          errorConstructor: error?.constructor?.name,
        });

        // Handle specific error types with improved debugging
        let errorMessage = error?.message || "Unknown error occurred";

        if (
          error?.message?.includes("Cannot convert") &&
          error?.message?.includes("BigInt")
        ) {
          errorMessage =
            "Argument type error: Check that all arguments are in the correct format and order for the contract function.";
        } else if (error?.message?.includes("Cannot use 'in' operator")) {
          errorMessage =
            "Wallet adapter error: Invalid transaction format. Please check your wallet connection.";
        } else if (error?.message?.includes("User rejected")) {
          errorMessage = "Transaction rejected by user";
        } else if (error?.message?.includes("ABI")) {
          errorMessage =
            "Contract ABI error: The function signature may not match the deployed contract.";
        } else if (!error?.message) {
          errorMessage = "Transaction failed with no error message";
        }

        const isUserRejection = error?.message?.includes(
          "User rejected the request"
        );

        toast.error(
          isUserRejection ? "Transaction rejected" : `${description} failed`,
          {
            id: toastId,
            description: isUserRejection
              ? "You cancelled the transaction."
              : errorMessage,
          }
        );

        return { success: false, error };
      } finally {
        setIsLoading(false);
      }
    },
    [signAndSubmitTransaction, account]
  );

  // Create token function matching the reference implementation exactly
  const createTokenPayload = (args: CreateTokenArguments) => {
    const {
      maxSupply,
      name,
      symbol,
      decimal,
      iconURL,
      projectURL,
      targetSupply,
      virtualLiquidity,
      curveExponent,
      maxMintPerAccount,
    } = args;

    // For Move Option<T> types when using functionArguments (modern SDK):
    // - Vector notation: pass raw values directly, SDK handles Option encoding
    // - The function signature in Move tells SDK which args are Option types
    return {
      type: "entry_function_payload",
      function: `${LAUNCHPAD_ADDRESS}::launchpad::create_token`,
      typeArguments: [],
      arguments: [
        convertAmountFromHumanReadableToOnChain(maxSupply, decimal), // max_supply: Option<u128>
        name, // name: String
        symbol, // symbol: String
        decimal, // decimals: u8
        iconURL, // icon_uri: String
        projectURL, // project_uri: String
        convertAmountFromHumanReadableToOnChain(targetSupply, decimal), // target_supply: u64
        convertAmountFromHumanReadableToOnChain(virtualLiquidity, APT_DECIMALS), // virtual_liquidity: u64
        curveExponent, // curve_exponent: u64
        maxMintPerAccount && maxMintPerAccount > 0
          ? convertAmountFromHumanReadableToOnChain(maxMintPerAccount, decimal)
          : null, // mint_limit_per_addr: Option<u64> - null = option::none() (no limit!)
      ],
    };
  };

  // Create token function for wallet adapter (returns InputTransactionData format)
  const createToken = (args: CreateTokenArguments): InputTransactionData => {
    const payload = createTokenPayload(args);
    return {
      data: {
        function: payload.function as `${string}::${string}::${string}`,
        typeArguments: payload.typeArguments,
        functionArguments: payload.arguments,
      },
    };
  };

  // Execute token creation transaction
  const executeCreateToken = useCallback(
    async (args: CreateTokenArguments) => {
      const payload = createTokenPayload(args);

      return executeTransaction(
        "Token creation",
        payload,
        "Token created successfully!"
      );
    },
    [executeTransaction]
  );

  // Quest creation function (assuming the launchpad has quest functionality)
  const createQuest = useCallback(
    async (questData: {
      name: string;
      description: string;
      entryFee: number;
      prizePool: number;
      startTime: number;
      endTime: number;
      maxParticipants: number;
    }) => {
      const payload = {
        type: "entry_function_payload",
        function: `${LAUNCHPAD_ADDRESS}::launchpad::create_quest`,
        typeArguments: [],
        arguments: [
          questData.name,
          questData.description,
          questData.entryFee,
          questData.prizePool,
          questData.startTime,
          questData.endTime,
          questData.maxParticipants,
        ],
      };

      return executeTransaction(
        "Quest creation",
        payload,
        "Quest created successfully!"
      );
    },
    [executeTransaction]
  );

  // Join quest function
  const joinQuest = useCallback(
    async (questId: string) => {
      const payload = {
        type: "entry_function_payload",
        function: `${LAUNCHPAD_ADDRESS}::launchpad::join_quest`,
        typeArguments: [],
        arguments: [questId],
      };

      return executeTransaction(
        "Quest join",
        payload,
        "Successfully joined the quest!"
      );
    },
    [executeTransaction]
  );

  // Buy token function (for trading within quests)
  const buyToken = useCallback(
    async (params: {
      questId: string;
      tokenAddress: string;
      symbol: string;
      quantity: number;
      cost: number;
    }) => {
      const payload = {
        type: "entry_function_payload",
        function: `${LAUNCHPAD_ADDRESS}::launchpad::buy_token`,
        typeArguments: [],
        arguments: [
          params.questId,
          params.tokenAddress,
          params.symbol,
          params.quantity,
          params.cost,
        ],
      };

      return executeTransaction(
        "Token purchase",
        payload,
        "Token purchased successfully!"
      );
    },
    [executeTransaction]
  );

  // Sell token function
  const sellToken = useCallback(
    async (
      questId: string,
      tokenAddress: string,
      quantity: number,
      proceeds: number
    ) => {
      const payload = {
        type: "entry_function_payload",
        function: `${LAUNCHPAD_ADDRESS}::launchpad::sell_token`,
        typeArguments: [],
        arguments: [questId, tokenAddress, quantity, proceeds],
      };

      return executeTransaction(
        "Token sale",
        payload,
        "Token sold successfully!"
      );
    },
    [executeTransaction]
  );

  // View functions (read-only)
  const getTokenInfo = useCallback(async (symbol: string) => {
    try {
      const client = await getAptosClient();
      const payload = {
        function: `${LAUNCHPAD_ADDRESS}::launchpad::get_token_info`,
        typeArguments: [],
        functionArguments: [symbol],
      };
      return await client.view(payload);
    } catch (error) {
      console.error("Error fetching token info:", error);
      return null;
    }
  }, []);

  const getQuestInfo = useCallback(async (questId: string) => {
    try {
      const client = await getAptosClient();
      const payload = {
        function: `${LAUNCHPAD_ADDRESS}::launchpad::get_quest_info`,
        typeArguments: [],
        functionArguments: [questId],
      };
      return await client.view(payload);
    } catch (error) {
      console.error("Error fetching quest info:", error);
      return null;
    }
  }, []);

  const getPortfolioInfo = useCallback(
    async (questId: string, participant: string) => {
      try {
        const client = await getAptosClient();
        const payload = {
          function: `${LAUNCHPAD_ADDRESS}::launchpad::get_portfolio`,
          typeArguments: [],
          functionArguments: [questId, participant],
        };
        return await client.view(payload);
      } catch (error) {
        console.error("Error fetching portfolio info:", error);
        return null;
      }
    },
    []
  );

  const hasJoinedQuest = useCallback(
    async (questId: string, participant: string) => {
      try {
        const client = await getAptosClient();
        const payload = {
          function: `${LAUNCHPAD_ADDRESS}::launchpad::has_joined_quest`,
          typeArguments: [],
          functionArguments: [questId, participant],
        };
        return await client.view(payload);
      } catch (error) {
        console.error("Error checking quest participation:", error);
        return false;
      }
    },
    []
  );

  const result = {
    // State
    isLoading,

    // Functions
    createToken,
    executeCreateToken,
    createQuest,
    joinQuest,
    buyToken,
    sellToken,

    // View functions
    getTokenInfo,
    getQuestInfo,
    getPortfolioInfo,
    hasJoinedQuest,

    // Contract address
    contractAddress: LAUNCHPAD_ADDRESS,
  };

  return result;
}

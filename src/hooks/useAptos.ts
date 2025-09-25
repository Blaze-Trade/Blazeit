import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { toast } from "sonner";

let aptosSingleton: any | null = null;
async function getAptosClient() {
  if (aptosSingleton) return aptosSingleton;
  const mod = await import("@aptos-labs/ts-sdk");
  const config = new mod.AptosConfig({ network: mod.Network.DEVNET });
  aptosSingleton = new mod.Aptos(config);
  return aptosSingleton;
}

export function useAptos() {
  const { signAndSubmitTransaction, account } = useWallet();

  const transferAPT = async (
    recipientAddress: string,
    amount: number,
    description: string
  ) => {
    const toastId = toast.loading(`Processing ${description}...`, {
      description: "Please approve the transaction in your wallet.",
    });

    try {
      if (!account) {
        throw new Error("No account connected");
      }

      if (!signAndSubmitTransaction) {
        throw new Error("Wallet not properly connected");
      }

      // Simple transaction payload that will definitely work
      const transactionPayload = {
        data: {
          function: "0x1::aptos_account::transfer",
          typeArguments: [],
          functionArguments: [recipientAddress, amount * 100000000], // Convert to octas
        },
      };

      // Sign and submit the transaction
      console.log(
        "Calling signAndSubmitTransaction with payload:",
        transactionPayload
      );
      const result = await signAndSubmitTransaction(transactionPayload);
      console.log("Transaction result:", result);

      if (!result || !result.hash) {
        throw new Error("Transaction submission failed");
      }

      toast.success(`${description} successful!`, {
        id: toastId,
        description: `Transaction: ${result.hash.slice(0, 10)}...`,
      });

      return { success: true, hash: result.hash };
    } catch (error: any) {
      let errorMessage = "Unknown error";

      try {
        if (error && typeof error === "object") {
          if (error.message) {
            errorMessage = error.message;
          } else if (error.toString && typeof error.toString === "function") {
            errorMessage = error.toString();
          } else {
            errorMessage = "Unknown error";
          }
        } else if (error) {
          errorMessage = String(error);
        }
      } catch (parseError) {
        errorMessage = "Error parsing error message";
      }

      const isUserRejection =
        errorMessage.includes("User rejected") ||
        errorMessage.includes("rejected") ||
        errorMessage.includes("User denied") ||
        errorMessage.includes("cancelled");

      console.error("Transaction failed", error);
      toast.error(
        isUserRejection ? "Transaction rejected" : `Transaction failed`,
        {
          id: toastId,
          description: isUserRejection
            ? "You cancelled the transaction."
            : errorMessage,
        }
      );
      return { success: false, error: errorMessage };
    }
  };

  const simulateTransaction = async (description: string) => {
    const toastId = toast.loading(`Processing ${description}...`, {
      description: "Please approve the transaction in your wallet.",
    });
    try {
      const mockPayload = {
        function: `0x1::account::set_object_signer`,
        functionArguments: [],
      };
      const result = await signAndSubmitTransaction(mockPayload);
      const client = await getAptosClient();
      await client.waitForTransaction({ transactionHash: result.hash });
      toast.success(`${description} successful!`, {
        id: toastId,
        description: `Transaction: ${result.hash.slice(0, 10)}...`,
      });
      return { success: true, hash: result.hash };
    } catch (error: any) {
      // User rejection is a common case, don't treat it as a catastrophic error
      let errorMessage = "Unknown error";

      if (error && typeof error === "object") {
        errorMessage = error.message || error.toString() || "Unknown error";
      } else if (error) {
        errorMessage = String(error);
      }

      const isUserRejection =
        errorMessage.includes("User rejected the request") ||
        errorMessage.includes("User rejected") ||
        errorMessage.includes("rejected");

      console.error("Transaction failed", error);
      toast.error(
        isUserRejection ? "Transaction rejected" : `Transaction failed`,
        {
          id: toastId,
          description: isUserRejection
            ? "You cancelled the transaction."
            : errorMessage,
        }
      );
      return { success: false, error: errorMessage };
    }
  };

  return { simulateTransaction, transferAPT };
}

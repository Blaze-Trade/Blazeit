import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { toast } from "sonner";

let aptosSingleton: any | null = null;
async function getAptosClient() {
  if (aptosSingleton) return aptosSingleton;
  const mod = await import("@aptos-labs/ts-sdk");
  const config = new mod.AptosConfig({ network: mod.Network.TESTNET });
  aptosSingleton = new mod.Aptos(config);
  return aptosSingleton;
}
export function useAptos() {
  const { signAndSubmitTransaction } = useWallet();
  const simulateTransaction = async (description: string, payload?: any) => {
    const toastId = toast.loading(`Processing ${description}...`, {
      description: "Please approve the transaction in your wallet.",
    });
    try {
      const mockPayload = payload || {
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
      const isUserRejection = error.message?.includes("User rejected the request");
      console.error("Transaction failed", error);
      toast.error(isUserRejection ? "Transaction rejected" : `Transaction failed`, {
        id: toastId,
        description: isUserRejection ? "You cancelled the transaction." : (error?.message || "Please try again."),
      });
      return { success: false, error };
    }
  };
  return { simulateTransaction };
}
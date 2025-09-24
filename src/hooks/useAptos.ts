import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { toast } from "sonner";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
const aptosConfig = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(aptosConfig);
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
      await aptos.waitForTransaction({ transactionHash: result.hash });
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
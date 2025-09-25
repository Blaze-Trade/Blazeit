import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { toast } from "sonner";
import { useState } from "react";
import { imageUploadService, ImageUploadResult } from "@/lib/image-upload";

interface TokenCreationData {
  symbol: string;
  name: string;
  description: string;
  image?: File;
  imageUrl?: string;
}

interface TokenCreationResult {
  success: boolean;
  hash?: string;
  error?: any;
}

let aptosSingleton: any | null = null;
async function getAptosClient() {
  if (aptosSingleton) return aptosSingleton;
  const mod = await import("@aptos-labs/ts-sdk");
  const config = new mod.AptosConfig({ network: mod.Network.TESTNET });
  aptosSingleton = new mod.Aptos(config);
  return aptosSingleton;
}

export function useTokenCreation() {
  const { signAndSubmitTransaction, account } = useWallet();
  const [isCreating, setIsCreating] = useState(false);

  const createToken = async (tokenData: TokenCreationData): Promise<TokenCreationResult> => {
    if (!account) {
      toast.error("Please connect your wallet first");
      return { success: false, error: "No wallet connected" };
    }

    setIsCreating(true);
    const toastId = toast.loading("Creating token...", {
      description: "Please approve the transaction in your wallet.",
    });

    try {
      const client = await getAptosClient();
      
      // For now, we'll create a simple coin using the Aptos framework
      // In a real implementation, you might want to use a custom token standard
      const payload = {
        function: "0x1::managed_coin::initialize",
        typeArguments: [],
        functionArguments: [
          tokenData.name, // name
          tokenData.symbol, // symbol
          "8", // decimals
          "false", // monitor_supply
        ],
      };

      const result = await signAndSubmitTransaction(payload);
      await client.waitForTransaction({ transactionHash: result.hash });

      toast.success("Token created successfully!", {
        id: toastId,
        description: `Transaction: ${result.hash.slice(0, 10)}...`,
      });

      return { success: true, hash: result.hash };
    } catch (error: any) {
      console.error("Token creation failed:", error);
      
      const isUserRejection = error.message?.includes("User rejected the request");
      toast.error(isUserRejection ? "Transaction rejected" : "Token creation failed", {
        id: toastId,
        description: isUserRejection 
          ? "You cancelled the transaction." 
          : (error?.message || "Please try again."),
      });

      return { success: false, error };
    } finally {
      setIsCreating(false);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const result = await imageUploadService.uploadImage(file);
    if (result.success && result.url) {
      return result.url;
    }
    throw new Error(result.error || 'Failed to upload image');
  };

  return {
    createToken,
    uploadImage,
    isCreating,
  };
}

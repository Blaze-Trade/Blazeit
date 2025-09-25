import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { toast } from "sonner";
import { useState } from "react";
import { imageUploadService, ImageUploadResult } from "@/lib/image-upload";
import { useLaunchpadIntegration } from "./useLaunchpadIntegration";

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
  const config = new mod.AptosConfig({ network: mod.Network.DEVNET });
  aptosSingleton = new mod.Aptos(config);
  return aptosSingleton;
}

export function useTokenCreation() {
  const { account } = useWallet();
  const { createToken: contractCreateToken, isLoading } = useLaunchpadIntegration();
  const [isCreating, setIsCreating] = useState(false);

  const createToken = async (tokenData: TokenCreationData): Promise<TokenCreationResult> => {
    if (!account) {
      toast.error("Please connect your wallet first");
      return { success: false, error: "No wallet connected" };
    }

    setIsCreating(true);

    try {
      const result = await contractCreateToken({
        name: tokenData.name,
        symbol: tokenData.symbol,
        description: tokenData.description,
        imageUrl: tokenData.imageUrl || "",
        decimals: 8,
      });

      return result;
    } catch (error: any) {
      console.error("Token creation failed:", error);
      return { success: false, error };
    } finally {
      setIsCreating(false);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const result = await imageUploadService.uploadImage(file);
      if (result.success && result.url) {
        return result.url;
      }
      throw new Error(result.error || 'Failed to upload image');
    } catch (error) {
      console.error('Image upload error in hook:', error);
      throw error;
    }
  };

  return {
    createToken,
    uploadImage,
    isCreating,
  };
}

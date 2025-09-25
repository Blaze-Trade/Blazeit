import { imageUploadService } from "@/lib/image-upload";
import { tokenCreationApi } from "@/lib/supabase-api";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useLaunchpadIntegration,
  type CreateTokenArguments,
} from "./useLaunchpadIntegration";

interface TokenCreationData {
  symbol: string;
  name: string;
  description: string;
  image?: File;
  imageUrl?: string;
  maxSupply?: number;
  projectURL?: string;
  targetSupply?: number;
  virtualLiquidity?: number;
  curveExponent?: number;
  maxMintPerAccount?: number;
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
  const launchpadIntegration = useLaunchpadIntegration();
  const { executeCreateToken, isLoading } = launchpadIntegration;
  const [isCreating, setIsCreating] = useState(false);

  const createToken = async (
    tokenData: TokenCreationData
  ): Promise<TokenCreationResult> => {
    if (!account) {
      toast.error("Please connect your wallet first");
      return { success: false, error: "No wallet connected" };
    }

    if (!executeCreateToken) {
      console.error("Contract create token function is not available");
      toast.error(
        "Contract function not available. Please check wallet connection."
      );
      return { success: false, error: "Contract function not available" };
    }

    setIsCreating(true);

    try {
      // Prepare the arguments in the format expected by the contract
      const createTokenArgs: CreateTokenArguments = {
        maxSupply: tokenData.maxSupply || 1000000, // Default 1M tokens
        name: tokenData.name,
        symbol: tokenData.symbol,
        decimal: 8, // Standard 8 decimals
        iconURL: tokenData.imageUrl || "",
        projectURL: tokenData.projectURL || "",
        targetSupply: tokenData.targetSupply || 100000, // Default 100K target supply
        virtualLiquidity: tokenData.virtualLiquidity || 1, // Default 1 APT virtual liquidity
        curveExponent: tokenData.curveExponent || 2, // Default curve exponent of 2
        maxMintPerAccount: tokenData.maxMintPerAccount || 0, // No limit by default
      };

      const result = await executeCreateToken(createTokenArgs);

      // If blockchain creation was successful, store the token in the database
      if (result.success && result.hash) {
        try {
          // Extract token address from the transaction result
          // Note: In a real implementation, you'd parse the transaction to get the actual token address
          // For now, we'll use a placeholder address format
          const tokenAddress = `0x${result.hash.slice(-40)}`; // Simplified extraction

          const dbResult = await tokenCreationApi.createToken({
            symbol: tokenData.symbol,
            name: tokenData.name,
            description: tokenData.description,
            logoUrl: tokenData.imageUrl,
            address: tokenAddress,
            decimals: 8, // Standard decimals
            maxSupply: tokenData.maxSupply,
            creatorWalletAddress: account.address.toString(),
          });

          if (dbResult.success) {
            toast.success(
              `Token ${tokenData.symbol} created successfully on blockchain and stored in database!`
            );
          } else {
            toast.warning(
              `Token created on blockchain but failed to store in database: ${dbResult.error}`
            );
          }
        } catch (dbError) {
          console.error("Failed to store token in database:", dbError);
          toast.warning(
            `Token created on blockchain but failed to store in database: ${dbError}`
          );
        }
      }

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

      console.error("Upload failed:", result.error);
      throw new Error(result.error || "Failed to upload image");
    } catch (error) {
      console.error("Image upload error in hook:", error);
      throw error;
    }
  };

  return {
    createToken,
    uploadImage,
    isCreating,
  };
}

import type { CreatePoolParams } from "@/lib/blaze-sdk";
import { getAptosNetwork } from "@/lib/constants";
import { imageUploadService } from "@/lib/image-upload";
import { tokenCreationApi } from "@/lib/supabase-api";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLaunchpadV2 } from "./useLaunchpadV2";

interface TokenCreationData {
  symbol: string;
  name: string;
  description: string;
  image?: File;
  imageUrl?: string;

  // Token Settings
  decimals?: number; // Default: 8
  maxSupply?: number; // Optional, undefined = unlimited

  // V2 Bonding Curve Parameters
  reserveRatio?: number; // 1-100%, default: 50%
  initialReserveApt?: number; // APT amount, default: 0.1
  marketCapThreshold?: number; // USD, default: 75000

  // Social Links
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
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
  const config = new mod.AptosConfig({ network: getAptosNetwork() });
  aptosSingleton = new mod.Aptos(config);
  return aptosSingleton;
}

export function useTokenCreation() {
  const { account } = useWallet();
  const { createPool } = useLaunchpadV2();
  const [isCreating, setIsCreating] = useState(false);

  const createToken = async (
    tokenData: TokenCreationData
  ): Promise<TokenCreationResult> => {
    if (!account) {
      toast.error("Please connect your wallet first");
      return { success: false, error: "No wallet connected" };
    }

    setIsCreating(true);

    try {
      // Prepare V2 pool creation parameters
      const poolParams: CreatePoolParams = {
        name: tokenData.name,
        ticker: tokenData.symbol,
        imageUri: tokenData.imageUrl || "",
        description: tokenData.description,
        website: tokenData.website,
        twitter: tokenData.twitter,
        telegram: tokenData.telegram,
        discord: tokenData.discord,
        maxSupply: tokenData.maxSupply
          ? BigInt(tokenData.maxSupply)
          : undefined,
        decimals: tokenData.decimals ?? 8,
        reserveRatio: tokenData.reserveRatio ?? 50,
        initialReserveApt: tokenData.initialReserveApt ?? 0.1,
        thresholdUsd: tokenData.marketCapThreshold ?? 75000,
      };

      console.log(
        "🚀 Creating V2 pool with params:",
        JSON.stringify(
          poolParams,
          (key, value) =>
            typeof value === "bigint" ? value.toString() : value,
          2
        )
      );

      const result = await createPool(poolParams);
      console.log("✅ Pool creation result:", result);

      // If blockchain creation was successful, store the token in the database
      if (result.success && result.hash) {
        try {
          // Extract pool ID (FA metadata object address) from transaction
          const client = await getAptosClient();
          const txn = await client.waitForTransaction({
            transactionHash: result.hash,
          });

          console.log("Transaction details:", JSON.stringify(txn, null, 2));

          let poolId: string | null = null;

          // Check events for CreatePoolEvent
          if ("events" in txn && Array.isArray(txn.events)) {
            for (const event of txn.events) {
              // Look for CreatePoolEvent which contains pool_id
              if (event.type?.includes("CreatePoolEvent")) {
                poolId = event.data?.pool_id?.inner || event.data?.pool_id;
                console.log("Found pool ID in CreatePoolEvent:", poolId);
                break;
              }

              // Fallback: Check for FA metadata creation
              if (
                event.type?.includes("0x1::object::ObjectCore") ||
                event.type?.includes("fungible_asset")
              ) {
                if (event.data?.object || event.data?.metadata) {
                  poolId = event.data.object || event.data.metadata;
                  console.log("Found pool ID in FA event:", poolId);
                  break;
                }
              }
            }
          }

          // Fallback: Check write set changes
          if (!poolId && "changes" in txn && Array.isArray(txn.changes)) {
            for (const change of txn.changes) {
              if (
                change.type === "write_resource" &&
                change.data?.type?.includes("0x1::fungible_asset::Metadata")
              ) {
                poolId = change.address;
                console.log("Found pool ID in changes:", poolId);
                break;
              }
            }
          }

          if (!poolId) {
            console.warn("Could not extract pool ID from transaction");
            toast.warning(
              "Token created but pool ID not found. Check explorer and update manually."
            );
            // Skip database storage if pool ID not found
            return result;
          }

          console.log("Final pool ID to store:", poolId);

          // Store in database with V2 fields
          const dbResult = await tokenCreationApi.createToken({
            symbol: tokenData.symbol,
            name: tokenData.name,
            description: tokenData.description,
            logoUrl: tokenData.imageUrl,
            address: poolId,
            decimals: poolParams.decimals ?? 8,
            maxSupply: tokenData.maxSupply,
            creatorWalletAddress: account.address.toString(),

            // V2 Specific Fields
            reserveRatio: poolParams.reserveRatio ?? 50,
            initialReserveApt: poolParams.initialReserveApt ?? 0.1,
            marketCapThreshold: poolParams.thresholdUsd ?? 75000,
            socialLinks: {
              website: tokenData.website,
              twitter: tokenData.twitter,
              telegram: tokenData.telegram,
              discord: tokenData.discord,
            },
          });

          if (dbResult.success) {
            toast.success(`Token ${tokenData.symbol} created successfully!`, {
              description: `Pool ID: ${poolId.slice(0, 10)}...${poolId.slice(
                -8
              )}`,
              duration: 8000,
            });
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

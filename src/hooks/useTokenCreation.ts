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
  maxSupply?: number; // In human-readable units. Default: 1,000,000 (1M tokens)
  projectURL?: string;
  targetSupply?: number; // In human-readable units. Default: 100,000 (100K tokens)
  virtualLiquidity?: number; // In APT. Default: 1,000,000 APT
  curveExponent?: number; // Curve steepness, 2 = quadratic (default: 2)
  maxMintPerAccount?: number; // In human-readable units. 0 = NO LIMIT (default: 0)
  decimals?: number; // Token decimals (0-8). Default: 0 (recommended for cubic curve). Higher = overflow risk!
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
  const { executeCreateToken } = launchpadIntegration;
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
      // SMART CONTRACT COMPATIBLE TOKEN CREATION
      // The contract uses a HARDCODED CUBIC bonding curve: cost = (supply³ - prev³) / (3 × virtualLiquidity)
      // This means amount³ is calculated BEFORE division, causing u64 overflow with large amounts.
      //
      // SOLUTION: Use ZERO DECIMALS to keep amounts as small as possible
      // With 0 decimals:
      // - 1 token = 1 smallest unit (no conversion!)
      // - Buying 1000 tokens = 1,000 smallest units
      // - 1,000³ = 10^9 (safely within u64 max of ~10^19) ✅
      //
      // Math example for buying 100 tokens (100 smallest units):
      // - new_supply³ = 100³ = 1,000,000 = 10^6
      // - virtualLiquidity in smallest units = 1M APT × 10^8 = 10^14
      // - cost = 10^6 / (3 × 10^14) = tiny amount ✅
      //
      // Maximum safe amount: ~10,000 tokens at once (10,000³ = 10^12)
      const decimals =
        tokenData.decimals !== undefined ? tokenData.decimals : 0;

      // Warn if using high decimals (overflow risk)
      if (decimals > 2) {
        console.warn(
          `⚠️ Using ${decimals} decimals may cause overflow! With cubic bonding curve:`
        );
        console.warn(`- Safe max buy with 0 decimals: ~10,000 tokens`);
        console.warn(`- Safe max buy with 2 decimals: ~100 tokens`);
        console.warn(`- Safe max buy with 4 decimals: ~1 token`);
        console.warn(`- With ${decimals} decimals: overflow very likely!`);
      }

      const createTokenArgs: CreateTokenArguments = {
        maxSupply: tokenData.maxSupply || 1000000, // 1M tokens (human-readable)
        name: tokenData.name,
        symbol: tokenData.symbol,
        decimal: decimals, // User-specified decimals (0-8). Lower = safer for cubic curve!
        iconURL: tokenData.imageUrl || "",
        projectURL: tokenData.projectURL || "",
        targetSupply: tokenData.targetSupply || 100000, // 100K tokens (human-readable)
        virtualLiquidity: tokenData.virtualLiquidity || 1000000, // 1M APT virtual liquidity
        curveExponent: tokenData.curveExponent || 2, // Stored but not used (contract hardcodes cubic)
        maxMintPerAccount: tokenData.maxMintPerAccount || 0, // 0 = NO LIMIT
      };

      console.log(
        "🚀 Creating token with args:",
        JSON.stringify(createTokenArgs, null, 2)
      );
      const result = await executeCreateToken(createTokenArgs);
      console.log("✅ Token creation result:", result);

      // If blockchain creation was successful, store the token in the database
      if (result.success && result.hash) {
        try {
          // Extract token address from the transaction result
          const client = await getAptosClient();
          const txn = await client.waitForTransaction({
            transactionHash: result.hash,
          });

          console.log("Transaction details:", JSON.stringify(txn, null, 2));

          // Extract the actual FA metadata object address from transaction
          let tokenAddress = null;

          // Method 1: Check events for FA creation
          if ("events" in txn && Array.isArray(txn.events)) {
            console.log("Checking events:", txn.events);

            // Look for fungible asset events
            for (const event of txn.events) {
              console.log("Event type:", event.type);
              console.log("Event data:", event.data);

              // Check for FA metadata creation or token creation events
              if (
                event.type?.includes("0x1::object::ObjectCore") ||
                event.type?.includes("CreateEvent") ||
                event.type?.includes("fungible_asset")
              ) {
                // The FA metadata object address might be in event data
                if (event.data?.object || event.data?.metadata) {
                  tokenAddress = event.data.object || event.data.metadata;
                  console.log("Found token address in event:", tokenAddress);
                  break;
                }
              }
            }
          }

          // Method 2: Check write set changes for new objects created
          if (!tokenAddress && "changes" in txn && Array.isArray(txn.changes)) {
            console.log("Checking changes:", txn.changes);

            // Look for write_resource changes that create new objects
            for (const change of txn.changes) {
              if (
                change.type === "write_resource" &&
                change.data?.type?.includes("0x1::fungible_asset::Metadata")
              ) {
                tokenAddress = change.address;
                console.log("Found token address in changes:", tokenAddress);
                break;
              }
            }
          }

          // Method 3: Fallback - derive object address from transaction
          // For FA tokens, the metadata object is typically created at a deterministic address
          if (!tokenAddress) {
            console.warn(
              "Could not find FA metadata address in transaction, using fallback"
            );
            // You may need to call a view function to get the FA metadata address
            // For now, we'll need to handle this case
            toast.warning(
              "Could not automatically extract token address. Please update it manually from the explorer."
            );
            tokenAddress = account.address.toString(); // Temporary fallback
          }

          console.log("Final token address to store:", tokenAddress);

          const dbResult = await tokenCreationApi.createToken({
            symbol: tokenData.symbol,
            name: tokenData.name,
            description: tokenData.description,
            logoUrl: tokenData.imageUrl,
            address: tokenAddress,
            decimals: decimals, // MUST match the on-chain decimal value!
            maxSupply: tokenData.maxSupply,
            creatorWalletAddress: account.address.toString(),
          });

          if (dbResult.success) {
            toast.success(`Token ${tokenData.symbol} created successfully!`, {
              description: `FA Address: ${tokenAddress.slice(
                0,
                10
              )}...${tokenAddress.slice(-8)}`,
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

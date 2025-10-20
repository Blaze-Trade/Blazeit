import { aptosClient } from "@/lib/aptosClient";
import { MODULE_ADDRESS } from "@/lib/constants";
import { convertAmountFromOnChainToHumanReadable } from "@/lib/utils";
import { AccountAddress, GetFungibleAssetMetadataResponse } from "@aptos-labs/ts-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import type { Token } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export interface FungibleAsset {
  maximum_v2: number;
  supply_v2: number;
  name: string;
  symbol: string;
  decimals: number;
  asset_type: string;
  icon_uri: string;
}

interface MintQueryResult {
  fungible_asset_metadata: Array<FungibleAsset>;
  current_fungible_asset_balances_aggregate: {
    aggregate: {
      count: number;
    };
  };
  current_fungible_asset_balances: Array<{
    amount: number;
  }>;
}

interface MintData {
  maxSupply: number;
  currentSupply: number;
  uniqueHolders: number;
  yourBalance: number;
  totalAbleToMint: number;
  asset: FungibleAsset;
  isMintActive: boolean;
}

async function getMintLimit(fa_address: string): Promise<number> {
  try {
    const mintLimitRes = await aptosClient().view<[boolean, number]>({
      payload: {
        function: `${AccountAddress.from(
          MODULE_ADDRESS
        )}::launchpad::get_mint_limit`,
        functionArguments: [fa_address],
      },
    });

    // Return the limit if it exists, otherwise return 0
    return mintLimitRes[0] ? mintLimitRes[1] : 0;
  } catch (error: any) {
    // Handle contract not deployed gracefully
    if (
      error?.message?.includes("404") ||
      error?.message?.includes("Not Found")
    ) {
      console.info("Contract not deployed yet - using default mint limit");
    } else {
      console.warn("Error getting mint limit:", error?.message || error);
    }
    return 0; // Default to 0 if there's an error
  }
}

/**
 * A react hook to get fungible asset data for a specific asset.
 */
export function useGetAssetData(fa_address?: string) {
  const { account } = useWallet();

  return useQuery({
    queryKey: ["asset-data", fa_address],
    refetchInterval: 1000 * 60, // Refetch every minute
    retry: 3,
    retryDelay: 5000,
    queryFn: async () => {
      try {
        if (!fa_address) return null;

        const res = await aptosClient().queryIndexer<MintQueryResult>({
          query: {
            variables: {
              fa_address,
              account: account?.address.toString() ?? "",
            },
            query: `
            query FungibleQuery($fa_address: String, $account: String) {
              fungible_asset_metadata(where: {asset_type: {_eq: $fa_address}}) {
                maximum_v2
                supply_v2
                name
                symbol
                decimals
                asset_type
                icon_uri
              }
              current_fungible_asset_balances_aggregate(
                distinct_on: owner_address
                where: {asset_type: {_eq: $fa_address}}
              ) {
                aggregate {
                  count
                }
              }
              current_fungible_asset_balances(
                where: {owner_address: {_eq: $account}, asset_type: {_eq: $fa_address}}
                distinct_on: asset_type
                limit: 1
              ) {
                amount
              }
            }`,
          },
        });

        const asset = res.fungible_asset_metadata[0];
        if (!asset) {
          console.warn(`No asset found for address: ${fa_address}`);
          return null;
        }

        return {
          asset,
          maxSupply: convertAmountFromOnChainToHumanReadable(
            asset.maximum_v2 ?? 0,
            asset.decimals
          ),
          currentSupply: convertAmountFromOnChainToHumanReadable(
            asset.supply_v2 ?? 0,
            asset.decimals
          ),
          uniqueHolders:
            res.current_fungible_asset_balances_aggregate.aggregate.count ?? 0,
          totalAbleToMint: convertAmountFromOnChainToHumanReadable(
            await getMintLimit(fa_address),
            asset.decimals
          ),
          yourBalance: convertAmountFromOnChainToHumanReadable(
            res.current_fungible_asset_balances[0]?.amount ?? 0,
            asset.decimals
          ),
          isMintActive: asset.maximum_v2 > asset.supply_v2,
        } satisfies MintData;
      } catch (error) {
        console.warn(
          "Error fetching asset data (this is expected if contract doesn't exist):",
          error
        );

        // If it's a rate limit error, return a minimal data structure
        if (
          error instanceof Error &&
          (error.message.includes("rate limit") ||
            error.message.includes("404"))
        ) {
          console.warn(
            "Contract not found or rate limited, returning minimal data"
          );
          return {
            asset: {
              maximum_v2: 0,
              supply_v2: 0,
              name: "Unknown",
              symbol: "UNK",
              decimals: 8,
              asset_type: fa_address!,
              icon_uri: "",
            },
            maxSupply: 0,
            currentSupply: 0,
            uniqueHolders: 0,
            totalAbleToMint: 0,
            yourBalance: 0,
            isMintActive: false,
          };
        }

        return null;
      }
    },
  });
}

/**
 * A react hook to get all fungible asset metadata from the launchpad.
 */
function useGetAssetMetadata() {
  const [fas, setFAs] = useState<GetFungibleAssetMetadataResponse>([]);

  useEffect(() => {
    // fetch the contract registry address
    getRegistry()
      .then((faObjects) => {
        // fetch fungible assets objects created under that contract registry address
        // get each fungible asset object metadata
        getMetadata(faObjects)
          .then((metadatas) => {
            console.log("Fungible asset metadata:", metadatas);
            setFAs(metadatas);
          })
          .catch((error) => {
            console.warn("Failed to fetch metadata:", error);
            setFAs([]);
          });
      })
      .catch((error) => {
        console.warn("Failed to fetch registry:", error);
        setFAs([]);
      });
  }, []);

  return fas;
}

const getRegistry = async () => {
  try {
    const registry = await aptosClient().view<[[{ inner: string }]]>({
      payload: {
        function: `${AccountAddress.from(MODULE_ADDRESS)}::launchpad::get_registry`,
      },
    });
    return registry[0];
  } catch (error: any) {
    // Handle specific error cases more gracefully
    if (error?.message?.includes("404") || error?.message?.includes("Not Found")) {
      console.info("Contract not deployed yet - this is expected for new projects");
    } else {
      console.warn("Failed to get registry from contract:", error?.message || error);
    }
    return [];
  }
};

const getMetadata = async (
  objects: Array<{
    inner: string;
  }>,
) => {
  try {
    const metadatas = await Promise.all(
      objects.map(async (object: { inner: string }) => {
        try {
          const formattedObjectAddress = AccountAddress.from(object.inner).toString();

          const metadata = await aptosClient().getFungibleAssetMetadata({
            options: {
              where: { asset_type: { _eq: `${formattedObjectAddress}` } },
            },
          });
          return metadata[0];
        } catch (error) {
          console.warn(`Failed to get metadata for object ${object.inner}:`, error);
          return null;
        }
      }),
    );
    return metadatas.filter(Boolean);
  } catch (error) {
    console.warn("Failed to get metadata:", error);
    return [];
  }
};

/**
 * A react hook to get all blockchain tokens for trading.
 * This combines the asset metadata with additional data for trading.
 */
export function useBlockchainTokens() {
  const assetMetadata = useGetAssetMetadata();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoading(true);
        setError(null);

        if (assetMetadata.length === 0) {
          // If no blockchain tokens, return empty array
          setTokens([]);
          return;
        }

        // Convert blockchain assets to Token format
        const blockchainTokens: Token[] = assetMetadata
          .filter((asset) => asset && asset.name && asset.symbol)
          .map((asset) => ({
            id: asset.asset_type,
            symbol: asset.symbol,
            name: asset.name,
            price: 0, // We'll need to get this from a price API or calculate it
            change24h: 0, // We'll need to get this from a price API
            marketCap: convertAmountFromOnChainToHumanReadable(
              asset.supply_v2 || 0,
              asset.decimals
            ),
            logoUrl: asset.icon_uri || "",
            address: asset.asset_type,
            decimals: asset.decimals,
          }));

        setTokens(blockchainTokens);
      } catch (err) {
        console.error("Error fetching blockchain tokens:", err);
        setError("Failed to fetch tokens from blockchain");
        setTokens([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [assetMetadata]);

  return {
    tokens,
    loading,
    error,
  };
}

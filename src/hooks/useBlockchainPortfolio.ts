import { aptosClient } from "@/lib/aptosClient";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import type { Holding } from "@shared/types";
import { useCallback, useEffect, useState } from "react";

interface FungibleAssetBalance {
  amount: number;
  asset_type: string;
  is_frozen: boolean;
  is_primary: boolean;
  last_transaction_timestamp: string;
  last_transaction_version: string;
  token_properties: {
    name: string;
    symbol: string;
    decimals: number;
    icon_uri?: string;
  };
}

interface FungibleAssetMetadata {
  asset_type: string;
  name: string;
  symbol: string;
  decimals: number;
  icon_uri?: string;
  maximum_v2?: number;
  supply_v2?: number;
}

export function useBlockchainPortfolio() {
  const { account, connected } = useWallet();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserBalances = useCallback(async () => {
    if (!account?.address || !connected) {
      setHoldings([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the correct Aptos SDK method to get fungible asset balances
      // Based on existing code, we use queryIndexer to get balance data
      const balances = await aptosClient().queryIndexer<{
        current_fungible_asset_balances: Array<{
          amount: number;
          asset_type: string;
          is_frozen: boolean;
          is_primary: boolean;
          last_transaction_timestamp: string;
          last_transaction_version: string;
        }>;
      }>({
        query: {
          variables: {
            account: account.address.toString(),
          },
          query: `
            query FungibleAssetBalances($account: String) {
              current_fungible_asset_balances(
                where: { owner_address: { _eq: $account }, amount: { _gt: "0" } }
              ) {
                amount
                asset_type
                is_frozen
                is_primary
                last_transaction_timestamp
                last_transaction_version
              }
            }
          `,
        },
      });

      if (!balances?.current_fungible_asset_balances || balances.current_fungible_asset_balances.length === 0) {
        setHoldings([]);
        setLoading(false);
        return;
      }

      // Get metadata for all unique asset types
      const assetTypes = [...new Set(balances.current_fungible_asset_balances.map(b => b.asset_type))];
      const metadataPromises = assetTypes.map(async (assetType) => {
        try {
          const metadata = await aptosClient().getFungibleAssetMetadata({
            options: {
              where: { asset_type: { _eq: assetType } },
            },
          });
          return metadata[0] || null;
        } catch (error) {
          console.warn(`Failed to get metadata for ${assetType}:`, error);
          return null;
        }
      });

      const metadataResults = await Promise.all(metadataPromises);
      const metadataMap = new Map<string, FungibleAssetMetadata>();

      metadataResults.forEach((metadata, index) => {
        if (metadata) {
          metadataMap.set(assetTypes[index], metadata);
        }
      });

      // Convert balances to holdings
      const holdingsData: Holding[] = balances.current_fungible_asset_balances
        .filter(balance => balance.amount > 0) // Only include non-zero balances
        .map(balance => {
          const metadata = metadataMap.get(balance.asset_type);
          const decimals = metadata?.decimals || 8;
          const amount = balance.amount / Math.pow(10, decimals);

          // For now, we'll use a placeholder price since we don't have real-time price data
          // In a real implementation, you'd fetch this from a price API
          const estimatedPrice = getEstimatedPrice(balance.asset_type, metadata?.symbol);
          const value = amount * estimatedPrice;

          return {
            id: balance.asset_type,
            symbol: metadata?.symbol || 'UNKNOWN',
            name: metadata?.name || 'Unknown Token',
            quantity: amount,
            value: value,
            cost: value * 0.8, // Placeholder - in real app, track purchase history
            logoUrl: metadata?.icon_uri || '',
            address: balance.asset_type,
            decimals: decimals,
            // Additional properties required by Holding type
            price: estimatedPrice,
            change24h: 0, // Placeholder - would need historical price data
            marketCap: 0, // Placeholder - would need supply and price data
          };
        })
        .filter(holding => holding.value > 0); // Only include holdings with value

      setHoldings(holdingsData);
    } catch (error) {
      console.error("Error fetching blockchain portfolio:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch portfolio");
      setHoldings([]);
    } finally {
      setLoading(false);
    }
  }, [account?.address, connected]);

  // Helper function to get estimated prices (placeholder implementation)
  const getEstimatedPrice = (assetType: string, symbol?: string): number => {
    // Known token prices (in a real app, fetch from price APIs)
    const knownPrices: Record<string, number> = {
      '0x1::aptos_coin::AptosCoin': 8.45,
      '0x1::usd_coin::USDCCoin': 1.00,
      '0x1::tether::USDTCoin': 1.00,
      '0x1::bitcoin::Bitcoin': 45000.00,
      '0x1::ethereum::Ethereum': 3200.00,
      '0x1::solana::Solana': 95.50,
      '0x1::cardano::Cardano': 0.45,
      '0x1::polkadot::Polkadot': 6.78,
      '0x1::polygon::Polygon': 0.89,
      '0x1::avalanche::Avalanche': 25.30,
    };

    // Check by asset type first
    if (knownPrices[assetType]) {
      return knownPrices[assetType];
    }

    // Check by symbol
    if (symbol) {
      const symbolPrices: Record<string, number> = {
        'APT': 8.45,
        'USDC': 1.00,
        'USDT': 1.00,
        'BTC': 45000.00,
        'ETH': 3200.00,
        'SOL': 95.50,
        'ADA': 0.45,
        'DOT': 6.78,
        'MATIC': 0.89,
        'AVAX': 25.30,
      };

      if (symbolPrices[symbol]) {
        return symbolPrices[symbol];
      }
    }

    // Default to 1.00 for unknown tokens
    return 1.00;
  };

  useEffect(() => {
    fetchUserBalances();
  }, [fetchUserBalances]);

  const refetch = () => {
    fetchUserBalances();
  };

  return {
    holdings,
    loading,
    error,
    refetch,
  };
}

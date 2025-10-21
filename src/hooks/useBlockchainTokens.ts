import {
  calculateMarketCapUsd,
  getCurrentPrice,
  getPool,
  getPools,
  octasToApt,
  validateContract,
} from "@/lib/blaze-sdk";
import type { Token } from "@shared/types";
import { useEffect, useState } from "react";

/**
 * V2 React hook to get all blockchain tokens for trading.
 * Uses V2 contract view functions to fetch pool data, prices, and migration status.
 */
export function useBlockchainTokens() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchV2Tokens = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("🔍 Fetching V2 tokens from blockchain...");

        // First, validate that the contract exists
        const contractExists = await validateContract();
        if (!contractExists) {
          console.log("❌ Contract does not exist or is not accessible");
          setError(
            "Launchpad V2 contract not found. Please check contract deployment."
          );
          setTokens([]);
          return;
        }

        // Fetch all pool IDs from V2 contract
        const poolIds = await getPools();
        console.log("📋 Raw pool IDs from contract:", poolIds);

        if (poolIds.length === 0) {
          console.log("❌ No V2 pools found - returning empty array");
          setTokens([]);
          return;
        }

        console.log(`✅ Found ${poolIds.length} V2 pools`);

        // Fetch detailed data for each pool
        const tokenPromises = poolIds.map(async (poolId) => {
          try {
            // Fetch pool data (metadata, curve, settings)
            const poolData = await getPool(poolId);
            if (!poolData) return null;

            // Fetch current price (in octas)
            const priceOctas = await getCurrentPrice(poolId);
            const priceApt = octasToApt(priceOctas);

            // Fetch market cap (in USD cents)
            const marketCapCents = await calculateMarketCapUsd(poolId);
            const marketCapUsd = marketCapCents / 100; // Convert cents to dollars

            // Calculate token supply in human-readable units
            const decimals = 8; // TODO: Get from metadata if available

            // Map to Token type
            const token: Token = {
              id: poolId,
              symbol: poolData.metadata.ticker,
              name: poolData.metadata.name,
              price: priceApt,
              change24h: 0, // TODO: Calculate 24h change
              marketCap: marketCapUsd,
              logoUrl: poolData.metadata.token_image_uri,
              address: poolId,
              decimals,
              description: poolData.metadata.description,

              // V2 Fields
              reserveRatio: poolData.curve.reserve_ratio,
              reserveBalance: octasToApt(poolData.curve.reserve_balance),
              bondingCurveActive: poolData.curve.is_active,
              migrationCompleted: poolData.settings.migration_completed,
              migrationTimestamp:
                poolData.settings.migration_timestamp &&
                poolData.settings.migration_timestamp > 0
                  ? new Date(
                      poolData.settings.migration_timestamp * 1000
                    ).toISOString()
                  : undefined,
              hyperionPoolAddress: poolData.settings.hyperion_pool_address,
              marketCapThresholdUsd:
                poolData.settings.market_cap_threshold_usd / 100, // Convert cents to dollars
              tradingEnabled: poolData.settings.trading_enabled,
              socialLinks: poolData.metadata.social_links,
              createdAt:
                poolData.metadata.created_at && poolData.metadata.created_at > 0
                  ? new Date(poolData.metadata.created_at * 1000).toISOString()
                  : new Date().toISOString(), // Fallback to current time if invalid
              creatorId: poolData.metadata.creator,
            };

            return token;
          } catch (err) {
            console.error(`Error fetching data for pool ${poolId}:`, err);
            return null;
          }
        });

        const tokensData = await Promise.all(tokenPromises);
        const validTokens = tokensData.filter((t): t is Token => t !== null);

        // Filter out test/dummy tokens
        const productionTokens = validTokens.filter((token) => {
          // Filter out test/dummy tokens
          const isTestToken =
            token.symbol.toUpperCase() === "TEST" ||
            token.name.toLowerCase().includes("test") ||
            (token.price === 0 && token.marketCap === 0);

          return !isTestToken;
        });

        console.log(
          `✅ Successfully loaded ${validTokens.length} V2 tokens, filtered to ${productionTokens.length} production tokens:`,
          productionTokens
        );
        setTokens(productionTokens);
      } catch (err) {
        console.error("Error fetching V2 tokens:", err);
        setError("Failed to fetch tokens from blockchain");
        setTokens([]);
      } finally {
        setLoading(false);
      }
    };

    fetchV2Tokens();
  }, []);

  return {
    tokens,
    loading,
    error,
  };
}

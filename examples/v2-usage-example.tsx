/**
 * Blaze Launchpad V2 Usage Examples
 *
 * This file demonstrates how to use the V2 SDK in your React components
 */

import { useLaunchpadV2 } from "@/hooks/useLaunchpadV2";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState } from "react";
import { toast } from "sonner";

// ============================================================================
// Example 1: Create a Token Pool
// ============================================================================

export function CreateTokenExample() {
  const { connected } = useWallet();
  const { createPool, isLoading } = useLaunchpadV2();

  const handleCreateToken = async () => {
    if (!connected) {
      toast.error("Please connect your wallet");
      return;
    }

    const result = await createPool({
      name: "My Amazing Token",
      ticker: "MAT",
      imageUri: "https://example.com/logo.png",
      description: "The next big thing in crypto",

      // Social links (optional)
      website: "https://mytoken.com",
      twitter: "@mytoken",
      telegram: "t.me/mytoken",
      discord: "discord.gg/mytoken",

      // Token settings
      decimals: 8, // Standard 8 decimals
      maxSupply: BigInt(1_000_000_000), // 1 billion tokens

      // Bonding curve settings
      reserveRatio: 50, // 50% for balanced growth
      initialReserveApt: 0.1, // 0.1 APT to bootstrap

      // Migration settings
      thresholdUsd: 75000, // Migrate at $75k market cap
    });

    if (result.success) {
      toast.success("Token created successfully!");
      console.log("Transaction hash:", result.hash);
    }
  };

  return (
    <button onClick={handleCreateToken} disabled={isLoading}>
      {isLoading ? "Creating..." : "Create Token"}
    </button>
  );
}

// ============================================================================
// Example 2: Buy Tokens from Bonding Curve
// ============================================================================

export function BuyTokenExample() {
  const { connected } = useWallet();
  const { buy, isLoading } = useLaunchpadV2();
  const [poolId, setPoolId] = useState("");
  const [aptAmount, setAptAmount] = useState("0.1");

  const handleBuy = async () => {
    if (!connected || !poolId) {
      toast.error("Please connect wallet and enter pool ID");
      return;
    }

    const result = await buy(
      poolId,
      parseFloat(aptAmount), // APT amount to spend
      0, // Min tokens out (0 = no slippage protection)
      5 // 5 minute deadline
    );

    if (result.success) {
      toast.success("Tokens purchased!");
    }
  };

  return (
    <div>
      <input
        type="text"
        value={poolId}
        onChange={(e) => setPoolId(e.target.value)}
        placeholder="Pool ID (0x...)"
      />
      <input
        type="number"
        value={aptAmount}
        onChange={(e) => setAptAmount(e.target.value)}
        placeholder="APT amount"
      />
      <button onClick={handleBuy} disabled={isLoading}>
        {isLoading ? "Buying..." : "Buy Tokens"}
      </button>
    </div>
  );
}

// ============================================================================
// Example 3: Sell Tokens to Bonding Curve
// ============================================================================

export function SellTokenExample() {
  const { connected } = useWallet();
  const { sell, isLoading } = useLaunchpadV2();
  const [poolId, setPoolId] = useState("");
  const [tokenAmount, setTokenAmount] = useState("100");

  const handleSell = async () => {
    if (!connected || !poolId) {
      toast.error("Please connect wallet and enter pool ID");
      return;
    }

    const result = await sell(
      poolId,
      parseFloat(tokenAmount), // Token amount to sell
      8, // Token decimals
      0, // Min APT out (0 = no slippage protection)
      5 // 5 minute deadline
    );

    if (result.success) {
      toast.success("Tokens sold!");
    }
  };

  return (
    <div>
      <input
        type="text"
        value={poolId}
        onChange={(e) => setPoolId(e.target.value)}
        placeholder="Pool ID (0x...)"
      />
      <input
        type="number"
        value={tokenAmount}
        onChange={(e) => setTokenAmount(e.target.value)}
        placeholder="Token amount"
      />
      <button onClick={handleSell} disabled={isLoading}>
        {isLoading ? "Selling..." : "Sell Tokens"}
      </button>
    </div>
  );
}

// ============================================================================
// Example 4: Fetch Pool Data
// ============================================================================

export function PoolDataExample() {
  const { fetchPool, fetchCurrentPrice, fetchMarketCapUsd } = useLaunchpadV2();
  const [poolId, setPoolId] = useState("");
  const [poolData, setPoolData] = useState<any>(null);

  const loadPoolData = async () => {
    if (!poolId) return;

    // Fetch complete pool data
    const pool = await fetchPool(poolId);

    // Fetch current price
    const price = await fetchCurrentPrice(poolId);

    // Fetch market cap
    const marketCap = await fetchMarketCapUsd(poolId);

    setPoolData({
      pool,
      price: price / 100_000_000, // Convert octas to APT
      marketCap: marketCap / 100, // Convert cents to dollars
    });
  };

  return (
    <div>
      <input
        type="text"
        value={poolId}
        onChange={(e) => setPoolId(e.target.value)}
        placeholder="Pool ID"
      />
      <button onClick={loadPoolData}>Load Pool Data</button>

      {poolData && (
        <div>
          <h3>{poolData.pool.metadata.name}</h3>
          <p>Price: ${poolData.price.toFixed(8)} APT</p>
          <p>Market Cap: ${poolData.marketCap.toFixed(2)}</p>
          <p>Reserve Ratio: {poolData.pool.curve.reserve_ratio}%</p>
          <p>Migrated: {poolData.pool.settings.migration_completed ? "Yes" : "No"}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 5: Check Migration Status
// ============================================================================

export function MigrationStatusExample() {
  const { checkMigrationThreshold, fetchMarketCapUsd } = useLaunchpadV2();
  const [poolId, setPoolId] = useState("");
  const [status, setStatus] = useState<any>(null);

  const checkStatus = async () => {
    if (!poolId) return;

    const threshold = await checkMigrationThreshold(poolId);
    const marketCap = await fetchMarketCapUsd(poolId);

    setStatus({
      thresholdReached: threshold,
      marketCapUsd: marketCap / 100,
      migrationReady: threshold,
    });
  };

  return (
    <div>
      <input
        type="text"
        value={poolId}
        onChange={(e) => setPoolId(e.target.value)}
        placeholder="Pool ID"
      />
      <button onClick={checkStatus}>Check Migration Status</button>

      {status && (
        <div>
          <p>Market Cap: ${status.marketCapUsd.toFixed(2)}</p>
          <p>
            Status: {status.thresholdReached
              ? "✅ Ready for Migration"
              : "⏳ Still on Bonding Curve"}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 6: List All Pools
// ============================================================================

export function ListPoolsExample() {
  const { fetchPools, fetchPool } = useLaunchpadV2();
  const [pools, setPools] = useState<any[]>([]);

  const loadPools = async () => {
    const poolIds = await fetchPools();

    const poolsData = await Promise.all(
      poolIds.map(async (id) => {
        const pool = await fetchPool(id);
        return { id, ...pool };
      })
    );

    setPools(poolsData.filter(Boolean));
  };

  return (
    <div>
      <button onClick={loadPools}>Load All Pools</button>

      <div>
        {pools.map((pool) => (
          <div key={pool.id}>
            <h4>{pool.metadata.ticker}</h4>
            <p>{pool.metadata.name}</p>
            <p>Reserve: {pool.curve.reserve_balance / 100_000_000} APT</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Example 7: Buy with Slippage Protection
// ============================================================================

export function BuyWithSlippageExample() {
  const { buy, estimatePurchaseReturn } = useLaunchpadV2();
  const [poolId, setPoolId] = useState("");
  const [aptAmount, setAptAmount] = useState(0.1);
  const [slippagePct, setSlippagePct] = useState(1); // 1% slippage

  const handleBuyWithSlippage = async () => {
    if (!poolId) return;

    // Estimate tokens we'll receive
    const estimatedTokens = await estimatePurchaseReturn(poolId, aptAmount);

    // Calculate minimum tokens with slippage
    const minTokensOut = Math.floor(estimatedTokens * (1 - slippagePct / 100));

    console.log(`Estimated: ${estimatedTokens} tokens`);
    console.log(`Minimum (${slippagePct}% slippage): ${minTokensOut} tokens`);

    // Execute buy with slippage protection
    const result = await buy(poolId, aptAmount, minTokensOut, 5);

    if (result.success) {
      toast.success(`Bought tokens with ${slippagePct}% max slippage`);
    }
  };

  return (
    <div>
      <input
        type="number"
        value={slippagePct}
        onChange={(e) => setSlippagePct(parseFloat(e.target.value))}
        placeholder="Slippage %"
      />
      <button onClick={handleBuyWithSlippage}>
        Buy with {slippagePct}% Slippage Protection
      </button>
    </div>
  );
}


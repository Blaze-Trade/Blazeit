"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLaunchpadV2 } from "@/hooks/useLaunchpadV2";
import { getNetworkName } from "@/lib/constants";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { ExternalLink, RefreshCw, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function LaunchpadV2AdminPage() {
  const { account, connected } = useWallet();
  const launchpadV2 = useLaunchpadV2();

  const [aptUsdPrice, setAptUsdPrice] = useState<number>(0);
  const [newPrice, setNewPrice] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [pools, setPools] = useState<string[]>([]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const price = await launchpadV2.fetchAptUsdPrice();
        setAptUsdPrice(price / 100); // Convert cents to dollars

        const poolIds = await launchpadV2.fetchPools();
        setPools(poolIds);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      }
    };

    fetchData();
  }, [launchpadV2]);

  const handleUpdateOraclePrice = async () => {
    if (!newPrice) {
      toast.error("Please enter a price");
      return;
    }

    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Invalid price");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/update-oracle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET || ""}`,
        },
        body: JSON.stringify({
          price: Math.floor(priceNum * 100), // Convert to cents
          oracleAddress: account?.address.toString() || "0x1",
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Oracle price updated successfully!");
        setAptUsdPrice(priceNum);
        setNewPrice("");
      } else {
        toast.error(`Failed to update oracle price: ${result.error}`);
      }
    } catch (error: any) {
      console.error("Error updating oracle price:", error);
      toast.error(error.message || "Failed to update oracle price");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setLoading(true);
    try {
      const price = await launchpadV2.fetchAptUsdPrice();
      setAptUsdPrice(price / 100);

      const poolIds = await launchpadV2.fetchPools();
      setPools(poolIds);

      toast.success("Data refreshed");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blaze-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl font-bold text-blaze-black">
            Launchpad V2 Admin
          </h1>
          <Button
            onClick={handleRefreshData}
            disabled={loading}
            variant="outline"
            className="rounded-none border-2 border-blaze-black"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {!connected && (
          <Card className="rounded-none border-2 border-blaze-black bg-yellow-50">
            <CardContent className="p-6">
              <p className="font-mono text-blaze-black">
                ⚠️ Please connect your admin wallet to manage V2 settings
              </p>
            </CardContent>
          </Card>
        )}

        {/* Oracle Price Management */}
        <Card className="rounded-none border-2 border-blaze-black">
          <CardHeader>
            <CardTitle className="font-display text-2xl">
              APT/USD Oracle Price
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="font-mono text-sm text-blaze-black/70 mb-1">
                  Current Price
                </p>
                <p className="font-mono text-3xl font-bold text-blaze-black">
                  ${aptUsdPrice.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-blaze-orange" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPrice" className="font-mono">
                Update Price (USD)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="newPrice"
                  type="number"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="8.50"
                  className="rounded-none border-2 border-blaze-black"
                />
                <Button
                  onClick={handleUpdateOraclePrice}
                  disabled={!connected || loading || !newPrice}
                  className="rounded-none border-2 border-blaze-black bg-blaze-orange text-blaze-black hover:bg-blaze-orange/80"
                >
                  Update Price
                </Button>
              </div>
              <p className="font-mono text-xs text-blaze-black/50">
                This affects market cap calculations for all tokens
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pool Statistics */}
        <Card className="rounded-none border-2 border-blaze-black">
          <CardHeader>
            <CardTitle className="font-display text-2xl">
              Pool Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm text-blaze-black/70">
                  Total Pools
                </p>
                <p className="font-mono text-2xl font-bold text-blaze-black">
                  {pools.length}
                </p>
              </div>

              {pools.length > 0 && (
                <div className="space-y-2">
                  <p className="font-mono text-sm font-bold text-blaze-black">
                    Pool IDs:
                  </p>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {pools.map((poolId, index) => (
                      <div
                        key={poolId}
                        className="flex items-center justify-between p-2 bg-blaze-white border border-blaze-black/20"
                      >
                        <span className="font-mono text-xs text-blaze-black">
                          {index + 1}. {poolId.slice(0, 10)}...{poolId.slice(-8)}
                        </span>
                        <a
                          href={`https://explorer.aptoslabs.com/account/${poolId}?network=${getNetworkName()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blaze-orange hover:text-blaze-orange/80"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="rounded-none border-2 border-blaze-black">
          <CardHeader>
            <CardTitle className="font-display text-2xl">
              Quick Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href={`https://explorer.aptoslabs.com/?network=${getNetworkName()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-mono text-sm text-blaze-black hover:text-blaze-orange"
            >
              <ExternalLink className="w-4 h-4" />
              Aptos Explorer ({getNetworkName()})
            </a>
            <a
              href="https://app.hyperion.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-mono text-sm text-blaze-black hover:text-blaze-orange"
            >
              <ExternalLink className="w-4 h-4" />
              Hyperion DEX
            </a>
          </CardContent>
        </Card>

        {/* Migration Guide */}
        <Card className="rounded-none border-2 border-blaze-black bg-blaze-orange/10">
          <CardHeader>
            <CardTitle className="font-display text-2xl">
              V2 Migration Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="font-mono text-sm space-y-2">
            <p>✅ V2 contracts deployed</p>
            <p>✅ Database migration applied</p>
            <p>✅ Frontend updated with V2 SDK</p>
            <p className="pt-4 font-bold">Next steps:</p>
            <ol className="list-decimal list-inside space-y-1 pl-4">
              <li>Update oracle price regularly (use API or this dashboard)</li>
              <li>Monitor token migrations in database</li>
              <li>Configure Hyperion DEX addresses when ready</li>
              <li>Test full flow on devnet before mainnet</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


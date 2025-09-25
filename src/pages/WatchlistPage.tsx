import { usePortfolioStore } from "@/stores/portfolioStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Star,
  TrendingUp,
  TrendingDown,
  X,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster, toast } from "@/components/ui/sonner";
import { api } from "@/lib/api-client";
import { useEffect, useState, useCallback } from "react";
import type { Token } from "@shared/types";

export function WatchlistPage() {
  const { isConnected, address, removeFromWatchlist } = usePortfolioStore();
  const [watchlist, setWatchlist] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWatchlist = useCallback(
    async (showRefreshIndicator = false) => {
      if (!isConnected || !address) {
        setWatchlist([]);
        setLoading(false);
        return;
      }

      try {
        if (showRefreshIndicator) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const data = await api<{ items: Token[] }>(`/api/watchlist/${address}`);
        setWatchlist(data.items);
      } catch (err) {
        setError("Failed to fetch watchlist");
        toast.error("Failed to fetch watchlist");
        console.error(err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isConnected, address]
  );

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const handleRemove = async (tokenName: string, tokenId: string) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      await api(`/api/watchlist/${address}/remove`, {
        method: "POST",
        body: JSON.stringify({ tokenId }),
      });

      // Update local state
      setWatchlist((prev) => prev.filter((token) => token.id !== tokenId));

      // Also update the store for consistency
      removeFromWatchlist(tokenId);

      toast.success(`${tokenName} removed from watchlist`);
    } catch (error) {
      toast.error("Failed to remove token from watchlist");
      console.error(error);
    }
  };

  const handleRefresh = () => {
    fetchWatchlist(true);
  };

  if (!isConnected) {
    return (
      <div className="p-4 md:p-8 h-full flex flex-col items-center justify-center text-center">
        <Wallet className="w-24 h-24 text-blaze-black/50" />
        <h1 className="font-display text-5xl font-bold mt-4">CONNECT WALLET</h1>
        <p className="font-mono text-lg mt-2 max-w-md">
          Connect your wallet to view your watchlist and manage your favorite
          tokens.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8 font-mono">
        <div className="max-w-7xl mx-auto space-y-8">
          <h1 className="font-display text-6xl md:text-8xl font-bold text-blaze-black">
            WATCHLIST
          </h1>
          <div className="border-2 border-blaze-black bg-blaze-white shadow-blaze-shadow p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full bg-blaze-black/10" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-16 bg-blaze-black/10" />
                      <Skeleton className="h-3 w-24 bg-blaze-black/10" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-20 bg-blaze-black/10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 font-mono">
        <Toaster richColors closeButton />
        <div className="max-w-7xl mx-auto space-y-8">
          <h1 className="font-display text-6xl md:text-8xl font-bold text-blaze-black">
            WATCHLIST
          </h1>
          <div className="border-2 border-red-600 bg-red-50 p-6 text-center">
            <h3 className="font-display text-3xl font-bold text-red-600">
              ERROR
            </h3>
            <p className="mt-2 text-red-800">{error}</p>
            <Button
              onClick={() => fetchWatchlist()}
              className="mt-4 h-12 rounded-none border-2 border-red-600 bg-red-600 text-white font-bold uppercase hover:bg-red-700"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (watchlist.length === 0) {
    return (
      <div className="p-4 md:p-8 h-full flex flex-col items-center justify-center text-center">
        <Toaster richColors closeButton />
        <Star className="w-24 h-24 text-blaze-black/50" />
        <h1 className="font-display text-5xl font-bold mt-4">
          EMPTY WATCHLIST
        </h1>
        <p className="font-mono text-lg mt-2 max-w-md">
          You haven't added any tokens to your watchlist. Swipe up on a token in
          the Trade page to add it!
        </p>
        <Button
          onClick={handleRefresh}
          className="mt-6 h-12 rounded-none border-2 border-blaze-black bg-blaze-orange text-blaze-black font-bold uppercase hover:bg-blaze-black hover:text-blaze-white"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 font-mono">
      <Toaster richColors closeButton />
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-6xl md:text-8xl font-bold text-blaze-black">
            WATCHLIST
          </h1>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-12 rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black font-bold uppercase hover:bg-blaze-black/5"
          >
            <RefreshCw
              className={`w-5 h-5 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        <div className="border-2 border-blaze-black bg-blaze-white shadow-blaze-shadow">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-blaze-black hover:bg-blaze-white">
                <TableHead className="font-mono text-lg uppercase tracking-widest">
                  Asset
                </TableHead>
                <TableHead className="text-right font-mono text-lg uppercase tracking-widest">
                  Price
                </TableHead>
                <TableHead className="text-right font-mono text-lg uppercase tracking-widest">
                  24h Change
                </TableHead>
                <TableHead className="text-right font-mono text-lg uppercase tracking-widest">
                  Market Cap
                </TableHead>
                <TableHead className="text-right font-mono text-lg uppercase tracking-widest">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {watchlist.map((token) => {
                const isPositiveChange = token.change24h >= 0;
                return (
                  <TableRow
                    key={token.id}
                    className="border-b-2 border-blaze-black last:border-b-0 font-mono font-bold text-2xl hover:bg-blaze-white/50"
                  >
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <img
                          src={token.logoUrl}
                          alt={token.name}
                          className="w-10 h-10"
                        />
                        <div>
                          <p>{token.symbol}</p>
                          <p className="text-base font-normal text-blaze-black/60">
                            {token.name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      $
                      {token.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 5,
                      })}
                    </TableCell>
                    <TableCell
                      className={`text-right ${
                        isPositiveChange ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {isPositiveChange ? (
                          <TrendingUp size={20} />
                        ) : (
                          <TrendingDown size={20} />
                        )}
                        {token.change24h.toFixed(2)}%
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      ${token.marketCap.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-none text-blaze-black/50 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => handleRemove(token.symbol, token.id)}
                      >
                        <X className="w-6 h-6" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

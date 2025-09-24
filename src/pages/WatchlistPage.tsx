import { usePortfolioStore } from "@/stores/portfolioStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, TrendingUp, TrendingDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "@/components/ui/sonner";
export function WatchlistPage() {
  const { watchlist, removeFromWatchlist } = usePortfolioStore();
  const handleRemove = (tokenName: string, tokenId: string) => {
    removeFromWatchlist(tokenId);
    toast.success(`${tokenName} removed from watchlist.`);
  };
  if (watchlist.length === 0) {
    return (
      <div className="p-4 md:p-8 h-full flex flex-col items-center justify-center text-center">
        <Star className="w-24 h-24 text-blaze-black/50" />
        <h1 className="font-display text-5xl font-bold mt-4">EMPTY WATCHLIST</h1>
        <p className="font-mono text-lg mt-2 max-w-md">You haven't added any tokens to your watchlist. Swipe up on a token in the Trade page to add it!</p>
      </div>
    );
  }
  return (
    <div className="p-4 md:p-8 font-mono">
      <Toaster richColors closeButton />
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="font-display text-6xl md:text-8xl font-bold text-blaze-black">WATCHLIST</h1>
        <div className="border-2 border-blaze-black bg-blaze-white shadow-blaze-shadow">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-blaze-black hover:bg-blaze-white">
                <TableHead className="font-mono text-lg uppercase tracking-widest">Asset</TableHead>
                <TableHead className="text-right font-mono text-lg uppercase tracking-widest">Price</TableHead>
                <TableHead className="text-right font-mono text-lg uppercase tracking-widest">24h Change</TableHead>
                <TableHead className="text-right font-mono text-lg uppercase tracking-widest">Market Cap</TableHead>
                <TableHead className="text-right font-mono text-lg uppercase tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {watchlist.map((token) => {
                const isPositiveChange = token.change24h >= 0;
                return (
                  <TableRow key={token.id} className="border-b-2 border-blaze-black last:border-b-0 font-mono font-bold text-2xl hover:bg-blaze-white/50">
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <img src={token.logoUrl} alt={token.name} className="w-10 h-10" />
                        <div>
                          <p>{token.symbol}</p>
                          <p className="text-base font-normal text-blaze-black/60">{token.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}</TableCell>
                    <TableCell className={`text-right ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
                      <div className="flex items-center justify-end gap-1">
                        {isPositiveChange ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                        {token.change24h.toFixed(2)}%
                      </div>
                    </TableCell>
                    <TableCell className="text-right">${token.marketCap.toLocaleString()}</TableCell>
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
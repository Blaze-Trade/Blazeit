import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, Wallet, X } from "lucide-react";
import { usePortfolioStore } from "@/stores/portfolioStore";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Holding } from "@shared/types";
import { toast } from "sonner";
export function AnalysisPage() {
  const { isConnected, holdings, sellToken } = usePortfolioStore();
  const [sellCandidate, setSellCandidate] = useState<Holding | null>(null);
  const portfolioData = useMemo(() => {
    const totalValue = holdings.reduce((acc, h) => acc + h.value, 0);
    const totalCost = holdings.reduce((acc, h) => acc + h.cost, 0);
    const pnl = totalValue - totalCost;
    const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
    return {
      value: totalValue,
      pnl,
      pnlPercent,
      holdings: holdings.map(h => {
        const holdingPnl = h.value - h.cost;
        const holdingPnlPercent = h.cost > 0 ? (holdingPnl / h.cost) * 100 : 0;
        return { ...h, pnl: holdingPnl, pnlPercent: holdingPnlPercent };
      }).sort((a, b) => b.value - a.value)
    };
  }, [holdings]);
  const handleSell = () => {
    if (sellCandidate) {
      sellToken(sellCandidate.id, sellCandidate.quantity);
      toast.success(`Sold ${sellCandidate.quantity.toFixed(2)} ${sellCandidate.symbol}`);
      setSellCandidate(null);
    }
  };
  if (!isConnected) {
    return (
      <div className="p-4 md:p-8 h-full flex flex-col items-center justify-center text-center">
        <Wallet className="w-24 h-24 text-blaze-black/50" />
        <h1 className="font-display text-5xl font-bold mt-4">CONNECT WALLET</h1>
        <p className="font-mono text-lg mt-2 max-w-md">Connect your wallet to view your portfolio analysis and track your holdings.</p>
      </div>
    );
  }
  if (portfolioData.holdings.length === 0) {
    return (
      <div className="p-4 md:p-8 h-full flex flex-col items-center justify-center text-center">
        <h1 className="font-display text-5xl font-bold mt-4">EMPTY PORTFOLIO</h1>
        <p className="font-mono text-lg mt-2 max-w-md">You don't have any holdings yet. Go to the Trade page to start building your portfolio!</p>
      </div>
    );
  }
  const isPositivePnl = portfolioData.pnl >= 0;
  return (
    <div className="p-4 md:p-8 font-mono">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="font-display text-6xl md:text-8xl font-bold text-blaze-black">ANALYSIS</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="rounded-none border-2 border-blaze-black p-6 shadow-blaze-shadow">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="font-mono text-xl uppercase tracking-widest text-blaze-black/70">Portfolio Value</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="font-mono font-bold text-7xl tracking-tighter">${portfolioData.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
          <Card className="rounded-none border-2 border-blaze-black p-6 shadow-blaze-shadow">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="font-mono text-xl uppercase tracking-widest text-blaze-black/70">Total P&L</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className={`flex items-baseline gap-4 font-bold ${isPositivePnl ? 'text-green-600' : 'text-red-600'}`}>
                <p className="font-mono text-7xl tracking-tighter">{isPositivePnl ? '+' : '-'}${Math.abs(portfolioData.pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="font-mono text-4xl">({portfolioData.pnlPercent.toFixed(2)}%)</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="border-2 border-blaze-black bg-blaze-white shadow-blaze-shadow">
          <h2 className="font-display text-4xl font-bold p-6 border-b-2 border-blaze-black">HOLDINGS</h2>
          <AlertDialog>
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-blaze-black hover:bg-blaze-white">
                  <TableHead className="font-mono text-lg uppercase tracking-widest">Asset</TableHead>
                  <TableHead className="text-right font-mono text-lg uppercase tracking-widest">Value</TableHead>
                  <TableHead className="text-right font-mono text-lg uppercase tracking-widest">P&L</TableHead>
                  <TableHead className="text-right font-mono text-lg uppercase tracking-widest">P&L %</TableHead>
                  <TableHead className="text-right font-mono text-lg uppercase tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolioData.holdings.map((holding) => {
                  const isHoldingPositive = holding.pnl >= 0;
                  return (
                    <TableRow key={holding.symbol} className="border-b-2 border-blaze-black last:border-b-0 font-mono font-bold text-2xl hover:bg-blaze-white/50">
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <img src={holding.logoUrl} alt={holding.name} className="w-10 h-10" />
                          <div>
                            <p>{holding.symbol}</p>
                            <p className="text-base font-normal text-blaze-black/60">{holding.quantity.toFixed(4)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">${holding.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className={`text-right ${isHoldingPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isHoldingPositive ? '+' : '-'}${Math.abs(holding.pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className={`text-right ${isHoldingPositive ? 'text-green-600' : 'text-red-600'}`}>
                        <div className="flex items-center justify-end gap-1">
                          {isHoldingPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                          {holding.pnlPercent.toFixed(2)}%
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-none text-blaze-black/50 hover:text-red-600 hover:bg-red-500/10" onClick={() => setSellCandidate(holding)}>
                            <X className="w-6 h-6" />
                          </Button>
                        </AlertDialogTrigger>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <AlertDialogContent className="rounded-none border-2 border-blaze-black bg-blaze-white">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display text-4xl">Confirm Sale</AlertDialogTitle>
                <AlertDialogDescription className="font-mono text-lg">
                  Are you sure you want to sell all {sellCandidate?.quantity.toFixed(4)} {sellCandidate?.symbol} for an estimated ${sellCandidate?.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-none h-12 border-2 border-blaze-black font-bold uppercase">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSell} className="rounded-none h-12 bg-blaze-orange text-blaze-black font-bold uppercase hover:bg-blaze-orange/80">Sell</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
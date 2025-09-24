import { useEffect, useState, useMemo, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { useAptos } from '@/hooks/useAptos';
import type { QuestPortfolio, Holding } from '@shared/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { X } from 'lucide-react';
interface QuestPortfolioProps {
  questId: string;
  userId: string;
}
export function QuestPortfolio({ questId, userId }: QuestPortfolioProps) {
  const [portfolio, setPortfolio] = useState<QuestPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const { simulateTransaction } = useAptos();
  const fetchPortfolio = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api<QuestPortfolio>(`/api/quests/${questId}/portfolio/${userId}`);
      setPortfolio(data);
    } catch (error) {
      setPortfolio(null);
    } finally {
      setLoading(false);
    }
  }, [questId, userId]);
  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);
  const handleSell = async (holding: Holding) => {
    try {
      const result = await simulateTransaction(`Selling ${holding.quantity} ${holding.symbol}`);
      if (!result.success) return;
      await api(`/api/quests/${questId}/sell`, {
        method: 'POST',
        body: JSON.stringify({ userId, tokenId: holding.id, quantity: holding.quantity }),
      });
      toast.success(`Sold ${holding.quantity} ${holding.symbol}`);
      fetchPortfolio();
    } catch (error) {
      // Error toast handled by hook
    }
  };
  const sortedHoldings = useMemo(() => {
    return portfolio?.holdings.sort((a, b) => b.value - a.value) || [];
  }, [portfolio]);
  if (loading) {
    return <div className="p-6"><Skeleton className="h-48 w-full" /></div>;
  }
  return (
    <div>
      <h2 className="font-display text-4xl font-bold p-6 border-b-2 border-blaze-black">Your Portfolio</h2>
      {!portfolio || portfolio.holdings.length === 0 ? (
        <p className="p-6 font-mono text-lg text-center">Your portfolio is empty. Go build it!</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-blaze-black hover:bg-blaze-white">
              <TableHead className="font-mono text-sm uppercase tracking-widest">Asset</TableHead>
              <TableHead className="text-right font-mono text-sm uppercase tracking-widest">Value</TableHead>
              <TableHead className="text-right font-mono text-sm uppercase tracking-widest">Sell</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedHoldings.map((holding) => (
              <TableRow key={holding.symbol} className="border-b-2 border-blaze-black last:border-b-0 font-mono font-bold text-lg hover:bg-blaze-white/50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <img src={holding.logoUrl} alt={holding.name} className="w-8 h-8" />
                    <div>
                      <p>{holding.symbol}</p>
                      <p className="text-sm font-normal text-blaze-black/60">{holding.quantity.toFixed(2)}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">${holding.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-none text-blaze-black/50 hover:text-red-600 hover:bg-red-500/10"
                    onClick={() => handleSell(holding)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
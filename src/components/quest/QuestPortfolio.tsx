"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabaseApi } from "@/lib/supabase-api";
import type { QuestPortfolio } from "@shared/types";
import { TrendingDown, TrendingUp } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

interface QuestPortfolioProps {
  questId: string;
  userId: string;
}
export function QuestPortfolio({ questId, userId }: QuestPortfolioProps) {
  const [portfolio, setPortfolio] = useState<QuestPortfolio | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = useCallback(async () => {
    try {
      setLoading(true);
      const result = await supabaseApi.quests.getQuestPortfolio(
        questId,
        userId
      );

      if (result.success && result.data) {
        setPortfolio(result.data);
      } else {
        setPortfolio(null);
      }
    } catch (error) {
      console.error("Failed to fetch portfolio:", error);
      setPortfolio(null);
    } finally {
      setLoading(false);
    }
  }, [questId, userId]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);
  const sortedHoldings = useMemo(() => {
    return portfolio?.holdings.sort((a, b) => b.value - a.value) || [];
  }, [portfolio]);

  const totalPortfolioValue = useMemo(() => {
    return sortedHoldings.reduce((sum, holding) => sum + holding.value, 0);
  }, [sortedHoldings]);

  const totalPortfolioCost = useMemo(() => {
    return sortedHoldings.reduce((sum, holding) => sum + holding.cost, 0);
  }, [sortedHoldings]);

  const totalPNL = useMemo(() => {
    return totalPortfolioValue - totalPortfolioCost;
  }, [totalPortfolioValue, totalPortfolioCost]);

  const totalPNLPercent = useMemo(() => {
    if (totalPortfolioCost === 0) return 0;
    return (totalPNL / totalPortfolioCost) * 100;
  }, [totalPNL, totalPortfolioCost]);
  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  return (
    <div>
      <h2 className="font-display text-3xl font-bold p-6 border-b-2 border-blaze-black">
        Your Portfolio
      </h2>
      {!portfolio || portfolio.holdings.length === 0 ? (
        <div className="p-6 text-center">
          <p className="font-mono text-lg text-blaze-black/70 mb-4">
            You haven&apos;t selected your portfolio yet.
          </p>
          <p className="font-mono text-sm text-blaze-black/50">
            Click &quot;Build Portfolio&quot; to select your tokens for this
            quest.
          </p>
        </div>
      ) : (
        <>
          {/* Portfolio Summary */}
          <div className="p-6 border-b-2 border-blaze-black bg-blaze-orange/5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-blaze-black/70 font-mono font-bold">
                  Total Value
                </p>
                <p className="text-2xl font-bold font-mono">
                  ${totalPortfolioValue.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-blaze-black/70 font-mono font-bold">
                  P&L
                </p>
                <div className="flex items-center gap-2">
                  {totalPNL >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                  <p
                    className={`text-2xl font-bold font-mono ${
                      totalPNL >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {totalPNL >= 0 ? "+" : ""}
                    {totalPNLPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Holdings Table */}
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-blaze-black hover:bg-blaze-white">
                <TableHead className="font-mono text-sm uppercase tracking-widest">
                  Token
                </TableHead>
                <TableHead className="text-right font-mono text-sm uppercase tracking-widest">
                  Qty
                </TableHead>
                <TableHead className="text-right font-mono text-sm uppercase tracking-widest">
                  Cost
                </TableHead>
                <TableHead className="text-right font-mono text-sm uppercase tracking-widest">
                  Value
                </TableHead>
                <TableHead className="text-right font-mono text-sm uppercase tracking-widest">
                  P&L
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedHoldings.map((holding) => {
                const holdingPNL = holding.value - holding.cost;
                const holdingPNLPercent = (holdingPNL / holding.cost) * 100;
                return (
                  <TableRow
                    key={holding.id}
                    className="border-b border-blaze-black/20 last:border-b-0 font-mono hover:bg-blaze-white/50"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {holding.logoUrl && (
                          <Image
                            src={holding.logoUrl}
                            alt={holding.name}
                            width={32}
                            height={32}
                            className="w-8 h-8"
                          />
                        )}
                        {!holding.logoUrl && (
                          <div className="w-8 h-8 bg-blaze-black/10 flex items-center justify-center border-2 border-blaze-black">
                            <span className="text-blaze-black/50 font-bold text-xs">
                              {holding.symbol.slice(0, 2)}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-bold">{holding.symbol}</p>
                          <p className="text-xs text-blaze-black/60">
                            {holding.name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {holding.quantity.toFixed(4)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${holding.cost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ${holding.value.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold ${
                        holdingPNL >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {holdingPNL >= 0 ? "+" : ""}
                      {holdingPNLPercent.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}

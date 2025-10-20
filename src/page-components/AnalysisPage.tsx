"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBlockchainPortfolio } from "@/hooks/useBlockchainPortfolio";
import { useSupabasePortfolio } from "@/hooks/useSupabasePortfolio";
import { usePortfolioStore } from "@/stores/portfolioStore";
import type { Holding } from "@shared/types";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  Calendar,
  DollarSign,
  Eye,
  EyeOff,
  PieChart,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
export function AnalysisPage() {
  const router = useRouter();
  const { isConnected, address } = usePortfolioStore();
  const {
    holdings: supabaseHoldings,
    sellToken: sellTokenSupabase,
    refetch: refetchSupabase,
  } = useSupabasePortfolio(address);
  const {
    holdings: blockchainHoldings,
    loading: blockchainLoading,
    error: blockchainError,
    refetch: refetchBlockchain,
  } = useBlockchainPortfolio();
  const [sellCandidate, setSellCandidate] = useState<Holding | null>(null);
  const [sellAmount, setSellAmount] = useState<number>(0);
  const [showValues, setShowValues] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState<
    "blockchain" | "supabase" | "combined"
  >("blockchain");

  const portfolioData = useMemo(() => {
    // Determine which holdings to use based on data source
    let holdings: Holding[] = [];

    switch (dataSource) {
      case "blockchain":
        holdings = blockchainHoldings;
        break;
      case "supabase":
        holdings = supabaseHoldings;
        break;
      case "combined": {
        // Merge blockchain and Supabase holdings, prioritizing blockchain data
        const blockchainMap = new Map(blockchainHoldings.map((h) => [h.id, h]));
        const combinedHoldings = [...blockchainHoldings];

        supabaseHoldings.forEach((supabaseHolding) => {
          if (!blockchainMap.has(supabaseHolding.id)) {
            combinedHoldings.push(supabaseHolding);
          }
        });
        holdings = combinedHoldings;
        break;
      }
    }

    const totalValue = holdings.reduce((acc, h) => acc + h.value, 0);
    const totalCost = holdings.reduce((acc, h) => acc + h.cost, 0);
    const pnl = totalValue - totalCost;
    const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;

    // Calculate additional metrics
    const bestPerformer = holdings.reduce((best, h) => {
      const holdingPnlPercent =
        h.cost > 0 ? ((h.value - h.cost) / h.cost) * 100 : 0;
      const bestPnlPercent =
        best.cost > 0 ? ((best.value - best.cost) / best.cost) * 100 : 0;
      return holdingPnlPercent > bestPnlPercent ? h : best;
    }, holdings[0] || null);

    const worstPerformer = holdings.reduce((worst, h) => {
      const holdingPnlPercent =
        h.cost > 0 ? ((h.value - h.cost) / h.cost) * 100 : 0;
      const worstPnlPercent =
        worst.cost > 0 ? ((worst.value - worst.cost) / worst.cost) * 100 : 0;
      return holdingPnlPercent < worstPnlPercent ? h : worst;
    }, holdings[0] || null);

    const diversification =
      holdings.length > 0
        ? holdings
            .map((h) => (h.value / totalValue) * 100)
            .reduce((max, percent) => Math.max(max, percent), 0)
        : 0;

    const riskScore =
      holdings.length > 0
        ? Math.min(
            100,
            Math.max(0, 100 - diversification * 2 + Math.abs(pnlPercent) / 2)
          )
        : 50;

    const holdingsWithMetrics = holdings
      .map((h) => {
        const holdingPnl = h.value - h.cost;
        const holdingPnlPercent = h.cost > 0 ? (holdingPnl / h.cost) * 100 : 0;
        const allocation = totalValue > 0 ? (h.value / totalValue) * 100 : 0;
        return {
          ...h,
          pnl: holdingPnl,
          pnlPercent: holdingPnlPercent,
          allocation: allocation,
        };
      })
      .sort((a, b) => b.value - a.value);

    return {
      value: totalValue,
      cost: totalCost,
      pnl,
      pnlPercent,
      holdings: holdingsWithMetrics,
      bestPerformer,
      worstPerformer,
      diversification: 100 - diversification,
      riskScore,
      totalHoldings: holdings.length,
      avgAllocation: holdings.length > 0 ? 100 / holdings.length : 0,
      dataSource: dataSource,
      blockchainCount: blockchainHoldings.length,
      supabaseCount: supabaseHoldings.length,
    };
  }, [dataSource, blockchainHoldings, supabaseHoldings]);
  const handleSell = async () => {
    if (sellCandidate) {
      const quantityToSell = Math.max(
        0,
        Math.min(sellCandidate.quantity, sellAmount || 0)
      );
      if (quantityToSell <= 0) {
        toast.error("Enter a valid amount to sell");
        return;
      }
      const result = await sellTokenSupabase(sellCandidate.id, quantityToSell);
      if (result.success) {
        toast.success(
          `Sold ${quantityToSell.toFixed(2)} ${sellCandidate.symbol}`
        );
        setSellCandidate(null);
        setSellAmount(0);
      } else {
        toast.error(result.error || "Failed to sell token");
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh both data sources
      await Promise.all([refetchBlockchain(), refetchSupabase()]);
      toast.success("Portfolio updated from blockchain and database");
    } catch (error) {
      toast.error("Failed to refresh portfolio: " + error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatValue = (value: number) => {
    if (!showValues) return "••••••";
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  if (!isConnected) {
    return (
      <div className="p-4 md:p-8 h-full flex flex-col items-center justify-center text-center">
        <Wallet className="w-24 h-24 text-blaze-black/50" />
        <h1 className="font-display text-5xl font-bold mt-4">CONNECT WALLET</h1>
        <p className="font-mono text-lg mt-2 max-w-md">
          Connect your wallet to view your portfolio analysis and track your
          holdings.
        </p>
      </div>
    );
  }
  if (portfolioData.holdings.length === 0) {
    return (
      <div className="p-4 md:p-8 h-full flex flex-col items-center justify-center text-center">
        <h1 className="font-display text-5xl font-bold mt-4">
          EMPTY PORTFOLIO
        </h1>
        <p className="font-mono text-lg mt-2 max-w-md">
          You don&apos;t have any holdings yet. Go to the Trade page to start
          building your portfolio!
        </p>
      </div>
    );
  }
  const isPositivePnl = portfolioData.pnl >= 0;
  const riskLevel =
    portfolioData.riskScore > 70
      ? "High"
      : portfolioData.riskScore > 40
      ? "Medium"
      : "Low";
  const riskColor =
    portfolioData.riskScore > 70
      ? "text-red-600"
      : portfolioData.riskScore > 40
      ? "text-yellow-600"
      : "text-green-600";

  return (
    <div className="p-4 md:p-8 font-mono">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="font-display text-6xl md:text-8xl font-bold text-blaze-black">
              ANALYSIS
            </h1>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`rounded-none border-2 font-mono font-bold ${
                  dataSource === "blockchain"
                    ? "border-green-600 text-green-600 bg-green-50"
                    : dataSource === "supabase"
                    ? "border-blue-600 text-blue-600 bg-blue-50"
                    : "border-purple-600 text-purple-600 bg-purple-50"
                }`}
              >
                {dataSource === "blockchain"
                  ? "BLOCKCHAIN"
                  : dataSource === "supabase"
                  ? "DATABASE"
                  : "COMBINED"}
              </Badge>
              {blockchainLoading && (
                <Badge
                  variant="outline"
                  className="rounded-none border-2 border-yellow-600 text-yellow-600 bg-yellow-50 font-mono font-bold"
                >
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  SYNCING
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={dataSource}
              onChange={(e) =>
                setDataSource(
                  e.target.value as "blockchain" | "supabase" | "combined"
                )
              }
              className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black font-mono font-bold uppercase px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blaze-orange"
            >
              <option value="blockchain">Blockchain Data</option>
              <option value="supabase">Database Data</option>
              <option value="combined">Combined View</option>
            </select>
            <Button
              onClick={() => setShowValues(!showValues)}
              variant="outline"
              size="sm"
              className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black font-bold uppercase hover:bg-blaze-black hover:text-blaze-white"
            >
              {showValues ? (
                <EyeOff className="w-4 h-4 mr-2" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              {showValues ? "Hide" : "Show"}
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black font-bold uppercase hover:bg-blaze-black hover:text-blaze-white"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Portfolio Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="rounded-none border-2 border-blaze-black p-6 shadow-blaze-shadow">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="font-mono text-lg uppercase tracking-widest text-blaze-black/70 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Portfolio Value
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="font-mono font-bold text-4xl tracking-tighter">
                ${formatValue(portfolioData.value)}
              </p>
              <p className="font-mono text-sm text-blaze-black/60 mt-1">
                Total Investment
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-none border-2 border-blaze-black p-6 shadow-blaze-shadow">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="font-mono text-lg uppercase tracking-widest text-blaze-black/70 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Total P&L
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div
                className={`flex items-baseline gap-2 font-bold ${
                  isPositivePnl ? "text-green-600" : "text-red-600"
                }`}
              >
                <p className="font-mono text-4xl tracking-tighter">
                  {isPositivePnl ? "+" : "-"}$
                  {formatValue(Math.abs(portfolioData.pnl))}
                </p>
                <p className="font-mono text-xl">
                  ({portfolioData.pnlPercent.toFixed(2)}%)
                </p>
              </div>
              <p className="font-mono text-sm text-blaze-black/60 mt-1">
                Profit/Loss
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-none border-2 border-blaze-black p-6 shadow-blaze-shadow">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="font-mono text-lg uppercase tracking-widest text-blaze-black/70 flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Diversification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="font-mono font-bold text-4xl tracking-tighter">
                {portfolioData.diversification.toFixed(1)}%
              </p>
              <Progress
                value={portfolioData.diversification}
                className="mt-2 h-2"
              />
              <p className="font-mono text-sm text-blaze-black/60 mt-1">
                Well Diversified
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-none border-2 border-blaze-black p-6 shadow-blaze-shadow">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="font-mono text-lg uppercase tracking-widest text-blaze-black/70 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Risk Score
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p
                className={`font-mono font-bold text-4xl tracking-tighter ${riskColor}`}
              >
                {portfolioData.riskScore.toFixed(0)}
              </p>
              <Progress value={portfolioData.riskScore} className="mt-2 h-2" />
              <p className={`font-mono text-sm mt-1 ${riskColor}`}>
                {riskLevel} Risk
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Data Source Information */}
        <Card className="rounded-none border-2 border-blaze-black p-6 shadow-blaze-shadow">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="font-mono text-xl uppercase tracking-widest text-blaze-black/70 flex items-center gap-2">
              <Activity className="w-6 h-6" />
              Data Sources
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 border border-green-600/20 bg-green-50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <span className="font-mono text-sm font-bold text-green-600">
                    Blockchain
                  </span>
                </div>
                <span className="font-mono font-bold text-lg text-green-600">
                  {portfolioData.blockchainCount} assets
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border border-blue-600/20 bg-blue-50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span className="font-mono text-sm font-bold text-blue-600">
                    Database
                  </span>
                </div>
                <span className="font-mono font-bold text-lg text-blue-600">
                  {portfolioData.supabaseCount} assets
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border border-purple-600/20 bg-purple-50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                  <span className="font-mono text-sm font-bold text-purple-600">
                    Total
                  </span>
                </div>
                <span className="font-mono font-bold text-lg text-purple-600">
                  {portfolioData.totalHoldings} assets
                </span>
              </div>
            </div>
            {blockchainError && (
              <div className="mt-4 p-3 border border-red-600/20 bg-red-50">
                <p className="font-mono text-sm text-red-600">
                  ⚠️ Blockchain sync error: {blockchainError}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="rounded-none border-2 border-blaze-black p-6 shadow-blaze-shadow">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="font-mono text-xl uppercase tracking-widest text-blaze-black/70 flex items-center gap-2">
                <Award className="w-6 h-6" />
                Best Performer
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {portfolioData.bestPerformer ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {portfolioData.bestPerformer.logoUrl && (
                      <Image
                        src={portfolioData.bestPerformer.logoUrl}
                        alt={portfolioData.bestPerformer.name}
                        width={40}
                        height={40}
                        className="w-10 h-10"
                      />
                    )}
                    {!portfolioData.bestPerformer.logoUrl && (
                      <div className="w-10 h-10 bg-blaze-black/10 flex items-center justify-center border-2 border-blaze-black">
                        <span className="text-blaze-black/50 font-bold text-xs">
                          {portfolioData.bestPerformer.symbol.slice(0, 2)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-mono font-bold text-lg">
                        {portfolioData.bestPerformer.symbol}
                      </p>
                      <p className="font-mono text-sm text-blaze-black/60">
                        {portfolioData.bestPerformer.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <ArrowUpRight className="w-5 h-5" />
                    <p className="font-mono font-bold text-xl">
                      +
                      {(
                        ((portfolioData.bestPerformer.value -
                          portfolioData.bestPerformer.cost) /
                          portfolioData.bestPerformer.cost) *
                        100
                      ).toFixed(2)}
                      %
                    </p>
                  </div>
                </div>
              ) : (
                <p className="font-mono text-blaze-black/60">No holdings</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-none border-2 border-blaze-black p-6 shadow-blaze-shadow">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="font-mono text-xl uppercase tracking-widest text-blaze-black/70 flex items-center gap-2">
                <Target className="w-6 h-6" />
                Portfolio Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm text-blaze-black/70">
                    Total Holdings
                  </span>
                  <span className="font-mono font-bold text-lg">
                    {portfolioData.totalHoldings}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm text-blaze-black/70">
                    Avg Allocation
                  </span>
                  <span className="font-mono font-bold text-lg">
                    {portfolioData.avgAllocation.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm text-blaze-black/70">
                    Total Cost
                  </span>
                  <span className="font-mono font-bold text-lg">
                    ${formatValue(portfolioData.cost)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-2 border-blaze-black p-6 shadow-blaze-shadow">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="font-mono text-xl uppercase tracking-widest text-blaze-black/70 flex items-center gap-2">
                <TrendingDown className="w-6 h-6" />
                Worst Performer
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {portfolioData.worstPerformer ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {portfolioData.worstPerformer.logoUrl && (
                      <Image
                        src={portfolioData.worstPerformer.logoUrl}
                        alt={portfolioData.worstPerformer.name}
                        width={40}
                        height={40}
                        className="w-10 h-10"
                      />
                    )}
                    {!portfolioData.worstPerformer.logoUrl && (
                      <div className="w-10 h-10 bg-blaze-black/10 flex items-center justify-center border-2 border-blaze-black">
                        <span className="text-blaze-black/50 font-bold text-xs">
                          {portfolioData.worstPerformer.symbol.slice(0, 2)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-mono font-bold text-lg">
                        {portfolioData.worstPerformer.symbol}
                      </p>
                      <p className="font-mono text-sm text-blaze-black/60">
                        {portfolioData.worstPerformer.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-red-600">
                    <ArrowDownRight className="w-5 h-5" />
                    <p className="font-mono font-bold text-xl">
                      {(
                        ((portfolioData.worstPerformer.value -
                          portfolioData.worstPerformer.cost) /
                          portfolioData.worstPerformer.cost) *
                        100
                      ).toFixed(2)}
                      %
                    </p>
                  </div>
                </div>
              ) : (
                <p className="font-mono text-blaze-black/60">No holdings</p>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Detailed Holdings Table */}
        <div className="border-2 border-blaze-black bg-blaze-white shadow-blaze-shadow">
          <div className="p-6 border-b-2 border-blaze-black">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-4xl font-bold">
                DETAILED HOLDINGS
              </h2>
              <Badge
                variant="outline"
                className="rounded-none border-2 border-blaze-black font-mono font-bold"
              >
                {portfolioData.totalHoldings} Assets
              </Badge>
            </div>
          </div>
          <AlertDialog>
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-blaze-black hover:bg-blaze-white">
                  <TableHead className="font-mono text-lg uppercase tracking-widest">
                    Asset
                  </TableHead>
                  <TableHead className="text-right font-mono text-lg uppercase tracking-widest">
                    Allocation
                  </TableHead>
                  <TableHead className="text-right font-mono text-lg uppercase tracking-widest">
                    Value
                  </TableHead>
                  <TableHead className="text-right font-mono text-lg uppercase tracking-widest">
                    P&L
                  </TableHead>
                  <TableHead className="text-right font-mono text-lg uppercase tracking-widest">
                    P&L %
                  </TableHead>
                  <TableHead className="text-right font-mono text-lg uppercase tracking-widest">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolioData.holdings.map((holding) => {
                  const isHoldingPositive = holding.pnl >= 0;
                  return (
                    <TableRow
                      key={holding.symbol}
                      className="border-b-2 border-blaze-black last:border-b-0 font-mono font-bold text-xl hover:bg-blaze-white/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-4">
                          {holding.logoUrl && (
                            <Image
                              src={holding.logoUrl}
                              alt={holding.name}
                              width={48}
                              height={48}
                              className="w-12 h-12"
                            />
                          )}
                          {!holding.logoUrl && (
                            <div className="w-12 h-12 bg-blaze-black/10 flex items-center justify-center border-2 border-blaze-black">
                              <span className="text-blaze-black/50 font-bold text-xs">
                                {holding.symbol.slice(0, 2)}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-xl">
                              {holding.symbol}
                            </p>
                            <p className="text-sm font-normal text-blaze-black/60">
                              {holding.name}
                            </p>
                            <p className="text-sm font-normal text-blaze-black/60">
                              {holding.quantity.toFixed(4)} tokens
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <p className="font-bold text-lg">
                            {holding.allocation.toFixed(1)}%
                          </p>
                          <Progress
                            value={holding.allocation}
                            className="h-2 w-20 ml-auto"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="font-bold text-lg">
                          ${formatValue(holding.value)}
                        </p>
                        <p className="text-sm text-blaze-black/60">
                          Cost: ${formatValue(holding.cost)}
                        </p>
                      </TableCell>
                      <TableCell
                        className={`text-right ${
                          isHoldingPositive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {isHoldingPositive ? (
                            <TrendingUp size={16} />
                          ) : (
                            <TrendingDown size={16} />
                          )}
                          <p className="font-bold text-lg">
                            {isHoldingPositive ? "+" : "-"}$
                            {formatValue(Math.abs(holding.pnl))}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell
                        className={`text-right ${
                          isHoldingPositive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        <Badge
                          variant="outline"
                          className={`rounded-none border-2 font-mono font-bold ${
                            isHoldingPositive
                              ? "border-green-600 text-green-600 bg-green-50"
                              : "border-red-600 text-red-600 bg-red-50"
                          }`}
                        >
                          {isHoldingPositive ? "+" : ""}
                          {holding.pnlPercent.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-none text-blaze-black/50 hover:text-red-600 hover:bg-red-500/10"
                            onClick={() => setSellCandidate(holding)}
                          >
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
                <AlertDialogTitle className="font-display text-4xl">
                  Confirm Sale
                </AlertDialogTitle>
                <AlertDialogDescription className="font-mono text-lg space-y-3">
                  <div>
                    <p className="mb-1">Select amount to sell</p>
                    {sellCandidate && (
                      <div className="space-y-2">
                        <div className="px-1">
                          <Slider
                            value={[sellAmount || 0]}
                            min={0}
                            max={sellCandidate.quantity}
                            step={sellCandidate.quantity / 100 || 0.0001}
                            onValueChange={(v) => setSellAmount(Number(v[0]))}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.0001"
                            min="0"
                            max={sellCandidate.quantity}
                            value={sellAmount}
                            onChange={(e) =>
                              setSellAmount(
                                Math.min(
                                  sellCandidate.quantity,
                                  Math.max(0, parseFloat(e.target.value) || 0)
                                )
                              )
                            }
                            className="rounded-none border-2 border-blaze-black w-36"
                          />
                          <span className="text-sm text-blaze-black/70">
                            Max: {sellCandidate.quantity.toFixed(4)}{" "}
                            {sellCandidate.symbol}
                          </span>
                        </div>
                        <div className="text-sm text-blaze-black/70">
                          Est. proceeds: $
                          {formatValue(
                            (sellAmount || 0) *
                              (sellCandidate.value / sellCandidate.quantity)
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-none h-12 border-2 border-blaze-black font-bold uppercase">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSell}
                  className="rounded-none h-12 bg-blaze-orange text-blaze-black font-bold uppercase hover:bg-blaze-orange/80"
                >
                  Sell
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Portfolio Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="rounded-none border-2 border-blaze-black p-6 shadow-blaze-shadow">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="font-mono text-xl uppercase tracking-widest text-blaze-black/70 flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Portfolio Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border border-blaze-black/20">
                  <span className="font-mono text-sm text-blaze-black/70">
                    Portfolio Health
                  </span>
                  <Badge
                    variant="outline"
                    className={`rounded-none border-2 font-mono font-bold ${
                      portfolioData.pnlPercent > 10
                        ? "border-green-600 text-green-600 bg-green-50"
                        : portfolioData.pnlPercent > 0
                        ? "border-yellow-600 text-yellow-600 bg-yellow-50"
                        : "border-red-600 text-red-600 bg-red-50"
                    }`}
                  >
                    {portfolioData.pnlPercent > 10
                      ? "Excellent"
                      : portfolioData.pnlPercent > 0
                      ? "Good"
                      : "Needs Attention"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 border border-blaze-black/20">
                  <span className="font-mono text-sm text-blaze-black/70">
                    Diversification Score
                  </span>
                  <span className="font-mono font-bold text-lg">
                    {portfolioData.diversification.toFixed(0)}/100
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 border border-blaze-black/20">
                  <span className="font-mono text-sm text-blaze-black/70">
                    Risk Level
                  </span>
                  <span className={`font-mono font-bold text-lg ${riskColor}`}>
                    {riskLevel}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 border border-blaze-black/20">
                  <span className="font-mono text-sm text-blaze-black/70">
                    ROI
                  </span>
                  <span
                    className={`font-mono font-bold text-lg ${
                      isPositivePnl ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {portfolioData.pnlPercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-2 border-blaze-black p-6 shadow-blaze-shadow">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="font-mono text-xl uppercase tracking-widest text-blaze-black/70 flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black font-bold uppercase hover:bg-blaze-black hover:text-blaze-white h-12"
                  onClick={() => router.push("/")}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trade
                </Button>
                <Button
                  variant="outline"
                  className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black font-bold uppercase hover:bg-blaze-black hover:text-blaze-white h-12"
                  onClick={() => router.push("/watchlist")}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Watchlist
                </Button>
                <Button
                  variant="outline"
                  className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black font-bold uppercase hover:bg-blaze-black hover:text-blaze-white h-12"
                  onClick={() => router.push("/quests")}
                >
                  <Award className="w-4 h-4 mr-2" />
                  Quests
                </Button>
                <Button
                  variant="outline"
                  className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black font-bold uppercase hover:bg-blaze-black hover:text-blaze-white h-12"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>
              </div>
              <div className="p-4 border border-blaze-black/20 bg-blaze-black/5">
                <p className="font-mono text-sm text-blaze-black/70 mb-2">
                  💡 Pro Tip:
                </p>
                <p className="font-mono text-sm text-blaze-black">
                  {portfolioData.diversification < 30
                    ? "Consider diversifying your portfolio with more assets to reduce risk."
                    : portfolioData.pnlPercent < 0
                    ? "Review your holdings and consider rebalancing your portfolio."
                    : "Your portfolio is well-diversified! Keep monitoring your investments."}
                  {dataSource === "blockchain" && (
                    <span className="block mt-2 text-green-600">
                      💎 Showing real-time blockchain data from Aptos
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

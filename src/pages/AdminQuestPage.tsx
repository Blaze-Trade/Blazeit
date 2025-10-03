import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuestPNL } from "@/hooks/useQuestPNL";
import { useQuestStaking } from "@/hooks/useQuestStaking";
import { useSupabaseQuests } from "@/hooks/useSupabaseQuests";
import { useSupabaseTokens } from "@/hooks/useSupabaseTokens";
import { formatPNLPercent, getPNLColorClass } from "@/lib/quest-pnl";
import { usePortfolioStore } from "@/stores/portfolioStore";
import type { Quest } from "@shared/types";
import {
  Calculator,
  Crown,
  RefreshCw,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function AdminQuestPage() {
  const { address, isConnected } = usePortfolioStore();
  const { quests, loading, error } = useSupabaseQuests();
  const { tokens } = useSupabaseTokens();
  const { declareWinner, getQuestParticipants } = useQuestStaking();
  const {
    takeStartSnapshot,
    takeEndSnapshot,
    calculateAndRank,
    leaderboard,
    isCalculating,
    fetchPriceSnapshots,
    priceSnapshots,
  } = useQuestPNL();

  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  // Check if connected wallet is admin (you can hardcode admin addresses)
  const ADMIN_ADDRESSES = [
    "0x9cc90ff526e7e8bdb3fc8d105b8e8abb73df9105888d46249499175c7085ef92",
  ];

  const isAdmin = address && ADMIN_ADDRESSES.includes(address);

  useEffect(() => {
    if (selectedQuest) {
      loadParticipants(selectedQuest.id);
      fetchPriceSnapshots(selectedQuest.id);
    }
  }, [selectedQuest]);

  const loadParticipants = async (questId: string) => {
    setLoadingParticipants(true);
    try {
      const result = await getQuestParticipants(parseInt(questId));
      if (result.success && result.data) {
        setParticipants(result.data);
      }
    } catch (error) {
      console.error("Failed to load participants:", error);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleStartQuest = async (quest: Quest) => {
    const result = await takeStartSnapshot(quest.id, tokens);
    if (result.success) {
      toast.success("Quest started! Price snapshot taken.");
    }
  };

  const handleEndQuest = async (quest: Quest) => {
    // Calculate duration in hours from durationMinutes
    const durationHours = quest.durationMinutes
      ? Math.ceil(quest.durationMinutes / 60)
      : 24;
    const result = await takeEndSnapshot(quest.id, tokens, durationHours);
    if (result.success) {
      toast.success("Quest ended! Final prices calculated.");
    }
  };

  const handleCalculateResults = async (quest: Quest) => {
    const result = await calculateAndRank(quest.id);
    if (result.success) {
      setSelectedQuest(quest);
    }
  };

  const handleDeclareWinner = async (quest: Quest) => {
    if (leaderboard.length === 0) {
      toast.error("Please calculate results first");
      return;
    }

    const winner = leaderboard[0];
    const confirmed = window.confirm(
      `Declare ${
        winner.walletAddress
      } as winner?\n\nThey will receive the prize pool of $${quest.prizePool.toLocaleString()}`
    );

    if (!confirmed) return;

    // Declare winner on blockchain
    if (quest.blockchainQuestId) {
      const result = await declareWinner(
        quest.blockchainQuestId,
        winner.walletAddress
      );

      if (result.success) {
        toast.success("Winner declared successfully on blockchain!");
      }
    } else {
      toast.error("Quest not properly configured for blockchain operations");
    }
  };

  if (!isConnected) {
    return (
      <div className="p-4 md:p-8 h-full flex flex-col items-center justify-center text-center">
        <Shield className="w-24 h-24 text-blaze-black/50" />
        <h1 className="font-display text-5xl font-bold mt-4">ADMIN ONLY</h1>
        <p className="font-mono text-lg mt-2 max-w-md">
          Please connect your admin wallet to access this page.
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-4 md:p-8 h-full flex flex-col items-center justify-center text-center">
        <Shield className="w-24 h-24 text-red-600" />
        <h1 className="font-display text-5xl font-bold mt-4 text-red-600">
          ACCESS DENIED
        </h1>
        <p className="font-mono text-lg mt-2 max-w-md">
          Your wallet address is not authorized as an admin.
        </p>
        <p className="font-mono text-sm mt-4 text-blaze-black/50">
          Connected: {address?.slice(0, 10)}...
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-blaze-black/10 w-1/3"></div>
          <div className="h-64 bg-blaze-black/10"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 text-center text-red-600">
        Error loading quests: {error}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Shield className="w-12 h-12 text-blaze-orange" />
          <div>
            <h1 className="font-display text-6xl md:text-8xl font-bold text-blaze-black">
              ADMIN
            </h1>
            <p className="font-mono text-lg text-blaze-black/70">
              Quest Management Dashboard
            </p>
          </div>
        </div>

        {/* Quest List */}
        <Card className="rounded-none border-2 border-blaze-black shadow-blaze-shadow">
          <CardHeader className="border-b-2 border-blaze-black">
            <CardTitle className="font-display text-3xl font-bold">
              All Quests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-blaze-black hover:bg-blaze-white">
                  <TableHead className="font-mono text-sm uppercase">
                    Quest Name
                  </TableHead>
                  <TableHead className="font-mono text-sm uppercase">
                    Status
                  </TableHead>
                  <TableHead className="font-mono text-sm uppercase text-right">
                    Participants
                  </TableHead>
                  <TableHead className="font-mono text-sm uppercase text-right">
                    Prize Pool
                  </TableHead>
                  <TableHead className="font-mono text-sm uppercase text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quests.map((quest) => (
                  <TableRow
                    key={quest.id}
                    className="border-b border-blaze-black/20 hover:bg-blaze-black/5"
                  >
                    <TableCell className="font-bold">{quest.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          quest.status === "active"
                            ? "default"
                            : quest.status === "upcoming"
                            ? "secondary"
                            : "outline"
                        }
                        className="rounded-none"
                      >
                        {quest.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <Users className="inline w-4 h-4 mr-1" />
                      {quest.participants}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      ${quest.prizePool.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {quest.status === "upcoming" && (
                        <Button
                          size="sm"
                          onClick={() => handleStartQuest(quest)}
                          className="rounded-none border border-blaze-black"
                        >
                          Start
                        </Button>
                      )}
                      {quest.status === "active" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleEndQuest(quest)}
                            className="rounded-none border border-blaze-black"
                          >
                            End
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleCalculateResults(quest)}
                            className="rounded-none border border-blaze-black bg-blaze-orange hover:bg-blaze-black hover:text-white"
                          >
                            <Calculator className="w-4 h-4 mr-1" />
                            Calculate
                          </Button>
                        </>
                      )}
                      {quest.status === "ended" && (
                        <Button
                          size="sm"
                          onClick={() => handleDeclareWinner(quest)}
                          disabled={leaderboard.length === 0}
                          className="rounded-none border border-blaze-black bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Crown className="w-4 h-4 mr-1" />
                          Declare Winner
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {quests.length === 0 && (
              <div className="text-center py-12 text-blaze-black/50 font-mono">
                No quests found. Create one to get started!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Quest Details */}
        {selectedQuest && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Leaderboard */}
            <Card className="rounded-none border-2 border-blaze-black shadow-blaze-shadow">
              <CardHeader className="border-b-2 border-blaze-black">
                <CardTitle className="font-display text-2xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  Leaderboard: {selectedQuest.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isCalculating ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-12 h-12 animate-spin mx-auto text-blaze-orange" />
                    <p className="mt-4 font-mono">Calculating results...</p>
                  </div>
                ) : leaderboard.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2 border-blaze-black">
                        <TableHead className="font-mono text-sm uppercase">
                          Rank
                        </TableHead>
                        <TableHead className="font-mono text-sm uppercase">
                          Address
                        </TableHead>
                        <TableHead className="font-mono text-sm uppercase text-right">
                          PNL%
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboard.map((participant) => (
                        <TableRow
                          key={participant.userId}
                          className={`border-b border-blaze-black/20 ${
                            participant.rank === 1 ? "bg-yellow-50" : ""
                          }`}
                        >
                          <TableCell className="font-bold">
                            {participant.rank === 1 && (
                              <Crown className="inline w-4 h-4 mr-1 text-yellow-600" />
                            )}
                            #{participant.rank}
                          </TableCell>
                          <TableCell className="font-mono">
                            {participant.walletAddress.slice(0, 10)}...
                          </TableCell>
                          <TableCell
                            className={`text-right font-mono font-bold ${getPNLColorClass(
                              participant.totalPNL
                            )}`}
                          >
                            {formatPNLPercent(participant.totalPNLPercent)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-blaze-black/50 font-mono">
                    Click "Calculate" to generate leaderboard
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Price Snapshots */}
            <Card className="rounded-none border-2 border-blaze-black shadow-blaze-shadow">
              <CardHeader className="border-b-2 border-blaze-black">
                <CardTitle className="font-display text-2xl font-bold">
                  Price Movements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {priceSnapshots.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2 border-blaze-black">
                        <TableHead className="font-mono text-sm uppercase">
                          Token
                        </TableHead>
                        <TableHead className="font-mono text-sm uppercase text-right">
                          Change
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {priceSnapshots.map((snap) => (
                        <TableRow
                          key={snap.tokenId}
                          className="border-b border-blaze-black/20"
                        >
                          <TableCell className="font-mono font-bold">
                            {snap.tokenSymbol}
                          </TableCell>
                          <TableCell
                            className={`text-right font-mono font-bold ${getPNLColorClass(
                              snap.priceChange
                            )}`}
                          >
                            {formatPNLPercent(snap.priceChangePercent)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-blaze-black/50 font-mono">
                    No price data available yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Info Card */}
        <Card className="rounded-none border-2 border-blue-600 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="text-sm text-blue-800 font-mono">
                <p className="font-bold mb-3 text-lg uppercase">
                  Admin Instructions:
                </p>
                <ul className="space-y-2">
                  <li>
                    • Click "Start" to begin a quest and snapshot token prices
                  </li>
                  <li>
                    • Click "End" when quest time is up to calculate final
                    prices
                  </li>
                  <li>• Click "Calculate" to generate leaderboard from PNL</li>
                  <li>
                    • Click "Declare Winner" to send prize to rank #1 on
                    blockchain
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


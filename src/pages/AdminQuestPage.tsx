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
import { useQuestStaking } from "@/hooks/useQuestStaking";
import { useSupabaseQuests } from "@/hooks/useSupabaseQuests";
import { useSupabaseTokens } from "@/hooks/useSupabaseTokens";
import { questAdminApi } from "@/lib/quest-admin-api";
import { usePortfolioStore } from "@/stores/portfolioStore";
import type { Quest } from "@shared/types";
import {
  Calculator,
  Crown,
  Shield,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export function AdminQuestPage() {
  const { address, isConnected } = usePortfolioStore();
  const { quests, loading, error } = useSupabaseQuests();
  const { tokens } = useSupabaseTokens();
  const { declareWinner, getQuestParticipants } = useQuestStaking();
  // PNL calculation and leaderboard now handled by Supabase

  // Quest details are now handled by Supabase

  // Check if connected wallet is admin (you can hardcode admin addresses)
  const ADMIN_ADDRESSES = [
    "0x9cc90ff526e7e8bdb3fc8d105b8e8abb73df9105888d46249499175c7085ef92",
  ];

  const isAdmin = address && ADMIN_ADDRESSES.includes(address);

  // Quest participant loading is now handled by Supabase

  const handleStartQuest = async (quest: Quest) => {
    const result = await questAdminApi.startQuest(quest.id);
    if (result.success) {
      toast.success("Quest started! Price snapshot taken.");
      // Refresh quests data
      window.location.reload();
    } else {
      toast.error(result.error || "Failed to start quest");
    }
  };

  const handleEndQuest = async (quest: Quest) => {
    const result = await questAdminApi.endQuest(quest.id);
    if (result.success) {
      toast.success("Quest ended! Results calculated and prizes distributed.");
      // Refresh quests data
      window.location.reload();
    } else {
      toast.error(result.error || "Failed to end quest");
    }
  };

  const handleCalculateResults = async (quest: Quest) => {
    // Results are automatically calculated when quest ends
    toast.info("Results are automatically calculated when quest ends");
  };

  const handleDeclareWinner = async (quest: Quest) => {
    // Winners are automatically declared and prizes distributed when quest ends
    toast.info("Winners are automatically declared and prizes distributed when quest ends");
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
                            View Results
                          </Button>
                        </>
                      )}
                      {quest.status === "ended" && (
                        <Button
                          size="sm"
                          onClick={() => handleDeclareWinner(quest)}
                          className="rounded-none border border-blaze-black bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Crown className="w-4 h-4 mr-1" />
                          View Winners
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

        {/* Quest details are now handled by Supabase - no need for local state management */}

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


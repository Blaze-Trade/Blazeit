"use client";

import { QuestLeaderboard } from "@/components/quest/QuestLeaderboard";
import { QuestPortfolio as QuestPortfolioComponent } from "@/components/quest/QuestPortfolio";
import { QuestTokenSelection } from "@/components/quest/QuestTokenSelection";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster, toast } from "@/components/ui/sonner";
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
import { supabaseApi } from "@/lib/supabase-api";
import { cn, formatDuration } from "@/lib/utils";
import { usePortfolioStore } from "@/stores/portfolioStore";
import type { LeaderboardEntry, Quest } from "@shared/types";
import { ArrowLeft, Swords, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const statusStyles = {
  upcoming: "bg-blue-500 border-blue-500",
  active: "bg-blaze-orange border-blaze-orange",
  ended: "bg-blaze-black/50 border-blaze-black/50",
};

export function QuestDetailPage() {
  const params = useParams();
  const questId = params?.questId as string;
  const router = useRouter();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTokenSelection, setShowTokenSelection] = useState(false);
  const [hasSelectedPortfolio, setHasSelectedPortfolio] = useState(false);
  const { isConnected, address, joinedQuests, setActiveQuest } =
    usePortfolioStore();
  const { joinQuest } = useSupabaseQuests();
  const {
    joinQuest: joinQuestBlockchain,
    getUserParticipation,
    getQuestParticipants,
  } = useQuestStaking();

  const isJoined = questId ? joinedQuests.includes(questId) : false;

  // Calculate actual quest status based on current time
  const actualQuestStatus = useMemo(() => {
    if (!quest?.startTime || !quest?.endTime) {
      return quest?.status || "upcoming";
    }

    const now = new Date();
    const startTime = new Date(quest.startTime);
    const endTime = new Date(quest.endTime);

    if (now < startTime) {
      return "upcoming" as const;
    } else if (now >= startTime && now < endTime) {
      return "active" as const;
    } else {
      return "ended" as const;
    }
  }, [quest?.startTime, quest?.endTime, quest?.status]);

  // Determine if we should show leaderboard or participants
  const showLeaderboard = useMemo(() => {
    // Show leaderboard only if quest has ended AND leaderboard data exists
    return actualQuestStatus === "ended" && leaderboard.length > 0;
  }, [actualQuestStatus, leaderboard.length]);

  // Format duration dynamically from durationMinutes only
  const formattedDuration = useMemo(() => {
    if (quest) {
      console.log("QuestDetailPage duration data:", {
        id: quest.id,
        name: quest.name,
        durationMinutes: quest.durationMinutes,
      });
    }

    if (quest?.durationMinutes && quest.durationMinutes > 0) {
      return formatDuration(quest.durationMinutes);
    }
    return "N/A";
  }, [quest]);

  // Check if user has already selected their portfolio
  const checkPortfolioSelection = useCallback(async () => {
    if (!address || !questId) return;

    try {
      // First check Supabase for portfolio data
      const portfolioResult = await supabaseApi.quests.getQuestPortfolio(
        questId,
        address
      );
      if (
        portfolioResult.success &&
        portfolioResult.data &&
        portfolioResult.data.holdings.length > 0
      ) {
        setHasSelectedPortfolio(true);
        return;
      }

      // If no Supabase portfolio, check blockchain participation
      const participation = await getUserParticipation(
        address,
        parseInt(questId)
      );
      if (participation.success && participation.data) {
        // Check if user has selected portfolio (assuming the data structure includes portfolio info)
        // This logic might need to be updated based on the actual contract structure
        setHasSelectedPortfolio(true);
      }
    } catch (error) {
      console.error("Error checking portfolio selection:", error);
    }
  }, [address, questId, getUserParticipation]);

  useEffect(() => {
    if (!questId) {
      setError("No Quest ID provided.");
      setLoading(false);
      return;
    }

    const fetchQuestData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [questResult, leaderboardResult] = await Promise.all([
          supabaseApi.quests.getQuest(questId),
          supabaseApi.quests.getQuestLeaderboard(questId),
        ]);

        if (questResult.success && questResult.data) {
          setQuest(questResult.data);
          // Check if user has already selected their portfolio
          if (isJoined && address) {
            await checkPortfolioSelection();
          }

          // Fetch participants from blockchain if quest has blockchain ID
          if (questResult.data.blockchainQuestId) {
            console.log(
              "🔍 Fetching participants for quest ID:",
              questResult.data.blockchainQuestId
            );
            const participantsResult = await getQuestParticipants(
              questResult.data.blockchainQuestId
            );
            console.log("📊 Participants result:", participantsResult);
            if (participantsResult.success && participantsResult.data) {
              setParticipants(participantsResult.data);
              console.log("✅ Set participants:", participantsResult.data);
            } else {
              console.warn(
                "⚠️ No participants data:",
                participantsResult.error
              );
            }
          } else {
            console.warn("⚠️ No blockchain quest ID found");
          }
        } else {
          setError(questResult.error || "Failed to fetch quest details.");
        }

        if (leaderboardResult.success && leaderboardResult.data) {
          setLeaderboard(leaderboardResult.data);
        } else {
          console.error(
            "Failed to fetch leaderboard:",
            leaderboardResult.error
          );
        }
      } catch (err: any) {
        setError("Failed to fetch quest details.");
        toast.error("Failed to fetch quest details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestData();
  }, [
    questId,
    getQuestParticipants,
    isJoined,
    address,
    checkPortfolioSelection,
  ]);

  const handleJoinQuest = async () => {
    if (!quest || !isConnected || !address) {
      toast.error("Please connect your wallet to join a quest.");
      return;
    }

    try {
      // Check if quest has started (past buy_in_time)
      const now = new Date();
      const startTime = new Date(quest.startTime!);

      if (now >= startTime) {
        toast.error("Cannot join quest - registration period has ended");
        return;
      }

      // Check database for participation (more reliable than smart contract)
      console.log("🔍 [QuestDetail] Checking DATABASE for participation");
      try {
        const { supabaseApi } = await import("@/lib/supabase-api");
        const participationCheck = await supabaseApi.quests.getQuestPortfolio(
          questId,
          address
        );

        console.log("📊 [QuestDetail] Database participation check:", {
          success: participationCheck.success,
          hasData: !!participationCheck.data,
        });

        if (participationCheck.success && participationCheck.data) {
          console.log(
            "✅ [QuestDetail] User already participated (found in database)"
          );
          toast.info("You have already joined this quest");
          setShowTokenSelection(true);
          return;
        }

        console.log(
          "✅ [QuestDetail] No participation found in database - user can join"
        );
      } catch (err) {
        console.warn("⚠️ [QuestDetail] Database check error, continuing:", err);
      }

      // Step 1: Join quest on blockchain (pays entry fee automatically)
      let blockchainResult;
      if (quest.blockchainQuestId) {
        console.log(
          "🔐 Calling joinQuestBlockchain with ID:",
          quest.blockchainQuestId
        );
        // Call join_quest entrypoint - this will prompt wallet for entry fee payment
        blockchainResult = await joinQuestBlockchain(quest.blockchainQuestId);
        console.log("📝 Blockchain result:", blockchainResult);

        if (!blockchainResult.success) {
          console.error("❌ Blockchain join failed:", blockchainResult.error);
          toast.error("Failed to join quest on blockchain");
          return;
        }

        console.log(
          "✅ Successfully joined on blockchain, hash:",
          blockchainResult.hash
        );

        // Step 2: Only save to database AFTER successful blockchain transaction
        const dbResult = await joinQuest(quest.id, address);

        if (dbResult.success) {
          toast.success("Successfully joined the quest!");

          // Refresh participants list after successful join
          if (quest.blockchainQuestId) {
            const updatedParticipants = await getQuestParticipants(
              quest.blockchainQuestId
            );
            if (updatedParticipants.success && updatedParticipants.data) {
              setParticipants(updatedParticipants.data);
              console.log(
                "✅ Participants refreshed:",
                updatedParticipants.data
              );
            }
          }

          // Show token selection for portfolio
          setShowTokenSelection(true);
        } else {
          toast.warning(
            "Joined quest on blockchain but failed to save to database. Transaction: " +
              blockchainResult.hash?.slice(0, 10)
          );

          // Still refresh participants since blockchain succeeded
          if (quest.blockchainQuestId) {
            const updatedParticipants = await getQuestParticipants(
              quest.blockchainQuestId
            );
            if (updatedParticipants.success && updatedParticipants.data) {
              setParticipants(updatedParticipants.data);
            }
          }

          // Still show token selection since blockchain succeeded
          setShowTokenSelection(true);
        }
      } else {
        toast.error("Quest not properly configured for blockchain operations");
        return;
      }
    } catch (error: any) {
      toast.error("Failed to join quest");
      console.error(error);
    }
  };

  const handleBuildPortfolio = () => {
    if (quest) {
      setActiveQuest(quest);
      setShowTokenSelection(true);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <Skeleton className="w-full h-96 bg-blaze-black/10" />
      </div>
    );
  }

  if (error || !quest) {
    return (
      <div className="p-4 md:p-8 text-center text-red-500 font-bold">
        {error || "Quest not found."}
      </div>
    );
  }

  if (showTokenSelection) {
    return (
      <QuestTokenSelection
        quest={quest}
        onBack={() => {
          setShowTokenSelection(false);
          // Refresh portfolio selection status when returning
          if (isJoined && address) {
            checkPortfolioSelection();
          }
        }}
      />
    );
  }

  return (
    <div className="p-4 md:p-8">
      <Toaster richColors closeButton />
      <div className="max-w-7xl mx-auto space-y-8">
        <Button
          variant="outline"
          onClick={() => router.push("/quests")}
          className="border-2 border-blaze-black rounded-none h-12 px-4 flex items-center gap-2 font-bold uppercase text-lg hover:bg-blaze-black/5"
        >
          <ArrowLeft /> Back to Quests
        </Button>

        <div className="border-2 border-blaze-black bg-blaze-white p-6 md:p-8 space-y-6 shadow-blaze-shadow">
          <div className="flex justify-between items-start">
            <h1 className="font-display text-5xl md:text-7xl font-bold text-blaze-black">
              {quest.name}
            </h1>
            <div
              className={cn(
                "text-blaze-white font-mono font-bold uppercase tracking-widest px-3 py-1 text-sm",
                statusStyles[actualQuestStatus]
              )}
            >
              {actualQuestStatus === "active"
                ? "In Progress"
                : actualQuestStatus}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-mono">
            <div className="border-2 border-blaze-black p-4">
              <p className="text-sm uppercase tracking-wider text-blaze-black/70">
                Prize Pool
              </p>
              <p className="text-3xl font-bold">
                ${quest.prizePool.toLocaleString()}
              </p>
            </div>
            <div className="border-2 border-blaze-black p-4">
              <p className="text-sm uppercase tracking-wider text-blaze-black/70">
                Entry
              </p>
              <p className="text-3xl font-bold">${quest.entryFee}</p>
            </div>
            <div className="border-2 border-blaze-black p-4">
              <p className="text-sm uppercase tracking-wider text-blaze-black/70">
                Players
              </p>
              <p className="text-3xl font-bold">{quest.participants}</p>
            </div>
            <div className="border-2 border-blaze-black p-4">
              <p className="text-sm uppercase tracking-wider text-blaze-black/70">
                Duration
              </p>
              <p className="text-3xl font-bold">{formattedDuration}</p>
            </div>
          </div>

          {!isJoined && quest.status !== "ended" && (
            <Button
              onClick={handleJoinQuest}
              disabled={!isConnected}
              className="w-full h-14 rounded-none border-2 border-blaze-black bg-blaze-orange text-blaze-black text-xl font-bold uppercase tracking-wider hover:bg-blaze-black hover:text-blaze-white active:translate-y-px active:translate-x-px"
            >
              Join Quest & Select Tokens
            </Button>
          )}

          {isJoined && !hasSelectedPortfolio && quest.status === "active" && (
            <Button
              onClick={handleBuildPortfolio}
              className="w-full h-14 rounded-none border-2 border-blaze-black bg-blaze-black text-blaze-white text-xl font-bold uppercase tracking-wider hover:bg-blaze-orange hover:text-blaze-black active:translate-y-px active:translate-x-px"
            >
              <Swords className="mr-2" /> Select Portfolio Tokens
            </Button>
          )}

          {isJoined && hasSelectedPortfolio && quest.status === "active" && (
            <div className="text-center p-4 border-2 border-blaze-black bg-blaze-orange/10">
              <p className="text-blaze-black font-bold text-lg">
                ✅ Portfolio Selected
              </p>
              <p className="text-blaze-black/70 text-sm mt-1">
                Your portfolio has been submitted for this quest
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 shadow-blaze-shadow">
            {showLeaderboard ? (
              <QuestLeaderboard leaderboard={leaderboard} />
            ) : (
              <div className="border-2 border-blaze-black bg-blaze-white">
                <h2 className="font-display text-4xl font-bold p-6 border-b-2 border-blaze-black flex items-center gap-3">
                  <Users className="w-8 h-8" />
                  PARTICIPANTS
                </h2>
                {participants.length === 0 ? (
                  <p className="p-6 font-mono text-lg text-center text-blaze-black/70">
                    No participants yet. Be the first to join!
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2 border-blaze-black hover:bg-blaze-white">
                        <TableHead className="font-mono text-lg uppercase tracking-widest">
                          #
                        </TableHead>
                        <TableHead className="font-mono text-lg uppercase tracking-widest">
                          Wallet Address
                        </TableHead>
                        <TableHead className="text-right font-mono text-lg uppercase tracking-widest">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participants.map((participantAddress, index) => (
                        <TableRow
                          key={participantAddress}
                          className={`border-b-2 border-blaze-black last:border-b-0 font-mono font-bold text-lg hover:bg-blaze-white/50 ${
                            address === participantAddress
                              ? "bg-blaze-orange/10"
                              : ""
                          }`}
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-mono">
                            {participantAddress.slice(0, 10)}...
                            {participantAddress.slice(-8)}
                            {address === participantAddress && (
                              <span className="ml-2 text-xs bg-blaze-orange text-blaze-black px-2 py-1 font-bold">
                                YOU
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm text-green-600 font-bold">
                              ✓ Joined
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </div>
          {isJoined && address && questId && (
            <div className="border-2 border-blaze-black bg-blaze-white h-fit shadow-blaze-shadow">
              <QuestPortfolioComponent questId={questId} userId={address} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

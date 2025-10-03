import { Button } from "@/components/ui/button";
import { useQuestStaking } from "@/hooks/useQuestStaking";
import { useSupabaseQuests } from "@/hooks/useSupabaseQuests";
import { cn, formatDuration } from "@/lib/utils";
import { usePortfolioStore } from "@/stores/portfolioStore";
import type { Quest } from "@shared/types";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface QuestCardProps {
  quest: Quest;
}
const statusStyles = {
  upcoming: "bg-blue-500 border-blue-500",
  active: "bg-blaze-orange border-blaze-orange",
  ended: "bg-blaze-black/50 border-blaze-black/50",
};
export function QuestCard({ quest }: QuestCardProps) {
  const { isConnected, address } = usePortfolioStore();
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isCheckingParticipation, setIsCheckingParticipation] = useState(false);

  const { joinQuest: joinQuestSupabase } = useSupabaseQuests();
  const { joinQuest: joinQuestBlockchain, hasUserParticipated } =
    useQuestStaking();

  // Check database for participation on mount and when address/quest changes
  useEffect(() => {
    const checkParticipation = async () => {
      if (!address || !quest.id) return;

      setIsCheckingParticipation(true);
      try {
        const { supabaseApi } = await import("@/lib/supabase-api");
        const result = await supabaseApi.quests.getQuestPortfolio(
          quest.id,
          address
        );
        setIsJoined(result.success && !!result.data);
      } catch (error) {
        console.error("Error checking participation:", error);
        setIsJoined(false);
      } finally {
        setIsCheckingParticipation(false);
      }
    };

    checkParticipation();
  }, [address, quest.id]);

  // Calculate actual quest status based on current time
  const actualQuestStatus = useMemo(() => {
    if (!quest.startTime || !quest.endTime) {
      return quest.status; // Fallback to database status
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
  }, [quest.startTime, quest.endTime, quest.status]);

  // Format duration dynamically from durationMinutes only
  const formattedDuration = useMemo(() => {
    console.log("QuestCard duration data:", {
      id: quest.id,
      name: quest.name,
      durationMinutes: quest.durationMinutes,
    });

    if (quest.durationMinutes && quest.durationMinutes > 0) {
      return formatDuration(quest.durationMinutes);
    }
    return "N/A";
  }, [quest.durationMinutes, quest.id, quest.name]);

  const handleJoinQuest = async () => {
    console.log("🎯 [QuestCard] handleJoinQuest called", {
      isConnected,
      address,
      isJoined,
      actualQuestStatus,
      questId: quest.id,
      blockchainQuestId: quest.blockchainQuestId,
    });

    if (!isConnected || !address) {
      console.error("❌ [QuestCard] Wallet not connected");
      toast.error("Please connect your wallet to join a quest");
      return;
    }

    // If already joined or can't join, just navigate
    if (isJoined || actualQuestStatus !== "upcoming") {
      console.log(
        "📍 [QuestCard] Already joined or not upcoming, navigating..."
      );
      navigate(`/quests/${quest.id}`);
      return;
    }

    // Check if quest has started (past buy_in_time)
    const now = new Date();
    const startTime = new Date(quest.startTime!);

    if (now >= startTime) {
      toast.error("Cannot join quest - registration period has ended");
      navigate(`/quests/${quest.id}`);
      return;
    }

    try {
      setIsJoining(true);
      console.log("🔄 [QuestCard] Starting join process...");

      // Check if quest has blockchain ID
      if (!quest.blockchainQuestId) {
        console.error("❌ [QuestCard] No blockchain quest ID");
        toast.error("Quest not properly configured for blockchain operations");
        return;
      }

      // No need to check DB again - already checked in useEffect which updates isJoined state
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🔐 [QuestCard] Database check already done via useEffect");
      console.log("   isJoined:", isJoined);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      // Step 1: Join quest on blockchain (calls smart contract join_quest function)
      // This will trigger the wallet popup to pay the entry fee in APT
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🔐 [QuestCard] STEP 1: Calling blockchain join_quest");
      console.log("   Quest ID (blockchain):", quest.blockchainQuestId);
      console.log("   Quest ID (database):", quest.id);
      console.log("   Entry Fee:", quest.entryFee, "APT");
      console.log("   User Address:", address);
      console.log("   Function type:", typeof joinQuestBlockchain);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      const blockchainResult = await joinQuestBlockchain(
        quest.blockchainQuestId
      );

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📝 [QuestCard] Blockchain transaction result:");
      console.log("   Success:", blockchainResult.success);
      console.log("   Hash:", blockchainResult.hash);
      console.log("   Error:", blockchainResult.error);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      if (!blockchainResult.success) {
        console.error(
          "❌ [QuestCard] Blockchain join failed:",
          blockchainResult.error
        );
        toast.error(
          `Failed to join quest: ${blockchainResult.error || "Unknown error"}`
        );
        return;
      }

      console.log(
        "✅ [QuestCard] Successfully joined on blockchain, hash:",
        blockchainResult.hash
      );

      // Step 2: Save participation to database after successful blockchain transaction
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("💾 [QuestCard] STEP 2: Saving to database");
      console.log("   Quest ID (database):", quest.id);
      console.log("   User Address:", address);
      console.log("   Entry Fee:", quest.entryFee, "APT");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      const dbResult = await joinQuestSupabase(
        quest.id,
        address,
        quest.entryFee,
        quest.creatorWalletAddress
      );

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("💾 [QuestCard] Database save result:");
      console.log("   Success:", dbResult.success);
      console.log("   Error:", dbResult.error);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      if (dbResult.success) {
        toast.success("Successfully joined the quest!");
        // Update local state to reflect participation
        setIsJoined(true);
      } else {
        toast.warning(
          "Joined quest on blockchain but failed to save to database. You can still participate!"
        );
      }

      // Navigate to quest detail page to build portfolio
      navigate(`/quests/${quest.id}`);
    } catch (error: any) {
      console.error("❌ [QuestCard] Error joining quest:", error);
      toast.error("Failed to join quest");
    } finally {
      setIsJoining(false);
    }
  };

  const getButtonText = () => {
    if (isJoining) {
      return "Joining...";
    }

    // If quest has ended, show view details
    if (actualQuestStatus === "ended") {
      return "View Details";
    }

    // If user has joined and quest is active, they can build/view portfolio
    if (isJoined && actualQuestStatus === "active") {
      return "Build Portfolio";
    }

    // If user has joined but quest hasn't started
    if (isJoined && actualQuestStatus === "upcoming") {
      return "View Quest";
    }

    // If quest is upcoming and user hasn't joined
    if (actualQuestStatus === "upcoming") {
      return `Join Quest (APT ${quest.entryFee})`;
    }

    // If quest is active and user hasn't joined (registration closed)
    if (actualQuestStatus === "active") {
      return "Registration Closed";
    }

    return "View Details";
  };

  const canInteract = () => {
    // Always allow viewing if wallet is connected
    if (!isConnected) return false;

    // Can always view ended quests
    if (actualQuestStatus === "ended") return true;

    // Can always view if already joined
    if (isJoined) return true;

    // Can join if quest is upcoming
    if (actualQuestStatus === "upcoming") return true;

    // Cannot join if quest is already active
    return false;
  };

  const getTimeUntilStart = () => {
    if (!quest.startTime) return null;

    const now = new Date();
    const startTime = new Date(quest.startTime);
    const diffMs = startTime.getTime() - now.getTime();

    if (diffMs <= 0) return null; // Quest has started

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `Starts in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
    } else if (diffHours > 0) {
      return `Starts in ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `Starts in ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
    }
  };

  const getTimeUntilEnd = () => {
    if (!quest.endTime) return null;

    const now = new Date();
    const endTime = new Date(quest.endTime);
    const diffMs = endTime.getTime() - now.getTime();

    if (diffMs <= 0) return "Quest Ended";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `Ends in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
    } else if (diffHours > 0) {
      return `Ends in ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `Ends in ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
    }
  };
  return (
    <div className="w-full bg-blaze-white border-2 border-blaze-black p-6 flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <h3 className="font-display text-4xl font-bold max-w-[75%]">
          {quest.name}
        </h3>
        <div
          className={cn(
            "text-blaze-white font-mono font-bold uppercase tracking-widest px-3 py-1 text-sm",
            statusStyles[actualQuestStatus]
          )}
        >
          {actualQuestStatus === "active" ? "In Progress" : actualQuestStatus}
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

      {/* Quest Timing Information */}
      {(quest.startTime || quest.endTime) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
          {quest.startTime && (
            <div className="border-2 border-blaze-black p-4">
              <p className="text-sm uppercase tracking-wider text-blaze-black/70">
                Start Time
              </p>
              <p className="text-lg font-bold">
                {new Date(quest.startTime).toLocaleString()}
              </p>
              {getTimeUntilStart() && (
                <p className="text-sm text-blaze-black/60 mt-1">
                  {getTimeUntilStart()}
                </p>
              )}
            </div>
          )}
          {quest.endTime && (
            <div className="border-2 border-blaze-black p-4">
              <p className="text-sm uppercase tracking-wider text-blaze-black/70">
                End Time
              </p>
              <p className="text-lg font-bold">
                {new Date(quest.endTime).toLocaleString()}
              </p>
              {getTimeUntilEnd() && (
                <p className="text-sm text-blaze-black/60 mt-1">
                  {getTimeUntilEnd()}
                </p>
              )}
            </div>
          )}
        </div>
      )}
      <Button
        onClick={handleJoinQuest}
        disabled={!canInteract() || isJoining}
        className="w-full h-14 rounded-none border-2 border-blaze-black bg-blaze-black text-blaze-white text-xl font-bold uppercase tracking-wider hover:bg-blaze-orange hover:text-blaze-black active:translate-y-px active:translate-x-px disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {getButtonText()}
      </Button>
    </div>
  );
}

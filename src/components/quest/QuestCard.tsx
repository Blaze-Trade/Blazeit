import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePortfolioStore } from "@/stores/portfolioStore";
import type { Quest } from "@shared/types";
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
  const { isConnected, address, joinedQuests } = usePortfolioStore();
  const isJoined = joinedQuests.includes(quest.id);
  const navigate = useNavigate();

  const handleJoinQuest = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet to join a quest");
      return;
    }

    // Simply redirect to quest detail page - no transaction here
    navigate(`/quests/${quest.id}`);
  };

  const getButtonText = () => {
    if (isJoined) {
      return "Build Portfolio";
    }

    return `Join Quest (${quest.entryFee} APT)`;
  };

  const canJoinQuest = () => {
    // Always allow joining if wallet is connected
    return isConnected;
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
            statusStyles[quest.status]
          )}
        >
          {quest.status}
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
          <p className="text-3xl font-bold">{quest.duration}</p>
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
        className="w-full h-14 rounded-none border-2 border-blaze-black bg-blaze-black text-blaze-white text-xl font-bold uppercase tracking-wider hover:bg-blaze-orange hover:text-blaze-black active:translate-y-px active:translate-x-px"
      >
        {getButtonText()}
      </Button>
    </div>
  );
}

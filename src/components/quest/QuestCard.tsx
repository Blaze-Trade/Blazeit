import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Quest } from "@shared/types";
import { usePortfolioStore } from "@/stores/portfolioStore";
import { useQuestManagement } from "@/hooks/useQuestManagement";
import { useState } from "react";
interface QuestCardProps {
  quest: Quest;
}
const statusStyles = {
  upcoming: "bg-blue-500 border-blue-500",
  active: "bg-blaze-orange border-blaze-orange",
  ended: "bg-blaze-black/50 border-blaze-black/50",
};
export function QuestCard({ quest }: QuestCardProps) {
  const joinedQuests = usePortfolioStore((state) => state.joinedQuests);
  const isJoined = joinedQuests.includes(quest.id);
  const { joinQuest, isJoining } = useQuestManagement();
  const [isJoiningQuest, setIsJoiningQuest] = useState(false);

  const handleJoinQuest = async () => {
    if (isJoined) return;
    
    setIsJoiningQuest(true);
    try {
      const result = await joinQuest(quest.id);
      if (result.success) {
        // Quest joined successfully
      }
    } catch (error) {
      console.error('Failed to join quest:', error);
    } finally {
      setIsJoiningQuest(false);
    }
  };

  const getButtonText = () => {
    if (isJoined) {
      return "Build Portfolio";
    }
    if (quest.status === 'upcoming') {
      return isJoiningQuest || isJoining ? "Joining..." : "View & Join";
    }
    return "View Details";
  };
  return (
    <div className="w-full bg-blaze-white border-2 border-blaze-black p-6 flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <h3 className="font-display text-4xl font-bold max-w-[75%]">{quest.name}</h3>
        <div className={cn("text-blaze-white font-mono font-bold uppercase tracking-widest px-3 py-1 text-sm", statusStyles[quest.status])}>
          {quest.status}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-mono">
        <div className="border-2 border-blaze-black p-4">
          <p className="text-sm uppercase tracking-wider text-blaze-black/70">Prize Pool</p>
          <p className="text-3xl font-bold">${quest.prizePool.toLocaleString()}</p>
        </div>
        <div className="border-2 border-blaze-black p-4">
          <p className="text-sm uppercase tracking-wider text-blaze-black/70">Entry</p>
          <p className="text-3xl font-bold">${quest.entryFee}</p>
        </div>
        <div className="border-2 border-blaze-black p-4">
          <p className="text-sm uppercase tracking-wider text-blaze-black/70">Players</p>
          <p className="text-3xl font-bold">{quest.participants}</p>
        </div>
        <div className="border-2 border-blaze-black p-4">
          <p className="text-sm uppercase tracking-wider text-blaze-black/70">Duration</p>
          <p className="text-3xl font-bold">{quest.duration}</p>
        </div>
      </div>
      <Button 
        onClick={handleJoinQuest}
        className="w-full h-14 rounded-none border-2 border-blaze-black bg-blaze-black text-blaze-white text-xl font-bold uppercase tracking-wider hover:bg-blaze-orange hover:text-blaze-black active:translate-y-px active:translate-x-px disabled:bg-blaze-black/50 disabled:border-blaze-black/50 disabled:text-blaze-white/50" 
        disabled={quest.status === 'ended' || isJoiningQuest || isJoining}
      >
        {getButtonText()}
      </Button>
    </div>
  );
}
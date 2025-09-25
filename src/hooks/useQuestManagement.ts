import { usePortfolioStore } from "@/stores/portfolioStore";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useLaunchpadIntegration } from "./useLaunchpadIntegration";

export interface QuestFormData {
  name: string;
  description: string;
  entryFee: number;
  prizePool: number;
  startTime: Date;
  endTime: Date;
  maxParticipants: number;
}

export function useQuestManagement() {
  const { account } = useWallet();
  const {
    createQuest: contractCreateQuest,
    joinQuest: contractJoinQuest,
    getQuestInfo,
    hasJoinedQuest,
    isLoading,
  } = useLaunchpadIntegration();

  const { joinQuest: storeJoinQuest, setActiveQuest } = usePortfolioStore();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const createQuest = useCallback(
    async (questData: QuestFormData) => {
      if (!account) {
        toast.error("Please connect your wallet first");
        return { success: false, error: "No wallet connected" };
      }

      setIsCreating(true);

      try {
        const result = await contractCreateQuest({
          name: questData.name,
          description: questData.description,
          entryFee: questData.entryFee,
          prizePool: questData.prizePool,
          startTime: questData.startTime.getTime(),
          endTime: questData.endTime.getTime(),
          maxParticipants: questData.maxParticipants,
        });

        if (result.success) {
          toast.success("Quest created successfully!");
        }

        return result;
      } catch (error: any) {
        console.error("Quest creation failed:", error);
        return { success: false, error };
      } finally {
        setIsCreating(false);
      }
    },
    [account, contractCreateQuest]
  );

  const joinQuest = useCallback(
    async (questId: string) => {
      if (!account) {
        toast.error("Please connect your wallet first");
        return { success: false, error: "No wallet connected" };
      }

      setIsJoining(true);

      try {
        // Check if already joined
        const alreadyJoined = await hasJoinedQuest(questId, account.address);
        if (alreadyJoined) {
          toast.error("You have already joined this quest");
          return { success: false, error: "Already joined" };
        }

        const result = await contractJoinQuest(questId);

        if (result.success) {
          // Update local store
          storeJoinQuest({ id: questId } as any);
          toast.success("Successfully joined the quest!");
        }

        return result;
      } catch (error: any) {
        console.error("Quest join failed:", error);
        return { success: false, error };
      } finally {
        setIsJoining(false);
      }
    },
    [account, contractJoinQuest, hasJoinedQuest, storeJoinQuest]
  );

  const endQuest = useCallback(async (questId: string, winner: string) => {
    // Quest ending functionality not implemented in contract yet
    console.warn("Quest ending functionality not implemented");
    toast.error("Quest ending functionality not available");
    return { success: false, error: "Quest ending not implemented" };
  }, []);

  const checkQuestParticipation = useCallback(
    async (questId: string) => {
      if (!account) return false;

      try {
        return await hasJoinedQuest(questId, account.address);
      } catch (error) {
        console.error("Error checking quest participation:", error);
        return false;
      }
    },
    [account, hasJoinedQuest]
  );

  const fetchQuestDetails = useCallback(
    async (questId: string) => {
      try {
        const questInfo = await getQuestInfo(questId);
        return questInfo;
      } catch (error) {
        console.error("Error fetching quest details:", error);
        return null;
      }
    },
    [getQuestInfo]
  );

  return {
    // State
    isCreating,
    isJoining,
    isLoading,

    // Functions
    createQuest,
    joinQuest,
    endQuest,
    checkQuestParticipation,
    fetchQuestDetails,
  };
}

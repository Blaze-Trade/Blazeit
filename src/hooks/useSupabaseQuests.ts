import { supabaseApi } from '@/lib/supabase-api';
import type { Quest } from '@shared/types';
import { useEffect, useState } from 'react';
import { useAptos } from './useAptos';

export function useSupabaseQuests() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { simulateTransaction, transferAPT } = useAptos();

  const fetchQuests = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await supabaseApi.quests.getQuests();

      if (result.success && result.data) {
        setQuests(result.data.items);
      } else {
        setError(result.error || 'Failed to fetch quests');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch quests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, []);

  const createQuest = async (questData: {
    name: string;
    description?: string;
    entryFee: number;
    prizePool: number;
    durationHours: number;
    startTime: Date;
    endTime: Date;
    maxParticipants?: number;
    creatorWalletAddress: string;
  }) => {
    try {
      const result = await supabaseApi.quests.createQuest(questData);

      if (result.success && result.data) {
        // Refresh quests list
        await fetchQuests();
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Failed to create quest' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create quest' };
    }
  };

  const joinQuest = async (questId: string, walletAddress: string, entryFee?: number, creatorWalletAddress?: string) => {
    try {
      // First, execute the entry fee transaction if there's an entry fee
      if (entryFee && entryFee > 0 && creatorWalletAddress) {
        const transactionResult = await transferAPT(
          creatorWalletAddress,
          entryFee,
          `Paying ${entryFee} APT entry fee for quest`
        );

        if (!transactionResult.success) {
          return {
            success: false,
            error: `Entry fee transaction failed: ${transactionResult.error}`
          };
        }
      }

      // After successful transaction, join the quest in the database
      const result = await supabaseApi.quests.joinQuest(questId, walletAddress);

      if (result.success) {
        // Refresh quests list to update participant count
        await fetchQuests();
        return result;
      } else {
        return result;
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to join quest' };
    }
  };

  const getQuestPortfolio = async (questId: string, walletAddress: string) => {
    try {
      return await supabaseApi.quests.getQuestPortfolio(questId, walletAddress);
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to get quest portfolio' };
    }
  };

  const buyTokenInQuest = async (questId: string, walletAddress: string, token: any, quantity: number) => {
    try {
      return await supabaseApi.quests.buyTokenInQuest(questId, walletAddress, token, quantity);
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to buy token in quest' };
    }
  };

  const sellTokenInQuest = async (questId: string, walletAddress: string, tokenId: string, quantity: number) => {
    try {
      return await supabaseApi.quests.sellTokenInQuest(questId, walletAddress, tokenId, quantity);
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to sell token in quest' };
    }
  };

  const getQuestLeaderboard = async (questId: string) => {
    try {
      return await supabaseApi.quests.getQuestLeaderboard(questId);
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to get leaderboard' };
    }
  };

  return {
    quests,
    loading,
    error,
    createQuest,
    joinQuest,
    getQuestPortfolio,
    buyTokenInQuest,
    sellTokenInQuest,
    getQuestLeaderboard,
    refetch: fetchQuests,
  };
}

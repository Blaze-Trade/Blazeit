import {
    generateQuestLeaderboard,
    getQuestPriceSnapshots,
    snapshotQuestEndPrices,
    snapshotQuestStartPrices,
    type ParticipantPNL,
    type TokenPriceSnapshot
} from '@/lib/quest-pnl';
import type { Token } from '@shared/types';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export function useQuestPNL() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [leaderboard, setLeaderboard] = useState<ParticipantPNL[]>([]);
  const [priceSnapshots, setPriceSnapshots] = useState<TokenPriceSnapshot[]>([]);

  /**
   * Take price snapshot when quest starts
   */
  const takeStartSnapshot = useCallback(async (questId: string, tokens: Token[]) => {
    try {
      const result = await snapshotQuestStartPrices(questId, tokens);

      if (result.success) {
        toast.success('Quest started - prices snapshot taken');
        return { success: true };
      } else {
        toast.error(result.error || 'Failed to snapshot start prices');
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      toast.error('Failed to take start snapshot');
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Take price snapshot when quest ends
   */
  const takeEndSnapshot = useCallback(async (
    questId: string,
    tokens: Token[],
    durationHours: number
  ) => {
    try {
      const result = await snapshotQuestEndPrices(questId, tokens, durationHours);

      if (result.success) {
        toast.success('Quest ended - final prices calculated');
        return { success: true };
      } else {
        toast.error(result.error || 'Failed to snapshot end prices');
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      toast.error('Failed to take end snapshot');
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Get price snapshots for a quest
   */
  const fetchPriceSnapshots = useCallback((questId: string) => {
    try {
      const snapshots = getQuestPriceSnapshots(questId);
      setPriceSnapshots(snapshots);
      return snapshots;
    } catch (error) {
      console.error('Failed to fetch price snapshots:', error);
      return [];
    }
  }, []);

  /**
   * Calculate PNL and generate leaderboard
   */
  const calculateAndRank = useCallback(async (questId: string) => {
    setIsCalculating(true);

    try {
      const result = await generateQuestLeaderboard(questId);

      if (result.success && result.data) {
        setLeaderboard(result.data);
        toast.success('Leaderboard calculated successfully');
        return { success: true, data: result.data };
      } else {
        toast.error(result.error || 'Failed to calculate leaderboard');
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      toast.error('Failed to calculate leaderboard');
      return { success: false, error: error.message };
    } finally {
      setIsCalculating(false);
    }
  }, []);

  /**
   * Get winner (rank #1) from leaderboard
   */
  const getWinner = useCallback(() => {
    if (leaderboard.length === 0) return null;
    return leaderboard[0];
  }, [leaderboard]);

  return {
    // State
    isCalculating,
    leaderboard,
    priceSnapshots,

    // Functions
    takeStartSnapshot,
    takeEndSnapshot,
    fetchPriceSnapshots,
    calculateAndRank,
    getWinner,
  };
}


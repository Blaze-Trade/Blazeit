import { supabaseApi } from '@/lib/supabase-api';
import type { Token } from '@shared/types';
import { useEffect, useState } from 'react';

export function useSupabaseWatchlist(walletAddress: string | null) {
  const [watchlist, setWatchlist] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWatchlist = async () => {
    if (!walletAddress) {
      setWatchlist([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await supabaseApi.watchlist.getWatchlist(walletAddress);

      if (result.success && result.data) {
        setWatchlist(result.data.items);
      } else {
        setError(result.error || 'Failed to fetch watchlist');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch watchlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, [walletAddress]);

  const addToWatchlist = async (token: Token) => {
    if (!walletAddress) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      const result = await supabaseApi.watchlist.addToWatchlist(walletAddress, token.id);

      if (result.success) {
        // Refresh watchlist
        await fetchWatchlist();
        return { success: true };
      } else {
        return result;
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to add to watchlist' };
    }
  };

  const removeFromWatchlist = async (tokenId: string) => {
    if (!walletAddress) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      const result = await supabaseApi.watchlist.removeFromWatchlist(walletAddress, tokenId);

      if (result.success) {
        // Refresh watchlist
        await fetchWatchlist();
        return { success: true };
      } else {
        return result;
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to remove from watchlist' };
    }
  };

  const clearWatchlist = async () => {
    if (!walletAddress) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      const result = await supabaseApi.watchlist.clearWatchlist(walletAddress);

      if (result.success) {
        // Refresh watchlist
        await fetchWatchlist();
        return { success: true };
      } else {
        return result;
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to clear watchlist' };
    }
  };

  return {
    watchlist,
    loading,
    error,
    addToWatchlist,
    removeFromWatchlist,
    clearWatchlist,
    refetch: fetchWatchlist,
  };
}

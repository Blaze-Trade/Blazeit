import { supabaseApi } from '@/lib/supabase-api';
import type { Holding } from '@shared/types';
import { useCallback, useEffect, useState } from "react";

export function useSupabasePortfolio(walletAddress: string | null) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    if (!walletAddress) {
      setHoldings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await supabaseApi.portfolio.getUserPortfolio(
        walletAddress
      );

      if (result.success && result.data) {
        setHoldings(result.data);
      } else {
        setError(result.error || "Failed to fetch portfolio");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch portfolio");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const buyToken = async (token: any, quantity: number) => {
    if (!walletAddress) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      const result = await supabaseApi.portfolio.buyToken(walletAddress, token, quantity);

      if (result.success) {
        // Refresh portfolio
        await fetchPortfolio();
        return { success: true };
      } else {
        return result;
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to buy token' };
    }
  };

  const sellToken = async (tokenId: string, quantity: number) => {
    if (!walletAddress) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      const result = await supabaseApi.portfolio.sellToken(walletAddress, tokenId, quantity);

      if (result.success) {
        // Refresh portfolio
        await fetchPortfolio();
        return { success: true };
      } else {
        return result;
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to sell token' };
    }
  };

  return {
    holdings,
    loading,
    error,
    buyToken,
    sellToken,
    refetch: fetchPortfolio,
  };
}

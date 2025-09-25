import { supabaseApi } from '@/lib/supabase-api';
import type { Token } from '@shared/types';
import { useEffect, useState } from 'react';

export function useSupabaseTokens() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await supabaseApi.tokens.getTokens();

      if (result.success && result.data) {
        setTokens(result.data.items);
      } else {
        setError(result.error || 'Failed to fetch tokens');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tokens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const getTokenBySymbol = async (symbol: string) => {
    try {
      return await supabaseApi.tokens.getTokenBySymbol(symbol);
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to get token' };
    }
  };

  const updateTokenPrice = async (symbol: string, price: number, change24h: number, marketCap: number) => {
    try {
      return await supabaseApi.tokens.updateTokenPrice(symbol, price, change24h, marketCap);
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update token price' };
    }
  };

  return {
    tokens,
    loading,
    error,
    getTokenBySymbol,
    updateTokenPrice,
    refetch: fetchTokens,
  };
}

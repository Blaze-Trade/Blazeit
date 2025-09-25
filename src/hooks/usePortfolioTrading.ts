import { useState, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useLaunchpadIntegration } from './useLaunchpadIntegration';
import { toast } from 'sonner';

export interface TradeParams {
  questId: string;
  tokenAddress: string;
  symbol: string;
  quantity: number;
  cost: number;
}

export function usePortfolioTrading() {
  const { account } = useWallet();
  const { 
    buyToken: contractBuyToken,
    sellToken: contractSellToken,
    getPortfolioInfo,
    isLoading 
  } = useLaunchpadIntegration();
  
  const [isTrading, setIsTrading] = useState(false);

  // Portfolio initialization is handled automatically by the launchpad contract

  const buyToken = useCallback(async (params: TradeParams) => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return { success: false, error: 'No wallet connected' };
    }

    setIsTrading(true);

    try {
      const result = await contractBuyToken(params);

      if (result.success) {
        toast.success(`Successfully bought ${params.quantity} ${params.symbol}!`);
      }

      return result;
    } catch (error: any) {
      console.error('Token purchase failed:', error);
      return { success: false, error };
    } finally {
      setIsTrading(false);
    }
  }, [account, contractBuyToken]);

  const sellToken = useCallback(async (
    questId: string, 
    tokenAddress: string, 
    quantity: number, 
    proceeds: number
  ) => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return { success: false, error: 'No wallet connected' };
    }

    setIsTrading(true);

    try {
      const result = await contractSellToken(questId, tokenAddress, quantity, proceeds);

      if (result.success) {
        toast.success(`Successfully sold ${quantity} tokens!`);
      }

      return result;
    } catch (error: any) {
      console.error('Token sale failed:', error);
      return { success: false, error };
    } finally {
      setIsTrading(false);
    }
  }, [account, contractSellToken]);

  const fetchPortfolio = useCallback(async (questId: string) => {
    if (!account) return null;
    
    try {
      const portfolioInfo = await getPortfolioInfo(questId, account.address);
      return portfolioInfo;
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      return null;
    }
  }, [account, getPortfolioInfo]);

  // Token holding info is included in portfolio info

  const calculateTradeValue = useCallback((quantity: number, price: number) => {
    return quantity * price;
  }, []);

  const calculatePnL = useCallback((currentValue: number, costBasis: number) => {
    const pnl = currentValue - costBasis;
    const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
    return { pnl, pnlPercent };
  }, []);

  return {
    // State
    isTrading,
    isLoading,
    
    // Functions
    buyToken,
    sellToken,
    fetchPortfolio,
    
    // Utilities
    calculateTradeValue,
    calculatePnL,
  };
}

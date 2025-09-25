import { useState, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { toast } from 'sonner';

// Enhanced Aptos client singleton
let aptosSingleton: any | null = null;
async function getAptosClient() {
  if (aptosSingleton) return aptosSingleton;
  const mod = await import('@aptos-labs/ts-sdk');
  
  const config = {
    network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'devnet',
    fullnode: process.env.NODE_ENV === 'production' 
      ? 'https://fullnode.mainnet.aptoslabs.com'
      : 'https://fullnode.devnet.aptoslabs.com',
  };
  
  aptosSingleton = new mod.Aptos(config);
  return aptosSingleton;
}

// Contract configuration
const LAUNCHPAD_ADDRESS = '0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a';

export function useLaunchpadIntegration() {
  const { signAndSubmitTransaction, account } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  // Generic transaction handler
  const executeTransaction = useCallback(async (
    description: string,
    payload: any,
    successMessage?: string
  ) => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return { success: false, error: 'No wallet connected' };
    }

    setIsLoading(true);
    const toastId = toast.loading(`Processing ${description}...`, {
      description: 'Please approve the transaction in your wallet.',
    });

    try {
      const result = await signAndSubmitTransaction(payload);
      const client = await getAptosClient();
      await client.waitForTransaction({ transactionHash: result.hash });

      toast.success(successMessage || `${description} successful!`, {
        id: toastId,
        description: `Transaction: ${result.hash.slice(0, 10)}...`,
      });

      return { success: true, hash: result.hash };
    } catch (error: any) {
      const isUserRejection = error.message?.includes('User rejected the request');
      console.error(`${description} failed:`, error);
      
      toast.error(isUserRejection ? 'Transaction rejected' : `${description} failed`, {
        id: toastId,
        description: isUserRejection 
          ? 'You cancelled the transaction.' 
          : (error?.message || 'Please try again.'),
      });

      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, [signAndSubmitTransaction, account]);

  // Token creation function (assuming the launchpad has a create_token function)
  const createToken = useCallback(async (tokenData: {
    name: string;
    symbol: string;
    description: string;
    imageUrl: string;
    decimals: number;
  }) => {
    const payload = {
      function: `${LAUNCHPAD_ADDRESS}::launchpad::create_token`,
      typeArguments: [],
      functionArguments: [
        tokenData.name,
        tokenData.symbol,
        tokenData.description,
        tokenData.imageUrl,
        tokenData.decimals,
      ],
    };

    return executeTransaction(
      'Token creation',
      payload,
      'Token created successfully!'
    );
  }, [executeTransaction]);

  // Quest creation function (assuming the launchpad has quest functionality)
  const createQuest = useCallback(async (questData: {
    name: string;
    description: string;
    entryFee: number;
    prizePool: number;
    startTime: number;
    endTime: number;
    maxParticipants: number;
  }) => {
    const payload = {
      function: `${LAUNCHPAD_ADDRESS}::launchpad::create_quest`,
      typeArguments: [],
      functionArguments: [
        questData.name,
        questData.description,
        questData.entryFee,
        questData.prizePool,
        questData.startTime,
        questData.endTime,
        questData.maxParticipants,
      ],
    };

    return executeTransaction(
      'Quest creation',
      payload,
      'Quest created successfully!'
    );
  }, [executeTransaction]);

  // Join quest function
  const joinQuest = useCallback(async (questId: string) => {
    const payload = {
      function: `${LAUNCHPAD_ADDRESS}::launchpad::join_quest`,
      typeArguments: [],
      functionArguments: [questId],
    };

    return executeTransaction(
      'Quest join',
      payload,
      'Successfully joined the quest!'
    );
  }, [executeTransaction]);

  // Buy token function (for trading within quests)
  const buyToken = useCallback(async (params: {
    questId: string;
    tokenAddress: string;
    symbol: string;
    quantity: number;
    cost: number;
  }) => {
    const payload = {
      function: `${LAUNCHPAD_ADDRESS}::launchpad::buy_token`,
      typeArguments: [],
      functionArguments: [
        params.questId,
        params.tokenAddress,
        params.symbol,
        params.quantity,
        params.cost,
      ],
    };

    return executeTransaction(
      'Token purchase',
      payload,
      'Token purchased successfully!'
    );
  }, [executeTransaction]);

  // Sell token function
  const sellToken = useCallback(async (
    questId: string,
    tokenAddress: string,
    quantity: number,
    proceeds: number
  ) => {
    const payload = {
      function: `${LAUNCHPAD_ADDRESS}::launchpad::sell_token`,
      typeArguments: [],
      functionArguments: [questId, tokenAddress, quantity, proceeds],
    };

    return executeTransaction(
      'Token sale',
      payload,
      'Token sold successfully!'
    );
  }, [executeTransaction]);

  // View functions (read-only)
  const getTokenInfo = useCallback(async (symbol: string) => {
    try {
      const client = await getAptosClient();
      const payload = {
        function: `${LAUNCHPAD_ADDRESS}::launchpad::get_token_info`,
        typeArguments: [],
        functionArguments: [symbol],
      };
      return await client.view(payload);
    } catch (error) {
      console.error('Error fetching token info:', error);
      return null;
    }
  }, []);

  const getQuestInfo = useCallback(async (questId: string) => {
    try {
      const client = await getAptosClient();
      const payload = {
        function: `${LAUNCHPAD_ADDRESS}::launchpad::get_quest_info`,
        typeArguments: [],
        functionArguments: [questId],
      };
      return await client.view(payload);
    } catch (error) {
      console.error('Error fetching quest info:', error);
      return null;
    }
  }, []);

  const getPortfolioInfo = useCallback(async (questId: string, participant: string) => {
    try {
      const client = await getAptosClient();
      const payload = {
        function: `${LAUNCHPAD_ADDRESS}::launchpad::get_portfolio`,
        typeArguments: [],
        functionArguments: [questId, participant],
      };
      return await client.view(payload);
    } catch (error) {
      console.error('Error fetching portfolio info:', error);
      return null;
    }
  }, []);

  const hasJoinedQuest = useCallback(async (questId: string, participant: string) => {
    try {
      const client = await getAptosClient();
      const payload = {
        function: `${LAUNCHPAD_ADDRESS}::launchpad::has_joined_quest`,
        typeArguments: [],
        functionArguments: [questId, participant],
      };
      return await client.view(payload);
    } catch (error) {
      console.error('Error checking quest participation:', error);
      return false;
    }
  }, []);

  return {
    // State
    isLoading,
    
    // Functions
    createToken,
    createQuest,
    joinQuest,
    buyToken,
    sellToken,
    
    // View functions
    getTokenInfo,
    getQuestInfo,
    getPortfolioInfo,
    hasJoinedQuest,
    
    // Contract address
    contractAddress: LAUNCHPAD_ADDRESS,
  };
}

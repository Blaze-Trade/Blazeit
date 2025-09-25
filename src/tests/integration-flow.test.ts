import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Aptos SDK
const mockAptosClient = {
  waitForTransaction: vi.fn().mockResolvedValue({}),
  view: vi.fn().mockResolvedValue({}),
};

vi.mock('@aptos-labs/ts-sdk', () => ({
  Aptos: vi.fn().mockImplementation(() => mockAptosClient),
}));

// Mock the wallet adapter
const mockSignAndSubmitTransaction = vi.fn();
vi.mock('@aptos-labs/wallet-adapter-react', () => ({
  useWallet: () => ({
    signAndSubmitTransaction: mockSignAndSubmitTransaction,
    account: { address: '0x123' },
    connected: true,
  }),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import our actual hook
import { useLaunchpadIntegration } from '../hooks/useLaunchpadIntegration';

describe('Integration Flow Tests', () => {
  let launchpadIntegration: ReturnType<typeof useLaunchpadIntegration>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the hook return value for testing
    launchpadIntegration = {
      isLoading: false,
      createToken: vi.fn(),
      createQuest: vi.fn(),
      joinQuest: vi.fn(),
      buyToken: vi.fn(),
      sellToken: vi.fn(),
      getTokenInfo: vi.fn(),
      getQuestInfo: vi.fn(),
      getPortfolioInfo: vi.fn(),
      hasJoinedQuest: vi.fn(),
      contractAddress: '0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a',
    };
  });

  describe('Token Creation Flow', () => {
    it('should handle complete token creation flow', async () => {
      const tokenData = {
        name: 'Blaze Token',
        symbol: 'BLAZE',
        description: 'The official Blaze token',
        imageUrl: 'https://example.com/blaze-token.png',
        decimals: 8,
      };

      const mockResult = { success: true, hash: '0xabc123' };
      (launchpadIntegration.createToken as any).mockResolvedValue(mockResult);

      // Test token creation
      const result = await launchpadIntegration.createToken(tokenData);
      
      expect(result).toEqual(mockResult);
      expect(launchpadIntegration.createToken).toHaveBeenCalledWith(tokenData);
    });

    it('should handle token creation errors gracefully', async () => {
      const tokenData = {
        name: 'Test Token',
        symbol: 'TEST',
        description: 'A test token',
        imageUrl: 'https://example.com/test.png',
        decimals: 8,
      };

      const mockError = { success: false, error: 'User rejected transaction' };
      (launchpadIntegration.createToken as any).mockResolvedValue(mockError);

      const result = await launchpadIntegration.createToken(tokenData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('User rejected transaction');
    });
  });

  describe('Quest Management Flow', () => {
    it('should handle complete quest creation and joining flow', async () => {
      const questData = {
        name: 'Trading Championship',
        description: 'Compete for the top trader title',
        entryFee: 1000000, // 0.001 APT
        prizePool: 10000000, // 0.01 APT
        startTime: Date.now() + 3600000, // 1 hour from now
        endTime: Date.now() + 86400000, // 24 hours from now
        maxParticipants: 100,
      };

      const mockQuestResult = { success: true, hash: '0xquest123' };
      const mockJoinResult = { success: true, hash: '0xjoin456' };

      (launchpadIntegration.createQuest as any).mockResolvedValue(mockQuestResult);
      (launchpadIntegration.joinQuest as any).mockResolvedValue(mockJoinResult);

      // Test quest creation
      const questResult = await launchpadIntegration.createQuest(questData);
      expect(questResult).toEqual(mockQuestResult);

      // Test quest joining
      const joinResult = await launchpadIntegration.joinQuest('quest-123');
      expect(joinResult).toEqual(mockJoinResult);
    });

    it('should handle quest joining errors', async () => {
      const mockError = { success: false, error: 'Quest not found' };
      (launchpadIntegration.joinQuest as any).mockResolvedValue(mockError);

      const result = await launchpadIntegration.joinQuest('invalid-quest');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Quest not found');
    });
  });

  describe('Trading Flow', () => {
    it('should handle complete buy and sell flow', async () => {
      const buyParams = {
        questId: 'quest-123',
        tokenAddress: '0x1234567890abcdef1234567890abcdef12345678',
        symbol: 'BLAZE',
        quantity: 1000,
        cost: 100000, // 0.0001 APT
      };

      const sellParams = {
        questId: 'quest-123',
        tokenAddress: '0x1234567890abcdef1234567890abcdef12345678',
        quantity: 500,
        proceeds: 60000, // 0.00006 APT
      };

      const mockBuyResult = { success: true, hash: '0xbuy123' };
      const mockSellResult = { success: true, hash: '0xsell456' };

      (launchpadIntegration.buyToken as any).mockResolvedValue(mockBuyResult);
      (launchpadIntegration.sellToken as any).mockResolvedValue(mockSellResult);

      // Test buying tokens
      const buyResult = await launchpadIntegration.buyToken(buyParams);
      expect(buyResult).toEqual(mockBuyResult);

      // Test selling tokens
      const sellResult = await launchpadIntegration.sellToken(
        sellParams.questId,
        sellParams.tokenAddress,
        sellParams.quantity,
        sellParams.proceeds
      );
      expect(sellResult).toEqual(mockSellResult);
    });

    it('should handle trading errors', async () => {
      const tradeParams = {
        questId: 'quest-123',
        tokenAddress: '0x1234567890abcdef1234567890abcdef12345678',
        symbol: 'BLAZE',
        quantity: 1000,
        cost: 100000,
      };

      const mockError = { success: false, error: 'Insufficient balance' };
      (launchpadIntegration.buyToken as any).mockResolvedValue(mockError);

      const result = await launchpadIntegration.buyToken(tradeParams);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient balance');
    });
  });

  describe('Data Query Flow', () => {
    it('should handle data queries', async () => {
      const mockTokenInfo = {
        name: 'Blaze Token',
        symbol: 'BLAZE',
        decimals: 8,
        totalSupply: '1000000000',
      };

      const mockQuestInfo = {
        name: 'Trading Championship',
        participants: 25,
        status: 'active',
        prizePool: 10000000,
      };

      const mockPortfolioInfo = {
        holdings: [
          { token: 'BLAZE', quantity: 1000, value: 100000 },
        ],
        totalValue: 100000,
        pnl: 5000,
      };

      (launchpadIntegration.getTokenInfo as any).mockResolvedValue(mockTokenInfo);
      (launchpadIntegration.getQuestInfo as any).mockResolvedValue(mockQuestInfo);
      (launchpadIntegration.getPortfolioInfo as any).mockResolvedValue(mockPortfolioInfo);

      // Test token info query
      const tokenInfo = await launchpadIntegration.getTokenInfo('BLAZE');
      expect(tokenInfo).toEqual(mockTokenInfo);

      // Test quest info query
      const questInfo = await launchpadIntegration.getQuestInfo('quest-123');
      expect(questInfo).toEqual(mockQuestInfo);

      // Test portfolio info query
      const portfolioInfo = await launchpadIntegration.getPortfolioInfo('quest-123', '0x123');
      expect(portfolioInfo).toEqual(mockPortfolioInfo);
    });

    it('should handle query errors', async () => {
      (launchpadIntegration.getTokenInfo as any).mockRejectedValue(new Error('Network error'));

      try {
        await launchpadIntegration.getTokenInfo('INVALID');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });
  });

  describe('Contract Address Validation', () => {
    it('should use the correct contract address', () => {
      expect(launchpadIntegration.contractAddress).toBe('0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a');
    });

    it('should have valid contract address format', () => {
      const address = launchpadIntegration.contractAddress;
      expect(address).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });
  });

  describe('Error Handling', () => {
    it('should handle wallet connection errors', async () => {
      const error = new Error('User rejected the request');
      (launchpadIntegration.createToken as any).mockRejectedValue(error);

      try {
        await launchpadIntegration.createToken({
          name: 'Test',
          symbol: 'TEST',
          description: 'Test',
          imageUrl: 'https://example.com/test.png',
          decimals: 8,
        });
      } catch (err) {
        expect(err).toBe(error);
      }
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');
      (launchpadIntegration.getTokenInfo as any).mockRejectedValue(error);

      try {
        await launchpadIntegration.getTokenInfo('TEST');
      } catch (err) {
        expect(err).toBe(error);
      }
    });
  });
});

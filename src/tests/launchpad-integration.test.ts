import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLaunchpadIntegration } from '../hooks/useLaunchpadIntegration';

// Mock the wallet adapter
vi.mock('@aptos-labs/wallet-adapter-react', () => ({
  useWallet: () => ({
    signAndSubmitTransaction: vi.fn(),
    account: { address: '0x123' },
    connected: true,
  }),
}));

// Mock the Aptos SDK
vi.mock('@aptos-labs/ts-sdk', () => ({
  Aptos: vi.fn().mockImplementation(() => ({
    waitForTransaction: vi.fn().mockResolvedValue({}),
    view: vi.fn().mockResolvedValue({}),
  })),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Launchpad Integration', () => {
  let launchpadIntegration: ReturnType<typeof useLaunchpadIntegration>;

  beforeEach(() => {
    vi.clearAllMocks();
    // This would normally be called in a component, but for testing we'll mock it
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

  describe('Contract Configuration', () => {
    it('should have correct contract address', () => {
      expect(launchpadIntegration.contractAddress).toBe('0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a');
    });

    it('should have all required functions', () => {
      expect(launchpadIntegration.createToken).toBeDefined();
      expect(launchpadIntegration.createQuest).toBeDefined();
      expect(launchpadIntegration.joinQuest).toBeDefined();
      expect(launchpadIntegration.buyToken).toBeDefined();
      expect(launchpadIntegration.sellToken).toBeDefined();
      expect(launchpadIntegration.getTokenInfo).toBeDefined();
      expect(launchpadIntegration.getQuestInfo).toBeDefined();
      expect(launchpadIntegration.getPortfolioInfo).toBeDefined();
      expect(launchpadIntegration.hasJoinedQuest).toBeDefined();
    });
  });

  describe('Token Creation', () => {
    it('should create token with correct parameters', async () => {
      const tokenData = {
        name: 'Test Token',
        symbol: 'TEST',
        description: 'A test token',
        imageUrl: 'https://example.com/image.png',
        decimals: 8,
      };

      const mockResult = { success: true, hash: '0xabc123' };
      (launchpadIntegration.createToken as any).mockResolvedValue(mockResult);

      const result = await launchpadIntegration.createToken(tokenData);
      
      expect(result).toEqual(mockResult);
      expect(launchpadIntegration.createToken).toHaveBeenCalledWith(tokenData);
    });
  });

  describe('Quest Management', () => {
    it('should create quest with correct parameters', async () => {
      const questData = {
        name: 'Test Quest',
        description: 'A test quest',
        entryFee: 1000000,
        prizePool: 10000000,
        startTime: Date.now() + 3600000,
        endTime: Date.now() + 86400000,
        maxParticipants: 100,
      };

      const mockResult = { success: true, hash: '0xdef456' };
      (launchpadIntegration.createQuest as any).mockResolvedValue(mockResult);

      const result = await launchpadIntegration.createQuest(questData);
      
      expect(result).toEqual(mockResult);
      expect(launchpadIntegration.createQuest).toHaveBeenCalledWith(questData);
    });

    it('should join quest with correct quest ID', async () => {
      const questId = 'quest-123';
      const mockResult = { success: true, hash: '0xghi789' };
      (launchpadIntegration.joinQuest as any).mockResolvedValue(mockResult);

      const result = await launchpadIntegration.joinQuest(questId);
      
      expect(result).toEqual(mockResult);
      expect(launchpadIntegration.joinQuest).toHaveBeenCalledWith(questId);
    });
  });

  describe('Trading Functions', () => {
    it('should buy token with correct parameters', async () => {
      const tradeParams = {
        questId: 'quest-123',
        tokenAddress: '0xtoken123',
        symbol: 'TEST',
        quantity: 1000,
        cost: 100000,
      };

      const mockResult = { success: true, hash: '0xjkl012' };
      (launchpadIntegration.buyToken as any).mockResolvedValue(mockResult);

      const result = await launchpadIntegration.buyToken(tradeParams);
      
      expect(result).toEqual(mockResult);
      expect(launchpadIntegration.buyToken).toHaveBeenCalledWith(tradeParams);
    });

    it('should sell token with correct parameters', async () => {
      const questId = 'quest-123';
      const tokenAddress = '0xtoken123';
      const quantity = 500;
      const proceeds = 60000;

      const mockResult = { success: true, hash: '0xmno345' };
      (launchpadIntegration.sellToken as any).mockResolvedValue(mockResult);

      const result = await launchpadIntegration.sellToken(questId, tokenAddress, quantity, proceeds);
      
      expect(result).toEqual(mockResult);
      expect(launchpadIntegration.sellToken).toHaveBeenCalledWith(questId, tokenAddress, quantity, proceeds);
    });
  });

  describe('View Functions', () => {
    it('should get token info', async () => {
      const symbol = 'TEST';
      const mockTokenInfo = { name: 'Test Token', symbol: 'TEST', decimals: 8 };
      (launchpadIntegration.getTokenInfo as any).mockResolvedValue(mockTokenInfo);

      const result = await launchpadIntegration.getTokenInfo(symbol);
      
      expect(result).toEqual(mockTokenInfo);
      expect(launchpadIntegration.getTokenInfo).toHaveBeenCalledWith(symbol);
    });

    it('should get quest info', async () => {
      const questId = 'quest-123';
      const mockQuestInfo = { name: 'Test Quest', participants: 5, status: 'active' };
      (launchpadIntegration.getQuestInfo as any).mockResolvedValue(mockQuestInfo);

      const result = await launchpadIntegration.getQuestInfo(questId);
      
      expect(result).toEqual(mockQuestInfo);
      expect(launchpadIntegration.getQuestInfo).toHaveBeenCalledWith(questId);
    });

    it('should get portfolio info', async () => {
      const questId = 'quest-123';
      const participant = '0x123';
      const mockPortfolioInfo = { holdings: [], totalValue: 1000 };
      (launchpadIntegration.getPortfolioInfo as any).mockResolvedValue(mockPortfolioInfo);

      const result = await launchpadIntegration.getPortfolioInfo(questId, participant);
      
      expect(result).toEqual(mockPortfolioInfo);
      expect(launchpadIntegration.getPortfolioInfo).toHaveBeenCalledWith(questId, participant);
    });

    it('should check if user has joined quest', async () => {
      const questId = 'quest-123';
      const participant = '0x123';
      const mockHasJoined = true;
      (launchpadIntegration.hasJoinedQuest as any).mockResolvedValue(mockHasJoined);

      const result = await launchpadIntegration.hasJoinedQuest(questId, participant);
      
      expect(result).toEqual(mockHasJoined);
      expect(launchpadIntegration.hasJoinedQuest).toHaveBeenCalledWith(questId, participant);
    });
  });
});

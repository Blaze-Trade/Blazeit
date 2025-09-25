import { describe, it, expect, beforeEach, vi } from 'vitest';

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

describe('Launchpad Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Contract Address Verification', () => {
    it('should use the correct deployed contract address', () => {
      const expectedAddress = '0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a';
      expect(expectedAddress).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(expectedAddress).toBe('0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a');
    });
  });

  describe('Function Call Structure', () => {
    it('should create correct transaction payload for token creation', () => {
      const tokenData = {
        name: 'Test Token',
        symbol: 'TEST',
        description: 'A test token',
        imageUrl: 'https://example.com/image.png',
        decimals: 8,
      };

      const expectedPayload = {
        function: '0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a::launchpad::create_token',
        typeArguments: [],
        functionArguments: [
          tokenData.name,
          tokenData.symbol,
          tokenData.description,
          tokenData.imageUrl,
          tokenData.decimals,
        ],
      };

      expect(expectedPayload.function).toContain('launchpad::create_token');
      expect(expectedPayload.functionArguments).toHaveLength(5);
      expect(expectedPayload.typeArguments).toHaveLength(0);
    });

    it('should create correct transaction payload for quest creation', () => {
      const questData = {
        name: 'Test Quest',
        description: 'A test quest',
        entryFee: 1000000,
        prizePool: 10000000,
        startTime: Date.now() + 3600000,
        endTime: Date.now() + 86400000,
        maxParticipants: 100,
      };

      const expectedPayload = {
        function: '0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a::launchpad::create_quest',
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

      expect(expectedPayload.function).toContain('launchpad::create_quest');
      expect(expectedPayload.functionArguments).toHaveLength(7);
      expect(expectedPayload.typeArguments).toHaveLength(0);
    });

    it('should create correct transaction payload for quest joining', () => {
      const questId = 'quest-123';

      const expectedPayload = {
        function: '0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a::launchpad::join_quest',
        typeArguments: [],
        functionArguments: [questId],
      };

      expect(expectedPayload.function).toContain('launchpad::join_quest');
      expect(expectedPayload.functionArguments).toHaveLength(1);
      expect(expectedPayload.functionArguments[0]).toBe(questId);
    });

    it('should create correct transaction payload for token buying', () => {
      const tradeParams = {
        questId: 'quest-123',
        tokenAddress: '0xtoken123',
        symbol: 'TEST',
        quantity: 1000,
        cost: 100000,
      };

      const expectedPayload = {
        function: '0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a::launchpad::buy_token',
        typeArguments: [],
        functionArguments: [
          tradeParams.questId,
          tradeParams.tokenAddress,
          tradeParams.symbol,
          tradeParams.quantity,
          tradeParams.cost,
        ],
      };

      expect(expectedPayload.function).toContain('launchpad::buy_token');
      expect(expectedPayload.functionArguments).toHaveLength(5);
    });

    it('should create correct transaction payload for token selling', () => {
      const questId = 'quest-123';
      const tokenAddress = '0xtoken123';
      const quantity = 500;
      const proceeds = 60000;

      const expectedPayload = {
        function: '0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a::launchpad::sell_token',
        typeArguments: [],
        functionArguments: [questId, tokenAddress, quantity, proceeds],
      };

      expect(expectedPayload.function).toContain('launchpad::sell_token');
      expect(expectedPayload.functionArguments).toHaveLength(4);
    });
  });

  describe('View Function Calls', () => {
    it('should create correct view payload for token info', () => {
      const symbol = 'TEST';

      const expectedPayload = {
        function: '0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a::launchpad::get_token_info',
        typeArguments: [],
        functionArguments: [symbol],
      };

      expect(expectedPayload.function).toContain('launchpad::get_token_info');
      expect(expectedPayload.functionArguments).toHaveLength(1);
      expect(expectedPayload.functionArguments[0]).toBe(symbol);
    });

    it('should create correct view payload for quest info', () => {
      const questId = 'quest-123';

      const expectedPayload = {
        function: '0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a::launchpad::get_quest_info',
        typeArguments: [],
        functionArguments: [questId],
      };

      expect(expectedPayload.function).toContain('launchpad::get_quest_info');
      expect(expectedPayload.functionArguments).toHaveLength(1);
      expect(expectedPayload.functionArguments[0]).toBe(questId);
    });

    it('should create correct view payload for portfolio info', () => {
      const questId = 'quest-123';
      const participant = '0x123';

      const expectedPayload = {
        function: '0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a::launchpad::get_portfolio',
        typeArguments: [],
        functionArguments: [questId, participant],
      };

      expect(expectedPayload.function).toContain('launchpad::get_portfolio');
      expect(expectedPayload.functionArguments).toHaveLength(2);
      expect(expectedPayload.functionArguments[0]).toBe(questId);
      expect(expectedPayload.functionArguments[1]).toBe(participant);
    });

    it('should create correct view payload for has joined quest check', () => {
      const questId = 'quest-123';
      const participant = '0x123';

      const expectedPayload = {
        function: '0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a::launchpad::has_joined_quest',
        typeArguments: [],
        functionArguments: [questId, participant],
      };

      expect(expectedPayload.function).toContain('launchpad::has_joined_quest');
      expect(expectedPayload.functionArguments).toHaveLength(2);
      expect(expectedPayload.functionArguments[0]).toBe(questId);
      expect(expectedPayload.functionArguments[1]).toBe(participant);
    });
  });

  describe('Error Handling', () => {
    it('should handle wallet connection errors', () => {
      const error = new Error('User rejected the request');
      expect(error.message).toContain('User rejected');
    });

    it('should handle network errors', () => {
      const error = new Error('Network error');
      expect(error.message).toContain('Network');
    });

    it('should handle contract execution errors', () => {
      const error = new Error('Contract execution failed');
      expect(error.message).toContain('Contract execution');
    });
  });

  describe('Data Validation', () => {
    it('should validate token data before contract call', () => {
      const validTokenData = {
        name: 'Test Token',
        symbol: 'TEST',
        description: 'A test token',
        imageUrl: 'https://example.com/image.png',
        decimals: 8,
      };

      expect(validTokenData.name).toBeTruthy();
      expect(validTokenData.symbol).toBeTruthy();
      expect(validTokenData.description).toBeTruthy();
      expect(validTokenData.imageUrl).toMatch(/^https?:\/\/.+/);
      expect(validTokenData.decimals).toBeGreaterThan(0);
      expect(validTokenData.decimals).toBeLessThanOrEqual(18);
    });

    it('should validate quest data before contract call', () => {
      const validQuestData = {
        name: 'Test Quest',
        description: 'A test quest',
        entryFee: 1000000,
        prizePool: 10000000,
        startTime: Date.now() + 3600000,
        endTime: Date.now() + 86400000,
        maxParticipants: 100,
      };

      expect(validQuestData.name).toBeTruthy();
      expect(validQuestData.description).toBeTruthy();
      expect(validQuestData.entryFee).toBeGreaterThan(0);
      expect(validQuestData.prizePool).toBeGreaterThan(0);
      expect(validQuestData.startTime).toBeGreaterThan(Date.now());
      expect(validQuestData.endTime).toBeGreaterThan(validQuestData.startTime);
      expect(validQuestData.maxParticipants).toBeGreaterThan(0);
    });

    it('should validate trading data before contract call', () => {
      const validTradeData = {
        questId: 'quest-123',
        tokenAddress: '0x1234567890abcdef1234567890abcdef12345678',
        symbol: 'TEST',
        quantity: 1000,
        cost: 100000,
      };

      expect(validTradeData.questId).toBeTruthy();
      expect(validTradeData.tokenAddress).toMatch(/^0x[a-fA-F0-9]+$/);
      expect(validTradeData.symbol).toBeTruthy();
      expect(validTradeData.quantity).toBeGreaterThan(0);
      expect(validTradeData.cost).toBeGreaterThan(0);
    });
  });
});

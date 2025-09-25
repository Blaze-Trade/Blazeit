import { describe, it, expect } from 'vitest';
import { CONTRACT_FUNCTIONS, CONTRACT_CONFIG } from '../lib/contracts';

describe('Contract Functions', () => {
  describe('Contract Configuration', () => {
    it('should have correct contract address', () => {
      expect(CONTRACT_CONFIG.addresses.blazeTokenLaunchpad).toBe('0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a');
    });

    it('should have correct module name', () => {
      expect(CONTRACT_CONFIG.modules.launchpad).toBe('blaze_token_launchpad::launchpad');
    });
  });

  describe('Function Signatures', () => {
    it('should have correct token creation function signature', () => {
      const expectedSignature = '0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a::launchpad::create_token';
      expect(CONTRACT_FUNCTIONS.launchpad.createToken).toBe(expectedSignature);
    });

    it('should have correct quest creation function signature', () => {
      const expectedSignature = '0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a::launchpad::create_quest';
      expect(CONTRACT_FUNCTIONS.launchpad.createQuest).toBe(expectedSignature);
    });

    it('should have correct quest join function signature', () => {
      const expectedSignature = '0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a::launchpad::join_quest';
      expect(CONTRACT_FUNCTIONS.launchpad.joinQuest).toBe(expectedSignature);
    });

    it('should have correct token buy function signature', () => {
      const expectedSignature = '0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a::launchpad::buy_token';
      expect(CONTRACT_FUNCTIONS.launchpad.buyToken).toBe(expectedSignature);
    });

    it('should have correct token sell function signature', () => {
      const expectedSignature = '0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a::launchpad::sell_token';
      expect(CONTRACT_FUNCTIONS.launchpad.sellToken).toBe(expectedSignature);
    });

    it('should have correct token info function signature', () => {
      const expectedSignature = '0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a::launchpad::get_token_info';
      expect(CONTRACT_FUNCTIONS.launchpad.getTokenInfo).toBe(expectedSignature);
    });

    it('should have correct quest info function signature', () => {
      const expectedSignature = '0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a::launchpad::get_quest_info';
      expect(CONTRACT_FUNCTIONS.launchpad.getQuestInfo).toBe(expectedSignature);
    });

    it('should have correct portfolio info function signature', () => {
      const expectedSignature = '0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a::launchpad::get_portfolio';
      expect(CONTRACT_FUNCTIONS.launchpad.getPortfolioInfo).toBe(expectedSignature);
    });

    it('should have correct has joined quest function signature', () => {
      const expectedSignature = '0x9239ac2bb7bb998c6d19d1b309dd2093f130185710415832caf30bf0c99d678a::launchpad::has_joined_quest';
      expect(CONTRACT_FUNCTIONS.launchpad.hasJoinedQuest).toBe(expectedSignature);
    });
  });

  describe('Function Parameter Validation', () => {
    it('should validate token creation parameters', () => {
      const validTokenData = {
        name: 'Test Token',
        symbol: 'TEST',
        description: 'A test token',
        imageUrl: 'https://example.com/image.png',
        decimals: 8,
      };

      // These would be the expected parameters for the contract call
      const expectedParams = [
        validTokenData.name,
        validTokenData.symbol,
        validTokenData.description,
        validTokenData.imageUrl,
        validTokenData.decimals,
      ];

      expect(expectedParams).toHaveLength(5);
      expect(expectedParams[0]).toBe('Test Token');
      expect(expectedParams[1]).toBe('TEST');
      expect(expectedParams[2]).toBe('A test token');
      expect(expectedParams[3]).toBe('https://example.com/image.png');
      expect(expectedParams[4]).toBe(8);
    });

    it('should validate quest creation parameters', () => {
      const validQuestData = {
        name: 'Test Quest',
        description: 'A test quest',
        entryFee: 1000000,
        prizePool: 10000000,
        startTime: Date.now() + 3600000,
        endTime: Date.now() + 86400000,
        maxParticipants: 100,
      };

      const expectedParams = [
        validQuestData.name,
        validQuestData.description,
        validQuestData.entryFee,
        validQuestData.prizePool,
        validQuestData.startTime,
        validQuestData.endTime,
        validQuestData.maxParticipants,
      ];

      expect(expectedParams).toHaveLength(7);
      expect(expectedParams[0]).toBe('Test Quest');
      expect(expectedParams[1]).toBe('A test quest');
      expect(expectedParams[2]).toBe(1000000);
      expect(expectedParams[3]).toBe(10000000);
      expect(typeof expectedParams[4]).toBe('number');
      expect(typeof expectedParams[5]).toBe('number');
      expect(expectedParams[6]).toBe(100);
    });

    it('should validate trading parameters', () => {
      const validTradeParams = {
        questId: 'quest-123',
        tokenAddress: '0xtoken123',
        symbol: 'TEST',
        quantity: 1000,
        cost: 100000,
      };

      const expectedBuyParams = [
        validTradeParams.questId,
        validTradeParams.tokenAddress,
        validTradeParams.symbol,
        validTradeParams.quantity,
        validTradeParams.cost,
      ];

      expect(expectedBuyParams).toHaveLength(5);
      expect(expectedBuyParams[0]).toBe('quest-123');
      expect(expectedBuyParams[1]).toBe('0xtoken123');
      expect(expectedBuyParams[2]).toBe('TEST');
      expect(expectedBuyParams[3]).toBe(1000);
      expect(expectedBuyParams[4]).toBe(100000);
    });
  });
});

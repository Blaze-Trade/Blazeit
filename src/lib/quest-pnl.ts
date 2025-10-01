/**
 * Quest PNL (Profit & Loss) Calculation System
 *
 * This module handles:
 * - Mock price generation for tokens
 * - Token price snapshots at quest start/end
 * - PNL calculation for participants
 * - Leaderboard generation
 */

import type { Token } from '@shared/types';
import { supabaseApi } from './supabase-api';

// ============= MOCK PRICE GENERATION ============= //

/**
 * Generate a realistic price change for a token
 * Simulates market volatility with different risk profiles
 */
export function generatePriceChange(token: Token, timeElapsedHours: number): number {
  // Different tokens have different volatility profiles
  const volatilityMap: Record<string, number> = {
    'BTC': 0.02,  // 2% max change per hour
    'ETH': 0.03,  // 3% max change per hour
    'APT': 0.05,  // 5% max change per hour
    'SOL': 0.04,  // 4% max change per hour
    'default': 0.06  // 6% max change per hour (meme coins, etc.)
  };

  const volatility = volatilityMap[token.symbol] || volatilityMap['default'];

  // Random walk with slight upward bias (bull market simulation)
  const randomChange = (Math.random() - 0.45) * volatility * timeElapsedHours;

  // Add some major moves occasionally (10% chance of 2x volatility)
  const isMajorMove = Math.random() < 0.1;
  const finalChange = isMajorMove ? randomChange * 2 : randomChange;

  return finalChange;
}

/**
 * Generate mock price for a token at a specific time
 */
export function generateMockPrice(
  token: Token,
  basePrice: number,
  timeElapsedHours: number
): number {
  const priceChange = generatePriceChange(token, timeElapsedHours);
  const newPrice = basePrice * (1 + priceChange);

  // Ensure price doesn't go negative or too close to zero
  return Math.max(newPrice, basePrice * 0.5);
}

/**
 * Generate mock prices for all tokens at quest start
 */
export function generateStartPrices(tokens: Token[]): Map<string, number> {
  const prices = new Map<string, number>();

  tokens.forEach(token => {
    // Use current price as base, add small random variation
    const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
    const startPrice = token.price * (1 + variation);
    prices.set(token.id, startPrice);
  });

  return prices;
}

/**
 * Generate mock prices for all tokens at quest end
 */
export function generateEndPrices(
  tokens: Token[],
  startPrices: Map<string, number>,
  questDurationHours: number
): Map<string, number> {
  const prices = new Map<string, number>();

  tokens.forEach(token => {
    const startPrice = startPrices.get(token.id) || token.price;
    const endPrice = generateMockPrice(token, startPrice, questDurationHours);
    prices.set(token.id, endPrice);
  });

  return prices;
}

// ============= PNL CALCULATION ============= //

export interface TokenPriceSnapshot {
  tokenId: string;
  tokenSymbol: string;
  priceAtStart: number;
  priceAtEnd: number;
  priceChange: number;
  priceChangePercent: number;
}

export interface PortfolioHolding {
  tokenId: string;
  tokenSymbol: string;
  quantity: number;
  investmentAmount: number;
  priceAtStart: number;
  priceAtEnd: number;
}

export interface ParticipantPNL {
  userId: string;
  walletAddress: string;
  portfolio: PortfolioHolding[];
  totalInvestment: number;
  totalValue: number;
  totalPNL: number;
  totalPNLPercent: number;
  rank?: number;
}

/**
 * Calculate PNL for a single token holding
 */
export function calculateTokenPNL(holding: PortfolioHolding): {
  startValue: number;
  endValue: number;
  pnl: number;
  pnlPercent: number;
} {
  const startValue = holding.investmentAmount;
  const priceChangePercent = ((holding.priceAtEnd - holding.priceAtStart) / holding.priceAtStart) * 100;
  const endValue = startValue * (1 + priceChangePercent / 100);
  const pnl = endValue - startValue;
  const pnlPercent = (pnl / startValue) * 100;

  return {
    startValue,
    endValue,
    pnl,
    pnlPercent
  };
}

/**
 * Calculate total portfolio PNL for a participant
 */
export function calculatePortfolioPNL(portfolio: PortfolioHolding[]): {
  totalInvestment: number;
  totalValue: number;
  totalPNL: number;
  totalPNLPercent: number;
} {
  let totalInvestment = 0;
  let totalValue = 0;

  portfolio.forEach(holding => {
    const { startValue, endValue } = calculateTokenPNL(holding);
    totalInvestment += startValue;
    totalValue += endValue;
  });

  const totalPNL = totalValue - totalInvestment;
  const totalPNLPercent = (totalPNL / totalInvestment) * 100;

  return {
    totalInvestment,
    totalValue,
    totalPNL,
    totalPNLPercent
  };
}

/**
 * Sort participants by PNL and assign ranks
 */
export function rankParticipants(participants: ParticipantPNL[]): ParticipantPNL[] {
  // Sort by PNL percentage (highest first)
  const sorted = [...participants].sort((a, b) => b.totalPNLPercent - a.totalPNLPercent);

  // Assign ranks
  sorted.forEach((participant, index) => {
    participant.rank = index + 1;
  });

  return sorted;
}

// ============= QUEST PNL SERVICE ============= //

/**
 * Snapshot token prices at quest start
 */
export async function snapshotQuestStartPrices(
  questId: string,
  tokens: Token[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const startPrices = generateStartPrices(tokens);

    // Store in database (if table exists)
    // For MVP, we can store in localStorage or skip database storage
    const snapshots: any[] = [];

    tokens.forEach(token => {
      const price = startPrices.get(token.id);
      if (price) {
        snapshots.push({
          quest_id: questId,
          token_id: token.id,
          price_at_start: price,
          snapshot_time: new Date().toISOString()
        });
      }
    });

    // Store in localStorage for MVP
    const storageKey = `quest_${questId}_start_prices`;
    localStorage.setItem(storageKey, JSON.stringify(snapshots));

    console.log(`Snapshotted start prices for quest ${questId}:`, snapshots);

    return { success: true };
  } catch (error: any) {
    console.error('Failed to snapshot start prices:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Snapshot token prices at quest end
 */
export async function snapshotQuestEndPrices(
  questId: string,
  tokens: Token[],
  durationHours: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get start prices
    const storageKey = `quest_${questId}_start_prices`;
    const startSnapshotsJson = localStorage.getItem(storageKey);

    if (!startSnapshotsJson) {
      return { success: false, error: 'Start prices not found' };
    }

    const startSnapshots = JSON.parse(startSnapshotsJson);
    const startPrices = new Map<string, number>();

    startSnapshots.forEach((snap: any) => {
      startPrices.set(snap.token_id, parseFloat(snap.price_at_start));
    });

    // Generate end prices
    const endPrices = generateEndPrices(tokens, startPrices, durationHours);

    // Update snapshots with end prices
    const updatedSnapshots = startSnapshots.map((snap: any) => ({
      ...snap,
      price_at_end: endPrices.get(snap.token_id),
      updated_at: new Date().toISOString()
    }));

    localStorage.setItem(storageKey, JSON.stringify(updatedSnapshots));

    console.log(`Snapshotted end prices for quest ${questId}:`, updatedSnapshots);

    return { success: true };
  } catch (error: any) {
    console.error('Failed to snapshot end prices:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get price snapshots for a quest
 */
export function getQuestPriceSnapshots(questId: string): TokenPriceSnapshot[] {
  const storageKey = `quest_${questId}_start_prices`;
  const snapshotsJson = localStorage.getItem(storageKey);

  if (!snapshotsJson) {
    return [];
  }

  const snapshots = JSON.parse(snapshotsJson);

  return snapshots.map((snap: any) => ({
    tokenId: snap.token_id,
    tokenSymbol: snap.token_symbol || 'UNKNOWN',
    priceAtStart: parseFloat(snap.price_at_start),
    priceAtEnd: snap.price_at_end ? parseFloat(snap.price_at_end) : parseFloat(snap.price_at_start),
    priceChange: snap.price_at_end
      ? parseFloat(snap.price_at_end) - parseFloat(snap.price_at_start)
      : 0,
    priceChangePercent: snap.price_at_end
      ? ((parseFloat(snap.price_at_end) - parseFloat(snap.price_at_start)) / parseFloat(snap.price_at_start)) * 100
      : 0
  }));
}

/**
 * Calculate PNL for all participants in a quest
 */
export async function calculateQuestPNL(questId: string): Promise<{
  success: boolean;
  data?: ParticipantPNL[];
  error?: string;
}> {
  try {
    // Get price snapshots
    const priceSnapshots = getQuestPriceSnapshots(questId);

    if (priceSnapshots.length === 0) {
      return { success: false, error: 'No price snapshots found for this quest' };
    }

    // Create price map for easy lookup
    const priceMap = new Map<string, TokenPriceSnapshot>();
    priceSnapshots.forEach(snap => {
      priceMap.set(snap.tokenId, snap);
    });

    // Get all participants and their portfolios
    const portfoliosResult = await supabaseApi.quests.getQuestPortfolio(questId, 'admin');

    if (!portfoliosResult.success) {
      return { success: false, error: 'Failed to fetch quest portfolios' };
    }

    // For MVP, we'll need to manually construct participant data
    // In production, this would query the database properly

    // Return mock data for now
    const mockParticipants: ParticipantPNL[] = [];

    return { success: true, data: mockParticipants };
  } catch (error: any) {
    console.error('Failed to calculate quest PNL:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate leaderboard for a quest
 */
export async function generateQuestLeaderboard(questId: string): Promise<{
  success: boolean;
  data?: ParticipantPNL[];
  error?: string;
}> {
  try {
    const pnlResult = await calculateQuestPNL(questId);

    if (!pnlResult.success || !pnlResult.data) {
      return { success: false, error: pnlResult.error };
    }

    const rankedParticipants = rankParticipants(pnlResult.data);

    console.log('Generated leaderboard:', rankedParticipants);

    return { success: true, data: rankedParticipants };
  } catch (error: any) {
    console.error('Failed to generate leaderboard:', error);
    return { success: false, error: error.message };
  }
}

// ============= UTILITY FUNCTIONS ============= //

/**
 * Format PNL for display
 */
export function formatPNL(pnl: number): string {
  const sign = pnl >= 0 ? '+' : '';
  return `${sign}${pnl.toFixed(2)}`;
}

/**
 * Format PNL percentage for display
 */
export function formatPNLPercent(pnlPercent: number): string {
  const sign = pnlPercent >= 0 ? '+' : '';
  return `${sign}${pnlPercent.toFixed(2)}%`;
}

/**
 * Get PNL color class for UI
 */
export function getPNLColorClass(pnl: number): string {
  if (pnl > 0) return 'text-green-600';
  if (pnl < 0) return 'text-red-600';
  return 'text-gray-600';
}


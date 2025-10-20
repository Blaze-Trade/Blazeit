import type {
  ApiResponse,
  Holding,
  LeaderboardEntry,
  Quest,
  QuestPortfolio,
  Token,
} from "@shared/types";
import { supabase } from './supabase';
import { formatDuration } from './utils';

// Database types (matching our Supabase schema)
export interface User {
  id: string;
  wallet_address: string;
  username?: string;
  email?: string;
  avatar_url?: string;
  balance: number;
  total_winnings: number;
  created_at: string;
  updated_at: string;
}

export interface QuestParticipant {
  id: string;
  quest_id: string;
  user_id: string;
  joined_at: string;
  entry_fee_paid: number;
  final_rank?: number;
  prize_won: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  quest_id?: string;
  type: 'quest_entry' | 'prize_payout' | 'deposit' | 'withdrawal' | 'trade_buy' | 'trade_sell';
  amount: number;
  token_symbol?: string;
  status: 'pending' | 'completed' | 'failed';
  blockchain_tx_hash?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface TokenCreationRequest {
  id: string;
  creator_id: string;
  name: string;
  symbol: string;
  description?: string;
  image_url?: string;
  max_supply?: number;
  target_supply?: number;
  virtual_liquidity?: number;
  curve_exponent: number;
  mint_limit_per_address?: number;
  status: 'pending' | 'approved' | 'rejected' | 'deployed';
  blockchain_address?: string;
  created_at: string;
  updated_at: string;
}

// Helper function to handle Supabase responses
const handleResponse = <T>(data: T | null, error: any): ApiResponse<T> => {
  if (error) {
    console.error('Supabase error:', error);
    return { success: false, error: error.message };
  }
  return { success: true, data };
};

// Helper function to get user by wallet address
const getUserByWallet = async (walletAddress: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
};

// Helper function to create or get user
const createOrGetUser = async (walletAddress: string): Promise<User> => {
  let user = await getUserByWallet(walletAddress);

  if (!user) {
    const { data, error } = await supabase
      .from('users')
      .insert({ wallet_address: walletAddress })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    user = data;
  }

  return user;
};

// Helper function to format Aptos addresses to proper 64-character format
const formatAptosAddress = (address: string | null | undefined): string | undefined => {
  if (!address) return undefined;

  // If it's already a proper Aptos address (66 chars with 0x prefix), return as is
  if (address.startsWith('0x') && address.length === 66) {
    return address;
  }

  // If it's a resource format (like 0x1::aptos_coin::AptosCoin), convert to proper address
  if (address.includes('::')) {
    // For mock tokens, use predefined addresses
    const resourceMap: Record<string, string> = {
      '0x1::aptos_coin::AptosCoin': '0x0000000000000000000000000000000000000000000000000000000000000001',
      '0x1::sui::Sui': '0x0000000000000000000000000000000000000000000000000000000000000002',
      '0x1::bitcoin::Bitcoin': '0x0000000000000000000000000000000000000000000000000000000000000003',
      '0x1::ethereum::Ethereum': '0x0000000000000000000000000000000000000000000000000000000000000004',
      '0x1::solana::Solana': '0x0000000000000000000000000000000000000000000000000000000000000005',
    };
    return resourceMap[address] || address;
  }

  // If it's a hex string but not 64 chars, pad it
  if (address.startsWith('0x')) {
    const hexPart = address.slice(2);
    const paddedHex = hexPart.padStart(64, '0');
    return `0x${paddedHex}`;
  }

  // If it's a hex string without 0x prefix, add prefix and pad
  const paddedHex = address.padStart(64, '0');
  return `0x${paddedHex}`;
};

// TOKEN API
const tokenApi = {
  // Get all tokens
  async getTokens(): Promise<
    ApiResponse<{ items: Token[]; next: string | null }>
  > {
    const { data, error } = await supabase
      .from("tokens")
      .select("*")
      .eq("is_active", true)
      .order("market_cap", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    const tokens: Token[] = data.map((token) => ({
      id: token.id,
      symbol: token.symbol,
      name: token.name,
      price: parseFloat(token.price),
      change24h: parseFloat(token.change_24h),
      marketCap: parseFloat(token.market_cap),
      logoUrl: token.logo_url || "",
      address: formatAptosAddress(token.address),
      decimals: token.decimals,
    }));

    // Shuffle tokens for variety
    const shuffledTokens = tokens.sort(() => Math.random() - 0.5);

    return { success: true, data: { items: shuffledTokens, next: null } };
  },

  // Get token by symbol
  async getTokenBySymbol(symbol: string): Promise<ApiResponse<Token>> {
    const { data, error } = await supabase
      .from("tokens")
      .select("*")
      .eq("symbol", symbol)
      .eq("is_active", true)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const token: Token = {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      price: parseFloat(data.price),
      change24h: parseFloat(data.change_24h),
      marketCap: parseFloat(data.market_cap),
      logoUrl: data.logo_url || "",
      address: data.address,
      decimals: data.decimals,
    };

    return { success: true, data: token };
  },

  // Update token price
  async updateTokenPrice(
    symbol: string,
    price: number,
    change24h: number,
    marketCap: number
  ): Promise<ApiResponse<void>> {
    const { error } = await supabase
      .from("tokens")
      .update({
        price: price.toString(),
        change_24h: change24h.toString(),
        market_cap: marketCap.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq("symbol", symbol);

    return handleResponse(null, error);
  },
};

// QUEST API
const questApi = {
  // Get all quests
  async getQuests(): Promise<
    ApiResponse<{ items: Quest[]; next: string | null }>
  > {
    try {
      const { data, error } = await supabase.rpc("get_all_quests");

      if (error) {
        return { success: false, error: error.message };
      }

      const quests: Quest[] = data.map((quest: any) => ({
        id: quest.id,
        name: quest.name,
        entryFee: quest.entryFee,
        prizePool: quest.prizePool,
        duration: formatDuration(quest.durationMinutes),
        durationMinutes: quest.durationMinutes,
        participants: quest.currentParticipants || 0,
        status: quest.status,
        startTime: quest.startTime,
        endTime: quest.endTime,
        creatorId: quest.creatorId,
        creatorWalletAddress: quest.creatorWalletAddress,
        blockchainQuestId: quest.blockchainQuestId,
      }));

      // Sort quests intelligently:
      // 1. Active quests first (ending soonest at top)
      // 2. Upcoming quests (starting soonest at top)
      // 3. Ended quests last (most recently ended at top)
      const sortedQuests = quests.sort((a, b) => {
        const statusOrder = { active: 0, upcoming: 1, ended: 2 };
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];

        // If different status, sort by status priority
        if (statusDiff !== 0) {
          return statusDiff;
        }

        // Same status - sort by time
        if (a.status === "active") {
          // Active: show ending soonest first
          const aEnd = a.endTime ? new Date(a.endTime).getTime() : Infinity;
          const bEnd = b.endTime ? new Date(b.endTime).getTime() : Infinity;
          return aEnd - bEnd;
        } else if (a.status === "upcoming") {
          // Upcoming: show starting soonest first
          const aStart = a.startTime
            ? new Date(a.startTime).getTime()
            : Infinity;
          const bStart = b.startTime
            ? new Date(b.startTime).getTime()
            : Infinity;
          return aStart - bStart;
        } else {
          // Ended: show most recently ended first
          const aEnd = a.endTime ? new Date(a.endTime).getTime() : 0;
          const bEnd = b.endTime ? new Date(b.endTime).getTime() : 0;
          return bEnd - aEnd;
        }
      });

      return { success: true, data: { items: sortedQuests, next: null } };
    } catch (error) {
      return { success: false, error: "Failed to fetch quests" };
    }
  },

  // Get quest by ID using centralized RPC function
  async getQuest(questId: string): Promise<ApiResponse<Quest>> {
    try {
      const { data, error } = await supabase.rpc("get_quest_details", {
        quest_uuid: questId,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: "Quest not found" };
      }

      const quest: Quest = {
        id: data.id,
        name: data.name,
        entryFee: data.entryFee,
        prizePool: data.prizePool,
        duration: formatDuration(data.durationMinutes),
        durationMinutes: data.durationMinutes,
        participants: data.currentParticipants || 0,
        status: data.status,
        startTime: data.startTime,
        endTime: data.endTime,
        creatorId: data.creatorId,
        creatorWalletAddress: data.creatorWalletAddress,
        blockchainQuestId: data.blockchainQuestId,
      };

      return { success: true, data: quest };
    } catch (error) {
      return { success: false, error: "Failed to fetch quest details" };
    }
  },

  // Create quest
  async createQuest(questData: {
    name: string;
    description?: string;
    entryFee: number;
    prizePool: number;
    durationMinutes: number;
    startTime: Date;
    endTime: Date;
    maxParticipants?: number;
    creatorWalletAddress: string;
    blockchainQuestId?: number;
    blockchainTxHash?: string;
  }): Promise<ApiResponse<Quest>> {
    try {
      const user = await createOrGetUser(questData.creatorWalletAddress);

      console.log("💾 Creating quest - input data:", {
        durationMinutes: questData.durationMinutes,
        startTime: questData.startTime,
        endTime: questData.endTime,
      });

      const { data, error } = await supabase
        .from("quests")
        .insert({
          name: questData.name,
          description: questData.description,
          entry_fee: questData.entryFee.toString(),
          prize_pool: questData.prizePool.toString(),
          duration_minutes: questData.durationMinutes,
          start_time: questData.startTime.toISOString(),
          end_time: questData.endTime.toISOString(),
          max_participants: questData.maxParticipants || 100,
          creator_id: user.id,
          blockchain_quest_id: questData.blockchainQuestId, // Store blockchain quest ID
          blockchain_tx_hash: questData.blockchainTxHash, // Store transaction hash
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Get duration directly from database, or fallback to calculating from start/end times
      let durationMinutes = data.duration_minutes || 0;

      // If duration_minutes is 0 or invalid, calculate from start/end times as fallback
      if (!durationMinutes || durationMinutes === 0) {
        if (data.start_time && data.end_time) {
          const startTime = new Date(data.start_time);
          const endTime = new Date(data.end_time);
          const diffMs = endTime.getTime() - startTime.getTime();
          durationMinutes = Math.round(diffMs / (1000 * 60));
        }
      }

      console.log("📊 Created quest mapping:", {
        id: data.id,
        name: data.name,
        duration_minutes: data.duration_minutes,
        start_time: data.start_time,
        end_time: data.end_time,
        final_durationMinutes: durationMinutes,
      });

      const quest: Quest = {
        id: data.id,
        name: data.name,
        entryFee: parseFloat(data.entry_fee),
        prizePool: parseFloat(data.prize_pool),
        duration: "", // Deprecated - use durationMinutes only
        durationMinutes: durationMinutes, // Convert hours to minutes or calculate from times
        participants: data.current_participants,
        status: data.status,
        startTime: data.start_time,
        endTime: data.end_time,
        blockchainQuestId: data.blockchain_quest_id, // Include blockchain quest ID
      };

      return { success: true, data: quest };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Join quest
  async joinQuest(
    questId: string,
    walletAddress: string
  ): Promise<ApiResponse<QuestPortfolio>> {
    try {
      const { data, error } = await supabase.rpc("join_quest", {
        quest_uuid: questId,
        user_wallet_address: walletAddress,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.success) {
        return { success: false, error: data.error };
      }

      // Return new portfolio
      const portfolio: QuestPortfolio = {
        id: `${questId}:${walletAddress}`,
        questId,
        userId: walletAddress,
        joinedAt: Date.now(),
        holdings: [],
      };

      return { success: true, data: portfolio };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Get quest portfolio using centralized RPC function
  async getQuestPortfolio(
    questId: string,
    walletAddress: string
  ): Promise<ApiResponse<QuestPortfolio>> {
    try {
      const { data, error } = await supabase.rpc("get_user_quest_portfolio", {
        quest_uuid: questId,
        user_wallet_address: walletAddress,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const holdings: Holding[] = data.map((holding: any) => ({
        id: holding.tokenId,
        symbol: holding.symbol,
        name: holding.name,
        price: holding.entryPrice, // Use entry price for quest context
        change24h: 0, // Not relevant in quest context
        marketCap: 0, // Not relevant in quest context
        logoUrl: "", // Not provided by RPC
        address: "", // Not provided by RPC
        decimals: 8, // Default
        quantity: holding.quantity,
        cost: holding.totalCost,
        value: holding.currentValue,
      }));

      const portfolio: QuestPortfolio = {
        id: `${questId}:${walletAddress}`,
        questId,
        userId: walletAddress,
        joinedAt: Date.now(), // Will be updated when we get participant info
        holdings,
      };

      return { success: true, data: portfolio };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Buy token in quest
  async buyTokenInQuest(
    questId: string,
    walletAddress: string,
    token: Token,
    quantity: number
  ): Promise<ApiResponse<QuestPortfolio>> {
    try {
      const user = await getUserByWallet(walletAddress);
      if (!user) {
        return { success: false, error: "User not found" };
      }

      // Check if user is participant
      const { data: participant, error: participantError } = await supabase
        .from("quest_participants")
        .select("*")
        .eq("quest_id", questId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!participant) {
        return { success: false, error: "User has not joined this quest" };
      }

      const cost = token.price * quantity;

      // Check if user already has this token in portfolio
      const { data: existingHolding, error: holdingError } = await supabase
        .from("quest_portfolios")
        .select("*")
        .eq("quest_id", questId)
        .eq("user_id", user.id)
        .eq("token_id", token.id)
        .maybeSingle();

      if (existingHolding) {
        // Update existing holding
        const newQuantity = parseFloat(existingHolding.quantity) + quantity;
        const newCost = parseFloat(existingHolding.total_cost) + cost;
        const newValue = newQuantity * token.price;

        const { error } = await supabase
          .from("quest_portfolios")
          .update({
            quantity: newQuantity.toString(),
            total_cost: newCost.toString(),
            current_value: newValue.toString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingHolding.id);

        if (error) {
          return { success: false, error: error.message };
        }
      } else {
        // Create new holding
        const { error } = await supabase.from("quest_portfolios").insert({
          quest_id: questId,
          user_id: user.id,
          token_id: token.id,
          quantity: quantity.toString(),
          entry_price: token.price.toString(),
          current_value: cost.toString(),
          total_cost: cost.toString(),
        });

        if (error) {
          return { success: false, error: error.message };
        }
      }

      // Return updated portfolio
      return await this.getQuestPortfolio(questId, walletAddress);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Sell token in quest
  async sellTokenInQuest(
    questId: string,
    walletAddress: string,
    tokenId: string,
    quantity: number
  ): Promise<ApiResponse<QuestPortfolio>> {
    try {
      const user = await getUserByWallet(walletAddress);
      if (!user) {
        return { success: false, error: "User not found" };
      }

      // Get existing holding
      const { data: holding, error: fetchError } = await supabase
        .from("quest_portfolios")
        .select("*")
        .eq("quest_id", questId)
        .eq("user_id", user.id)
        .eq("token_id", tokenId)
        .single();

      if (fetchError || !holding) {
        return { success: false, error: "Token not found in portfolio" };
      }

      const currentQuantity = parseFloat(holding.quantity);
      const sellQuantity = Math.min(quantity, currentQuantity);

      if (sellQuantity <= 0) {
        return { success: false, error: "Invalid sell quantity" };
      }

      const averageCost = parseFloat(holding.total_cost) / currentQuantity;
      const newQuantity = currentQuantity - sellQuantity;
      const newCost = newQuantity * averageCost;

      if (newQuantity === 0) {
        // Remove holding completely
        const { error } = await supabase
          .from("quest_portfolios")
          .delete()
          .eq("id", holding.id);

        if (error) {
          return { success: false, error: error.message };
        }
      } else {
        // Update holding
        const { error } = await supabase
          .from("quest_portfolios")
          .update({
            quantity: newQuantity.toString(),
            total_cost: newCost.toString(),
            current_value: newQuantity * parseFloat(holding.entry_price), // Simplified
            updated_at: new Date().toISOString(),
          })
          .eq("id", holding.id);

        if (error) {
          return { success: false, error: error.message };
        }
      }

      // Return updated portfolio
      return await this.getQuestPortfolio(questId, walletAddress);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Submit portfolio for a quest
  async submitQuestPortfolio(
    questId: string,
    walletAddress: string,
    tokenSelections: Array<{
      tokenId: string;
      quantity: number;
      entryPrice: number;
      totalCost: number;
    }>,
    blockchainTxHash?: string
  ): Promise<ApiResponse<void>> {
    try {
      // Convert token selections to the format expected by the RPC function
      const portfolioData = tokenSelections.map((selection) => ({
        tokenId: selection.tokenId,
        quantity: selection.quantity,
        entryPrice: selection.entryPrice,
        totalCost: selection.totalCost,
      }));

      const { data, error } = await supabase.rpc("submit_quest_portfolio", {
        quest_uuid: questId,
        user_wallet_address: walletAddress,
        portfolio_data: portfolioData,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.success) {
        return { success: false, error: data.error };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Get quest leaderboard using centralized RPC function
  async getQuestLeaderboard(
    questId: string
  ): Promise<ApiResponse<LeaderboardEntry[]>> {
    try {
      const { data, error } = await supabase.rpc("get_quest_leaderboard", {
        quest_uuid: questId,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const leaderboard: LeaderboardEntry[] = data.map((entry: any) => ({
        rank: entry.rank,
        address: entry.address,
        portfolioValue: entry.portfolioValue,
        pnlPercent: entry.pnlPercent,
        prizeWon: entry.prizeWon || 0,
      }));

      return { success: true, data: leaderboard };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

// WATCHLIST API
const watchlistApi = {
  // Get user watchlist
  async getWatchlist(
    walletAddress: string
  ): Promise<ApiResponse<{ items: Token[] }>> {
    try {
      const user = await getUserByWallet(walletAddress);
      if (!user) {
        return { success: true, data: { items: [] } };
      }

      const { data, error } = await supabase
        .from("watchlists")
        .select(
          `
          token:tokens(*)
        `
        )
        .eq("user_id", user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      const tokens: Token[] = (data || []).map((item: any) => ({
        id: item.token?.id || "",
        symbol: item.token?.symbol || "",
        name: item.token?.name || "",
        price: parseFloat(item.token?.price || "0"),
        change24h: parseFloat(item.token?.change_24h || "0"),
        marketCap: parseFloat(item.token?.market_cap || "0"),
        logoUrl: item.token?.logo_url || "",
        address: item.token?.address || "",
        decimals: item.token?.decimals || 8,
      }));

      return { success: true, data: { items: tokens } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Add token to watchlist
  async addToWatchlist(
    walletAddress: string,
    tokenId: string
  ): Promise<ApiResponse<void>> {
    try {
      const user = await createOrGetUser(walletAddress);

      const { error } = await supabase.from("watchlists").insert({
        user_id: user.id,
        token_id: tokenId,
      });

      if (error && error.code !== "23505") {
        // 23505 = unique constraint violation (already exists)
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Remove token from watchlist
  async removeFromWatchlist(
    walletAddress: string,
    tokenId: string
  ): Promise<ApiResponse<void>> {
    try {
      const user = await getUserByWallet(walletAddress);
      if (!user) {
        return { success: true };
      }

      const { error } = await supabase
        .from("watchlists")
        .delete()
        .eq("user_id", user.id)
        .eq("token_id", tokenId);

      return handleResponse(null, error);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Clear watchlist
  async clearWatchlist(walletAddress: string): Promise<ApiResponse<void>> {
    try {
      const user = await getUserByWallet(walletAddress);
      if (!user) {
        return { success: true };
      }

      const { error } = await supabase
        .from("watchlists")
        .delete()
        .eq("user_id", user.id);

      return handleResponse(null, error);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

// USER PORTFOLIO API
const portfolioApi = {
  // Get user portfolio
  async getUserPortfolio(
    walletAddress: string
  ): Promise<ApiResponse<Holding[]>> {
    try {
      const user = await getUserByWallet(walletAddress);
      if (!user) {
        return { success: true, data: [] };
      }

      const { data, error } = await supabase
        .from("user_portfolios")
        .select(
          `
          *,
          token:tokens(*)
        `
        )
        .eq("user_id", user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      const holdings: Holding[] = data.map((holding) => ({
        id: holding.token.id,
        symbol: holding.token.symbol,
        name: holding.token.name,
        price: parseFloat(holding.token.price),
        change24h: parseFloat(holding.token.change_24h),
        marketCap: parseFloat(holding.token.market_cap),
        logoUrl: holding.token.logo_url || "",
        address: holding.token.address,
        decimals: holding.token.decimals,
        quantity: parseFloat(holding.quantity),
        cost: parseFloat(holding.total_cost),
        value: parseFloat(holding.current_value),
      }));

      return { success: true, data: holdings };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Buy token (real trading)
  async buyToken(
    walletAddress: string,
    token: Token,
    quantity: number
  ): Promise<ApiResponse<void>> {
    try {
      const user = await createOrGetUser(walletAddress);
      const cost = token.price * quantity;

      // Check if user already has this token
      const { data: existingHolding } = await supabase
        .from("user_portfolios")
        .select("*")
        .eq("user_id", user.id)
        .eq("token_id", token.id)
        .single();

      if (existingHolding) {
        // Update existing holding
        const newQuantity = parseFloat(existingHolding.quantity) + quantity;
        const newCost = parseFloat(existingHolding.total_cost) + cost;
        const newAverageCost = newCost / newQuantity;

        const { error } = await supabase
          .from("user_portfolios")
          .update({
            quantity: newQuantity.toString(),
            total_cost: newCost.toString(),
            average_cost: newAverageCost.toString(),
            current_value: (newQuantity * token.price).toString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingHolding.id);

        if (error) {
          return { success: false, error: error.message };
        }
      } else {
        // Create new holding
        const { error } = await supabase.from("user_portfolios").insert({
          user_id: user.id,
          token_id: token.id,
          quantity: quantity.toString(),
          average_cost: token.price.toString(),
          total_cost: cost.toString(),
          current_value: cost.toString(),
        });

        if (error) {
          return { success: false, error: error.message };
        }
      }

      // Record transaction
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "trade_buy",
        amount: cost.toString(),
        token_symbol: token.symbol,
        status: "completed",
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Sell token (real trading)
  async sellToken(
    walletAddress: string,
    tokenId: string,
    quantity: number
  ): Promise<ApiResponse<void>> {
    try {
      const user = await getUserByWallet(walletAddress);
      if (!user) {
        return { success: false, error: "User not found" };
      }

      // Get existing holding
      const { data: holding, error: fetchError } = await supabase
        .from("user_portfolios")
        .select(
          `
          *,
          token:tokens(*)
        `
        )
        .eq("user_id", user.id)
        .eq("token_id", tokenId)
        .single();

      if (fetchError || !holding) {
        return { success: false, error: "Token not found in portfolio" };
      }

      const currentQuantity = parseFloat(holding.quantity);
      const sellQuantity = Math.min(quantity, currentQuantity);

      if (sellQuantity <= 0) {
        return { success: false, error: "Invalid sell quantity" };
      }

      const proceeds = sellQuantity * parseFloat(holding.token.price);
      const newQuantity = currentQuantity - sellQuantity;

      if (newQuantity === 0) {
        // Remove holding completely
        const { error } = await supabase
          .from("user_portfolios")
          .delete()
          .eq("id", holding.id);

        if (error) {
          return { success: false, error: error.message };
        }
      } else {
        // Update holding
        const newCost = newQuantity * parseFloat(holding.average_cost);

        const { error } = await supabase
          .from("user_portfolios")
          .update({
            quantity: newQuantity.toString(),
            total_cost: newCost.toString(),
            current_value: (
              newQuantity * parseFloat(holding.token.price)
            ).toString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", holding.id);

        if (error) {
          return { success: false, error: error.message };
        }
      }

      // Record transaction
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "trade_sell",
        amount: proceeds.toString(),
        token_symbol: holding.token.symbol,
        status: "completed",
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

// TOKEN CREATION API
export const tokenCreationApi = {
  // Create token request
  async createTokenRequest(requestData: {
    creatorWalletAddress: string;
    name: string;
    symbol: string;
    description?: string;
    imageUrl?: string;
    maxSupply?: number;
    targetSupply?: number;
    virtualLiquidity?: number;
    curveExponent?: number;
    mintLimitPerAddress?: number;
  }): Promise<ApiResponse<TokenCreationRequest>> {
    try {
      const user = await createOrGetUser(requestData.creatorWalletAddress);

      const { data, error } = await supabase
        .from('token_creation_requests')
        .insert({
          creator_id: user.id,
          name: requestData.name,
          symbol: requestData.symbol,
          description: requestData.description,
          image_url: requestData.imageUrl,
          max_supply: requestData.maxSupply?.toString(),
          target_supply: requestData.targetSupply?.toString(),
          virtual_liquidity: requestData.virtualLiquidity?.toString(),
          curve_exponent: requestData.curveExponent || 2,
          mint_limit_per_address: requestData.mintLimitPerAddress?.toString(),
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Create actual token in tokens table after blockchain creation
  async createToken(tokenData: {
    symbol: string;
    name: string;
    description?: string;
    logoUrl?: string;
    address: string;
    decimals: number;
    maxSupply?: number;
    creatorWalletAddress: string;
  }): Promise<ApiResponse<Token>> {
    try {
      const user = await createOrGetUser(tokenData.creatorWalletAddress);

      const { data, error } = await supabase
        .from('tokens')
        .insert({
          symbol: tokenData.symbol,
          name: tokenData.name,
          description: tokenData.description,
          logo_url: tokenData.logoUrl,
          address: tokenData.address,
          decimals: tokenData.decimals,
          max_supply: tokenData.maxSupply?.toString(),
          creator_id: user.id,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Get user's token creation requests
  async getUserTokenRequests(walletAddress: string): Promise<ApiResponse<TokenCreationRequest[]>> {
    try {
      const user = await getUserByWallet(walletAddress);
      if (!user) {
        return { success: true, data: [] };
      }

      const { data, error } = await supabase
        .from('token_creation_requests')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

// USER BALANCE API
const balanceApi = {
  // Get user balance
  async getUserBalance(walletAddress: string): Promise<ApiResponse<number>> {
    try {
      const user = await getUserByWallet(walletAddress);
      if (!user) {
        return { success: true, data: 0 };
      }

      return { success: true, data: user.balance };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Deposit funds
  async depositFunds(
    walletAddress: string,
    amount: number
  ): Promise<ApiResponse<void>> {
    try {
      const user = await createOrGetUser(walletAddress);

      const { error } = await supabase
        .from("users")
        .update({
          balance: (user.balance + amount).toString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Record transaction
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "deposit",
        amount: amount.toString(),
        status: "completed",
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Withdraw funds
  async withdrawFunds(
    walletAddress: string,
    amount: number
  ): Promise<ApiResponse<void>> {
    try {
      const user = await getUserByWallet(walletAddress);
      if (!user) {
        return { success: false, error: "User not found" };
      }

      const { error } = await supabase
        .from("users")
        .update({
          balance: (user.balance - amount).toString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Record transaction
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "withdrawal",
        amount: amount.toString(),
        status: "completed",
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Get user transactions
  async getUserTransactions(
    walletAddress: string
  ): Promise<ApiResponse<Transaction[]>> {
    try {
      const user = await getUserByWallet(walletAddress);
      if (!user) {
        return { success: true, data: [] };
      }

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

// Users API
const userApi = {
  async getUserById(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getUserWalletAddress(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('id', userId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data.wallet_address };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

// Export all APIs
export const supabaseApi = {
  tokens: tokenApi,
  quests: questApi,
  watchlist: watchlistApi,
  portfolio: portfolioApi,
  tokenCreation: tokenCreationApi,
  balance: balanceApi,
  users: userApi,
};

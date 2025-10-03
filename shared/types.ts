export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface Token {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  logoUrl: string;
  address?: string; // Optional token contract address
  decimals?: number; // Optional token decimals
}
export interface Quest {
  id: string;
  name: string;
  entryFee: number;
  prizePool: number;
  duration: string;
  participants: number;
  status: "upcoming" | "active" | "ended";
  startTime?: string; // ISO string
  endTime?: string; // ISO string
  creatorId?: string; // Quest creator's user ID
  creatorWalletAddress?: string; // Quest creator's wallet address (fetched from users table)
  blockchainQuestId?: number; // Numeric quest ID from blockchain (for blockchain operations)
}
export interface LeaderboardEntry {
  rank: number;
  address: string;
  portfolioValue: number;
  pnlPercent: number;
}
export interface Holding extends Token {
  quantity: number;
  cost: number; // total cost for this holding
  value: number; // current total value for this holding
}
export interface QuestPortfolio {
  id: string; // Composite key like `questId:userId`
  questId: string;
  userId: string;
  joinedAt: number;
  holdings: Holding[];
}

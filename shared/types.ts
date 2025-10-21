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
  address?: string; // Token contract address (FA metadata object address)
  decimals?: number; // Token decimals
  description?: string; // Token description
  creatorId?: string; // Creator user ID

  // V2 Bonding Curve Fields
  reserveRatio?: number; // Bancor reserve ratio (1-100%)
  reserveBalance?: number; // Current APT in bonding curve reserve
  initialReserveApt?: number; // Initial APT used to bootstrap curve
  bondingCurveActive?: boolean; // Whether bonding curve is still active

  // V2 Migration Fields
  migrationCompleted?: boolean; // Whether token has migrated to DEX
  migrationTimestamp?: string; // When migration occurred
  hyperionPoolAddress?: string; // Hyperion DEX pool address after migration
  marketCapThresholdUsd?: number; // Market cap threshold for migration (USD)

  // V2 Trading Status
  tradingEnabled?: boolean; // Whether trading is enabled

  // V2 Social Links
  socialLinks?: {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
  };

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}
export interface Quest {
  id: string;
  name: string;
  entryFee: number;
  prizePool: number;
  duration: string; // Formatted duration string (e.g., "2 Hours", "3 Days") - for display
  durationMinutes?: number; // Duration in minutes (for calculations)
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
  prizeWon?: number; // Prize amount won by this participant
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

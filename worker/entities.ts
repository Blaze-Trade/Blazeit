import { MOCK_QUESTS, MOCK_TOKENS } from "@shared/mock-data";
import type { Quest, QuestPortfolio, Token } from "@shared/types";
import { IndexedEntity } from "./core-utils";
// TOKEN ENTITY: Represents a token available for trading.
export class TokenEntity extends IndexedEntity<Token> {
  static readonly entityName = "token";
  static readonly indexName = "tokens";
  static readonly initialState: Token = {
    id: "",
    symbol: "",
    name: "",
    price: 0,
    change24h: 0,
    marketCap: 0,
    logoUrl: "",
  };
  static seedData = MOCK_TOKENS;
}
// QUEST ENTITY: Represents a competitive quest.
export class QuestEntity extends IndexedEntity<Quest> {
  static readonly entityName = "quest";
  static readonly indexName = "quests";
  static readonly initialState: Quest = {
    id: "",
    name: "",
    entryFee: 0,
    prizePool: 0,
    duration: "",
    participants: 0,
    status: "upcoming",
    startTime: undefined,
    endTime: undefined,
  };
  static seedData = MOCK_QUESTS;
}
// QUEST PORTFOLIO ENTITY: Stores a user's holdings for a single quest.
export class QuestPortfolioEntity extends IndexedEntity<QuestPortfolio> {
  static readonly entityName = "questportfolio";
  static readonly indexName = "questportfolios";
  static readonly initialState: QuestPortfolio = {
    id: "",
    questId: "",
    userId: "",
    joinedAt: 0,
    holdings: [],
  };

  static keyOf<U extends { id: string }>(state: U): string {
    return state.id;
  }
  async buyToken(token: Token, quantity: number): Promise<QuestPortfolio> {
    return this.mutate((portfolio) => {
      const existingHolding = portfolio.holdings.find((h) => h.id === token.id);
      const cost = token.price * quantity;
      if (existingHolding) {
        existingHolding.quantity += quantity;
        existingHolding.cost += cost;
        existingHolding.value = existingHolding.quantity * token.price;
      } else {
        portfolio.holdings.push({ ...token, quantity, cost, value: cost });
      }
      return portfolio;
    });
  }
  async sellToken(tokenId: string, quantity: number): Promise<QuestPortfolio> {
    return this.mutate((portfolio) => {
      const holdingIndex = portfolio.holdings.findIndex(
        (h) => h.id === tokenId
      );
      if (holdingIndex === -1) {
        throw new Error("Token not found in portfolio");
      }
      const holding = portfolio.holdings[holdingIndex];
      const sellQuantity = Math.min(quantity, holding.quantity);
      if (sellQuantity <= 0) {
        throw new Error("Invalid sell quantity");
      }
      const averageCost = holding.cost / holding.quantity;
      holding.quantity -= sellQuantity;
      holding.cost -= sellQuantity * averageCost;
      holding.value = holding.quantity * holding.price;
      if (holding.quantity === 0) {
        portfolio.holdings.splice(holdingIndex, 1);
      }
      return portfolio;
    });
  }
}

// WATCHLIST ENTITY: Stores a user's watchlisted tokens.
export class WatchlistEntity extends IndexedEntity<{
  id: string;
  userId: string;
  tokenIds: string[];
  createdAt: number;
  updatedAt: number;
}> {
  static readonly entityName = "watchlist";
  static readonly indexName = "watchlists";
  static readonly initialState = {
    id: "",
    userId: "",
    tokenIds: [],
    createdAt: 0,
    updatedAt: 0,
  };

  async addToken(tokenId: string): Promise<void> {
    await this.mutate((watchlist) => {
      if (!watchlist.tokenIds.includes(tokenId)) {
        watchlist.tokenIds.push(tokenId);
        watchlist.updatedAt = Date.now();
      }
      return watchlist;
    });
  }

  async removeToken(tokenId: string): Promise<void> {
    await this.mutate((watchlist) => {
      watchlist.tokenIds = watchlist.tokenIds.filter((id) => id !== tokenId);
      watchlist.updatedAt = Date.now();
      return watchlist;
    });
  }

  async clearAll(): Promise<void> {
    await this.mutate((watchlist) => {
      watchlist.tokenIds = [];
      watchlist.updatedAt = Date.now();
      return watchlist;
    });
  }
}

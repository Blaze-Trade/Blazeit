import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Token, Quest, Holding } from '@shared/types';
interface PortfolioState {
  isConnected: boolean;
  address: string | null;
  holdings: Holding[];
  watchlist: Token[];
  activeQuest: Quest | null;
  joinedQuests: string[]; // array of quest IDs
}
interface PortfolioActions {
  setConnected: (address: string) => void;
  setDisconnected: () => void;
  buyToken: (token: Token, quantity: number) => void;
  sellToken: (tokenId: string, quantity: number) => void;
  addToWatchlist: (token: Token) => void;
  removeFromWatchlist: (tokenId: string) => void;
  joinQuest: (quest: Quest) => void;
  setActiveQuest: (quest: Quest | null) => void;
  exitQuestMode: () => void;
}
export const usePortfolioStore = create<PortfolioState & PortfolioActions>()(
  immer((set) => ({
    isConnected: false,
    address: null,
    holdings: [],
    watchlist: [],
    activeQuest: null,
    joinedQuests: [],
    setConnected: (address) => {
      set((state) => {
        state.isConnected = true;
        state.address = address;
      });
    },
    setDisconnected: () => {
      set((state) => {
        state.isConnected = false;
        state.address = null;
        state.activeQuest = null;
        state.joinedQuests = [];
      });
    },
    buyToken: (token, quantity) => {
      set((state) => {
        const existingHolding = state.holdings.find((h) => h.id === token.id);
        const cost = token.price * quantity;
        if (existingHolding) {
          existingHolding.quantity += quantity;
          existingHolding.cost += cost;
          existingHolding.value = existingHolding.quantity * token.price;
        } else {
          state.holdings.push({ ...token, quantity, cost, value: cost });
        }
      });
    },
    sellToken: (tokenId, quantity) => {
      set((state) => {
        const holdingIndex = state.holdings.findIndex((h) => h.id === tokenId);
        if (holdingIndex > -1) {
          const holding = state.holdings[holdingIndex];
          const sellQuantity = Math.min(quantity, holding.quantity);
          const averageCost = holding.cost / holding.quantity;
          holding.quantity -= sellQuantity;
          holding.cost -= sellQuantity * averageCost;
          holding.value = holding.quantity * holding.price;
          if (holding.quantity <= 0) {
            state.holdings.splice(holdingIndex, 1);
          }
        }
      });
    },
    addToWatchlist: (token) => {
      set((state) => {
        if (!state.watchlist.some((t) => t.id === token.id)) {
          state.watchlist.push(token);
        }
      });
    },
    removeFromWatchlist: (tokenId) => {
      set((state) => {
        state.watchlist = state.watchlist.filter((t) => t.id !== tokenId);
      });
    },
    joinQuest: (quest) => {
        set((state) => {
            if (!state.joinedQuests.includes(quest.id)) {
                state.joinedQuests.push(quest.id);
            }
            state.activeQuest = quest;
        });
    },
    setActiveQuest: (quest) => {
        set({ activeQuest: quest });
    },
    exitQuestMode: () => {
        set({ activeQuest: null });
    }
  }))
);
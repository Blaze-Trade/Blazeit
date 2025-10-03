import type { Holding, Quest, Token } from '@shared/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface PortfolioState {
  isConnected: boolean;
  address: string | null;
  holdings: Holding[];
  watchlist: Token[];
  activeQuest: Quest | null;
  joinedQuestsByWallet: Record<string, string[]>; // Map of wallet address -> quest IDs
  // UI state persistence
  sidebarOpen: boolean;
  theme: "light" | "dark";
  lastConnectedWallet: string | null;

  // Computed property for current wallet's joined quests
  get joinedQuests(): string[];
}

interface PortfolioActions {
  setConnected: (address: string, walletName?: string) => void;
  setDisconnected: () => void;
  buyToken: (token: Token, quantity: number) => void;
  sellToken: (tokenId: string, quantity: number) => void;
  addToWatchlist: (token: Token) => void;
  removeFromWatchlist: (tokenId: string) => void;
  joinQuest: (quest: Quest) => void;
  setActiveQuest: (quest: Quest | null) => void;
  exitQuestMode: () => void;
  // UI actions
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  // Wallet reconnection
  attemptReconnection: () => Promise<boolean>;
}

export const usePortfolioStore = create<PortfolioState & PortfolioActions>()(
  persist(
    immer((set, get) => ({
      isConnected: false,
      address: null,
      holdings: [],
      watchlist: [],
      activeQuest: null,
      joinedQuestsByWallet: {},
      sidebarOpen: false,
      theme: "light",
      lastConnectedWallet: null,

      // Getter for current wallet's joined quests
      get joinedQuests() {
        const state = get();
        if (!state.address) return [];
        return state.joinedQuestsByWallet[state.address] || [];
      },

      setConnected: (address, walletName) => {
        set((state) => {
          state.isConnected = true;
          state.address = address;
          if (walletName) {
            state.lastConnectedWallet = walletName;
          }
        });
      },

      setDisconnected: () => {
        set((state) => {
          state.isConnected = false;
          state.address = null;
          state.activeQuest = null;
          // joinedQuestsByWallet is persisted per-wallet, so no need to clear
          // watchlist is shared across all wallets
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
          const holdingIndex = state.holdings.findIndex(
            (h) => h.id === tokenId
          );
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
          if (!state.address) return;

          // Initialize array for this wallet if it doesn't exist
          if (!state.joinedQuestsByWallet[state.address]) {
            state.joinedQuestsByWallet[state.address] = [];
          }

          // Add quest ID if not already present
          if (!state.joinedQuestsByWallet[state.address].includes(quest.id)) {
            state.joinedQuestsByWallet[state.address].push(quest.id);
          }

          state.activeQuest = quest;
        });
      },

      setActiveQuest: (quest) => {
        set({ activeQuest: quest });
      },

      exitQuestMode: () => {
        set({ activeQuest: null });
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      setTheme: (theme) => {
        set({ theme });
      },

      attemptReconnection: async () => {
        const state = get();
        if (state.lastConnectedWallet && !state.isConnected) {
          try {
            // This will be called from the wallet connector component
            // to attempt automatic reconnection
            return true;
          } catch (error) {
            console.error("Failed to reconnect wallet:", error);
            return false;
          }
        }
        return false;
      },
    })),
    {
      name: "blaze-it-portfolio-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist user data and preferences
        holdings: state.holdings,
        watchlist: state.watchlist,
        joinedQuestsByWallet: state.joinedQuestsByWallet, // Per-wallet quest tracking
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
        lastConnectedWallet: state.lastConnectedWallet,
        // Don't persist connection state - this should be re-established
        // isConnected: state.isConnected,
        // address: state.address,
        // activeQuest: state.activeQuest,
      }),
    }
  )
);

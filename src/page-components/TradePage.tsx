"use client";

import { TokenCard } from "@/components/trade/TokenCard";
import { TokenInfoModal } from "@/components/trade/TokenInfoModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Toaster, toast } from "@/components/ui/sonner";
import { useAptos } from "@/hooks/useAptos";
import { useBlockchainTokens } from "@/hooks/useBlockchainTokens";
import { useLaunchpadV2 } from "@/hooks/useLaunchpadV2";
import { useSupabaseTokens } from "@/hooks/useSupabaseTokens";
import { useSupabaseWatchlist } from "@/hooks/useSupabaseWatchlist";
import { buildSwapAptForTokenPayload } from "@/lib/hyperion-dex";
import { usePortfolioStore } from "@/stores/portfolioStore";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
// Removed MOCK_TOKENS import - no longer using fallback mock data
import type { Token } from "@shared/types";
import { ArrowUp, Heart, Info, Loader2, Swords, Wallet, X } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import TinderCard from "react-tinder-card";

type SwipeDirection = "left" | "right" | "up" | "down";
export function TradePage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [initialTokens, setInitialTokens] = useState<Token[]>([]);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [pendingBuyToken, setPendingBuyToken] = useState<Token | null>(null);
  const [infoToken, setInfoToken] = useState<Token | null>(null);
  const [buyQuantity, setBuyQuantity] = useState<number>(0.1);
  const [slippageTolerance, setSlippageTolerance] = useState<number>(1); // 1% default
  const [deadline, setDeadline] = useState<number>(5); // 5 minutes default

  const {
    isConnected,
    address,
    buyToken: buyTokenStore,
    addToWatchlist,
    activeQuest,
    exitQuestMode,
  } = usePortfolioStore();

  // Get wallet functions
  const { signAndSubmitTransaction } = useWallet();

  // V2 Launchpad integration
  const launchpadV2 = useLaunchpadV2();

  // Use blockchain tokens as primary source, Supabase as fallback
  const {
    tokens: blockchainTokens,
    loading: blockchainLoading,
    error: blockchainError,
  } = useBlockchainTokens();
  const {
    tokens: supabaseTokens,
    loading: supabaseLoading,
    error: supabaseError,
  } = useSupabaseTokens();
  const { addToWatchlist: addToWatchlistSupabase } =
    useSupabaseWatchlist(address);
  const { simulateTransaction } = useAptos();
  const isInQuestMode = activeQuest !== null;

  // Update tokens when either source is loaded
  useEffect(() => {
    console.log("🔄 TradePage useEffect triggered:", {
      blockchainTokens: blockchainTokens.length,
      supabaseTokens: supabaseTokens.length,
      blockchainLoading,
      supabaseLoading,
      blockchainTokensData: blockchainTokens,
      supabaseTokensData: supabaseTokens,
    });

    let tokensToUse: Token[] = [];

    if (blockchainTokens.length > 0) {
      tokensToUse = blockchainTokens;
      console.log("✅ Using blockchain tokens:", tokensToUse.length);
    } else if (supabaseTokens.length > 0) {
      tokensToUse = supabaseTokens;
      console.log("✅ Using Supabase tokens:", tokensToUse.length);
    } else {
      console.log("❌ No tokens from any source");
    }
    // No fallback to mock tokens - show empty state instead

    if (tokensToUse.length > 0) {
      // Shuffle tokens for variety
      const shuffledTokens = [...tokensToUse].sort(() => Math.random() - 0.5);
      console.log("🎲 Setting shuffled tokens:", shuffledTokens.length);
      setTokens(shuffledTokens);
      setInitialTokens(shuffledTokens);
    } else {
      // Clear tokens if none available
      console.log("🧹 Clearing tokens - showing empty state");
      setTokens([]);
      setInitialTokens([]);
    }
  }, [blockchainTokens, supabaseTokens, blockchainLoading, supabaseLoading]);
  const childRefs = useMemo(
    () =>
      Array(initialTokens.length)
        .fill(0)
        .map(() => React.createRef<any>()),
    [initialTokens]
  );
  const restoreCard = (tokenId: string) => {
    const index = initialTokens.findIndex((t) => t.id === tokenId);
    if (childRefs[index] && childRefs[index].current) {
      childRefs[index].current.restoreCard();
    }
  };
  const swiped = async (direction: SwipeDirection, token: Token) => {
    // Down swipe shows info modal (no wallet required)
    if (direction === "down") {
      setInfoToken(token);
      setShowInfoModal(true);
      restoreCard(token.id);
      return;
    }

    if (!isConnected || !address) {
      toast.error("Please connect your wallet to trade.");
      restoreCard(token.id);
      return;
    }

    if (direction === "right") {
      // Open quantity selector dialog for buying
      setPendingBuyToken(token);
      setBuyQuantity(1);
      setShowBuyDialog(true);
    } else if (direction === "up") {
      // Add to local store
      addToWatchlist(token);

      // Also add to Supabase if connected
      if (address) {
        try {
          const result = await addToWatchlistSupabase(token);
          if (result.success) {
            toast.success(`Added ${token.symbol} to watchlist`);
          } else {
            console.error("Failed to add to watchlist:", result.error);
            toast.error("Failed to add to watchlist");
          }
        } catch (error) {
          console.error("Failed to add to watchlist:", error);
          toast.error("Failed to add to watchlist");
        }
      } else {
        toast.info(`${token.symbol} added to watchlist`);
      }
    }
  };
  const outOfFrame = (name: string) => {
    setTokens((prevTokens) => prevTokens.filter((t) => t.name !== name));
  };
  const swipe = async (dir: SwipeDirection) => {
    const cardsLeft = tokens;
    if (cardsLeft.length > 0) {
      const toBeRemoved = cardsLeft[cardsLeft.length - 1];
      const index = initialTokens.findIndex((t) => t.id === toBeRemoved.id);
      if (childRefs[index] && childRefs[index].current) {
        await childRefs[index].current.swipe(dir);
      }
    }
  };
  const renderContent = () => {
    if (blockchainLoading || supabaseLoading) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-blaze-white border-2 border-blaze-black p-6 text-center">
          <Loader2 className="w-16 h-16 animate-spin" />
          <p className="font-mono text-lg mt-4">
            Loading Tokens from Blockchain...
          </p>
        </div>
      );
    }
    if (blockchainError || supabaseError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-blaze-white border-2 border-blaze-black p-6 text-center">
          <h2 className="font-display text-4xl font-bold text-red-600">
            BLOCKCHAIN ERROR
          </h2>
          <p className="font-mono text-lg mt-2">
            Failed to fetch tokens from blockchain
          </p>
          <p className="font-mono text-sm mt-2 text-gray-600">
            {blockchainError || supabaseError}
          </p>
        </div>
      );
    }
    if (!isConnected) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-blaze-white border-2 border-blaze-black p-6 text-center">
          <Wallet className="w-24 h-24" />
          <h2 className="font-display text-4xl font-bold mt-4">
            CONNECT WALLET
          </h2>
          <p className="font-mono text-lg mt-2">
            Please connect your wallet to start trading.
          </p>
        </div>
      );
    }
    if (tokens.length === 0) {
      // Determine the appropriate message based on loading state
      const isStillLoading = blockchainLoading || supabaseLoading;
      const hasNoTokens =
        !isStillLoading &&
        blockchainTokens.length === 0 &&
        supabaseTokens.length === 0;

      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-blaze-white border-2 border-blaze-black p-6 text-center">
          {isStillLoading ? (
            <>
              <Loader2 className="w-16 h-16 animate-spin text-blaze-orange" />
              <h2 className="font-display text-4xl font-bold mt-4">LOADING</h2>
              <p className="font-mono text-lg mt-2">
                Fetching tokens from blockchain...
              </p>
            </>
          ) : hasNoTokens ? (
            <>
              <Swords className="w-24 h-24 text-blaze-black/30" />
              <h2 className="font-display text-4xl font-bold mt-4">
                NO TOKENS FOUND
              </h2>
              <p className="font-mono text-lg mt-2 text-blaze-black/70">
                No tokens have been created yet.
              </p>
              <p className="font-mono text-sm mt-4 text-blaze-black/60">
                Be the first to launch a token!
              </p>
              <Link
                href="/create-token"
                className="mt-6 px-6 py-3 bg-blaze-orange border-2 border-blaze-black font-mono font-bold hover:bg-blaze-orange/80 transition-colors"
              >
                CREATE TOKEN
              </Link>
            </>
          ) : (
            <>
              <h2 className="font-display text-4xl font-bold">ALL SWIPED</h2>
              <p className="font-mono text-lg mt-2">
                You've swiped through all available tokens.
              </p>
              <p className="font-mono text-sm mt-4 text-blaze-black/60">
                Check back later for more!
              </p>
            </>
          )}
        </div>
      );
    }
    return initialTokens.map((token, index) => {
      if (!tokens.find((t) => t.id === token.id)) return null;
      return (
        <TinderCard
          ref={childRefs[index]}
          className="absolute w-full h-full"
          key={token.id}
          onSwipe={(dir) => swiped(dir as SwipeDirection, token)}
          onCardLeftScreen={() => outOfFrame(token.name)}
          preventSwipe={[]}
        >
          <TokenCard token={token} />
        </TinderCard>
      );
    });
  };
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative p-4">
      <Toaster richColors closeButton />

      {/* Token Info Modal */}
      <TokenInfoModal
        token={infoToken}
        open={showInfoModal}
        onOpenChange={setShowInfoModal}
      />

      {/* Buy Dialog */}
      <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
        <DialogContent className="rounded-none border-2 border-blaze-black bg-blaze-white">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl">
              Buy {pendingBuyToken?.symbol}
            </DialogTitle>
            {pendingBuyToken?.migrationCompleted && (
              <p className="font-mono text-xs text-green-600">
                Trading on Hyperion DEX
              </p>
            )}
            {!pendingBuyToken?.migrationCompleted && (
              <p className="font-mono text-xs text-blaze-orange">
                Trading on Bonding Curve
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4">
            {/* Quantity */}
            <div className="space-y-2">
              <p className="font-mono text-sm text-blaze-black/70">Quantity</p>
              <div className="px-1">
                <Slider
                  value={[buyQuantity]}
                  min={1}
                  max={100}
                  step={0.1}
                  onValueChange={(v) => setBuyQuantity(Number(v[0]))}
                />
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={buyQuantity}
                  onChange={(e) =>
                    setBuyQuantity(
                      Math.min(
                        100,
                        Math.max(0.1, parseFloat(e.target.value) || 0.1)
                      )
                    )
                  }
                  className="rounded-none border-2 border-blaze-black w-32"
                />
                {pendingBuyToken && (
                  <span className="font-mono text-sm text-blaze-black/70">
                    ≈ ${(buyQuantity * pendingBuyToken.price).toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Slippage Tolerance */}
            <div className="space-y-2">
              <p className="font-mono text-sm text-blaze-black/70">
                Slippage Tolerance
              </p>
              <div className="flex gap-2">
                {[0.1, 0.5, 1, 5].map((pct) => (
                  <Button
                    key={pct}
                    type="button"
                    variant={slippageTolerance === pct ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSlippageTolerance(pct)}
                    className={`rounded-none border-2 border-blaze-black ${
                      slippageTolerance === pct
                        ? "bg-blaze-orange text-blaze-black"
                        : "bg-blaze-white text-blaze-black"
                    }`}
                  >
                    {pct}%
                  </Button>
                ))}
              </div>
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <p className="font-mono text-sm text-blaze-black/70">Deadline</p>
              <div className="flex gap-2">
                {[1, 5, 10, 30].map((min) => (
                  <Button
                    key={min}
                    type="button"
                    variant={deadline === min ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDeadline(min)}
                    className={`rounded-none border-2 border-blaze-black ${
                      deadline === min
                        ? "bg-blaze-orange text-blaze-black"
                        : "bg-blaze-white text-blaze-black"
                    }`}
                  >
                    {min}min
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-none border-2 border-blaze-black"
              onClick={() => {
                setShowBuyDialog(false);
                if (pendingBuyToken) restoreCard(pendingBuyToken.id);
              }}
            >
              Cancel
            </Button>
            <Button
              className="rounded-none border-2 border-blaze-black bg-blaze-orange text-blaze-black"
              onClick={async () => {
                if (!pendingBuyToken) return;
                const token = pendingBuyToken;
                const quantity = buyQuantity;
                setShowBuyDialog(false);

                // Validate token address exists
                if (!token.address) {
                  toast.error(
                    `Token ${token.symbol} does not have a contract address`,
                    {
                      description:
                        "This token hasn't been deployed on the blockchain yet.",
                    }
                  );
                  restoreCard(token.id);
                  setPendingBuyToken(null);
                  return;
                }

                // Validate token decimals exists
                if (token.decimals === undefined || token.decimals === null) {
                  toast.error(
                    `Token ${token.symbol} is missing decimal information`,
                    {
                      description:
                        "Cannot calculate correct amount without decimals.",
                    }
                  );
                  restoreCard(token.id);
                  setPendingBuyToken(null);
                  return;
                }

                try {
                  if (isInQuestMode && activeQuest) {
                    // Quest mode - use simulated trading
                    await simulateTransaction(
                      `Buying ${quantity} ${token.symbol}`
                    );
                    await fetch(`/api/quests/${activeQuest.id}/buy`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        userId: address,
                        token,
                        quantity,
                      }),
                    });
                    toast.success(
                      `Added ${quantity} ${token.symbol} to Quest Portfolio`
                    );
                  } else {
                    // Determine buy flow based on migration status
                    if (token.migrationCompleted && token.hyperionPoolAddress) {
                      // Token migrated to Hyperion DEX - use Hyperion swap
                      const aptAmount = quantity * token.price; // Estimate APT needed

                      // Validate APT amount - only block if token has no reserve balance
                      if (
                        aptAmount <= 0 &&
                        (!token.reserveBalance || token.reserveBalance <= 0)
                      ) {
                        toast.error(
                          `Cannot buy ${token.symbol} - token has no liquidity`,
                          {
                            description:
                              "This token has no reserve balance. Please try a different token.",
                          }
                        );
                        restoreCard(token.id);
                        setPendingBuyToken(null);
                        return;
                      }

                      // For tokens with $0 price but valid reserve, calculate proper APT amount
                      let finalAptAmount = aptAmount;
                      if (
                        aptAmount <= 0 &&
                        token.reserveBalance &&
                        token.reserveBalance > 0
                      ) {
                        // For bonding curve tokens with $0 price, calculate APT needed
                        // Use a more practical formula: quantity * 0.01 APT per token
                        // This ensures reasonable token amounts for small purchases
                        finalAptAmount = Math.max(0.001, quantity * 0.01);
                      }

                      // Calculate realistic minTokensOut based on actual APT amount
                      // For tokens with $0 price, estimate tokens based on APT amount
                      let estimatedTokens = quantity;
                      if (
                        aptAmount <= 0 &&
                        token.reserveBalance &&
                        token.reserveBalance > 0
                      ) {
                        // Estimate tokens based on APT amount and reserve balance
                        // Simple estimation: APT amount * 1000 (adjust this multiplier as needed)
                        estimatedTokens = finalAptAmount * 1000;
                      }

                      const minTokensOut = Math.floor(
                        estimatedTokens *
                          Math.pow(10, token.decimals || 8) *
                          (1 - slippageTolerance / 100)
                      );

                      const payload = buildSwapAptForTokenPayload(
                        token.hyperionPoolAddress,
                        finalAptAmount,
                        minTokensOut,
                        deadline
                      );

                      const toastId = toast.loading(
                        `Buying ${quantity} ${token.symbol} from Hyperion DEX...`,
                        {
                          description:
                            "Please approve the transaction in your wallet.",
                        }
                      );

                      const result = await signAndSubmitTransaction({
                        data: payload,
                      });

                      if (result && result.hash) {
                        toast.success(
                          `Successfully bought ${quantity} ${token.symbol}!`,
                          {
                            id: toastId,
                            description: `Transaction: ${result.hash.slice(
                              0,
                              10
                            )}...`,
                          }
                        );
                        buyTokenStore(token, quantity);
                      }
                    } else {
                      // Token on bonding curve - use V2 buy function
                      const aptAmount = quantity * token.price; // Estimate APT needed

                      // Validate APT amount - only block if token has no reserve balance
                      if (
                        aptAmount <= 0 &&
                        (!token.reserveBalance || token.reserveBalance <= 0)
                      ) {
                        toast.error(
                          `Cannot buy ${token.symbol} - token has no liquidity`,
                          {
                            description:
                              "This token has no reserve balance. Please try a different token.",
                          }
                        );
                        restoreCard(token.id);
                        setPendingBuyToken(null);
                        return;
                      }

                      // For tokens with $0 price but valid reserve, calculate proper APT amount
                      let finalAptAmount = aptAmount;
                      if (
                        aptAmount <= 0 &&
                        token.reserveBalance &&
                        token.reserveBalance > 0
                      ) {
                        // For bonding curve tokens with $0 price, calculate APT needed
                        // Use a more practical formula: quantity * 0.01 APT per token
                        // This ensures reasonable token amounts for small purchases
                        finalAptAmount = Math.max(0.001, quantity * 0.01);
                      }

                      // Calculate realistic minTokensOut based on actual APT amount
                      // For tokens with $0 price, estimate tokens based on APT amount
                      let estimatedTokens = quantity;
                      if (
                        aptAmount <= 0 &&
                        token.reserveBalance &&
                        token.reserveBalance > 0
                      ) {
                        // Estimate tokens based on APT amount and reserve balance
                        // Simple estimation: APT amount * 1000 (adjust this multiplier as needed)
                        estimatedTokens = finalAptAmount * 1000;
                      }

                      const minTokensOut = Math.floor(
                        estimatedTokens *
                          Math.pow(10, token.decimals || 8) *
                          (1 - slippageTolerance / 100)
                      );

                      const toastId = toast.loading(
                        `Buying ${quantity} ${token.symbol} from bonding curve...`,
                        {
                          description:
                            "Please approve the transaction in your wallet.",
                        }
                      );

                      const result = await launchpadV2.buy(
                        token.address,
                        finalAptAmount,
                        minTokensOut,
                        deadline
                      );

                      if (result.success) {
                        toast.success(
                          `Successfully bought ${quantity} ${token.symbol}!`,
                          {
                            id: toastId,
                            description: result.hash
                              ? `Transaction: ${result.hash.slice(0, 10)}...`
                              : undefined,
                          }
                        );
                        buyTokenStore(token, quantity);
                      } else {
                        toast.error(`Failed to buy ${token.symbol}`, {
                          id: toastId,
                        });
                        restoreCard(token.id);
                      }
                    }
                  }
                } catch (error: any) {
                  const isUserRejection =
                    error?.message?.includes("User rejected") ||
                    error?.message?.includes("rejected");

                  console.error("❌ Token purchase failed:", error);

                  if (isUserRejection) {
                    toast.error("Transaction rejected", {
                      description: "You cancelled the transaction.",
                    });
                  } else {
                    toast.error(`Failed to buy ${token.symbol}`, {
                      description: error?.message || "Please try again.",
                    });
                  }

                  restoreCard(token.id);
                } finally {
                  setPendingBuyToken(null);
                }
              }}
            >
              Confirm Buy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {isInQuestMode && activeQuest && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-blaze-orange border-b-2 border-blaze-black p-2 text-center font-mono font-bold z-10 flex items-center justify-between">
          <Link
            href={`/quests/${activeQuest.id}`}
            className="flex items-center justify-center gap-2 text-blaze-black flex-grow"
          >
            <Swords className="w-5 h-5" />
            QUEST MODE: {activeQuest.name}
          </Link>
          <Button
            onClick={exitQuestMode}
            variant="ghost"
            size="sm"
            className="text-blaze-black hover:bg-blaze-black/10 rounded-none"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}
      <div className="w-full max-w-md h-[60vh] max-h-[600px] relative mt-8 shadow-blaze-shadow">
        {renderContent()}
      </div>
      <div className="flex flex-col items-center justify-center gap-4 mt-8">
        {/* Main action buttons */}
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={() => swipe("left")}
            disabled={
              tokens.length === 0 ||
              blockchainLoading ||
              supabaseLoading ||
              !isConnected
            }
            className="h-20 w-20 rounded-full border-2 border-blaze-black bg-blaze-white text-blaze-black hover:bg-blaze-black/10 active:bg-blaze-black/20 disabled:opacity-50"
          >
            <X className="w-12 h-12" />
          </Button>
          <Button
            onClick={() => {
              // Show info for current token
              const currentToken = tokens[tokens.length - 1];
              if (currentToken) {
                setInfoToken(currentToken);
                setShowInfoModal(true);
              }
            }}
            disabled={
              tokens.length === 0 || blockchainLoading || supabaseLoading
            }
            className="h-20 w-20 rounded-full border-2 border-blaze-black bg-blaze-white text-blaze-black hover:bg-blaze-black/10 active:bg-blaze-black/20 disabled:opacity-50"
          >
            <Info className="w-12 h-12" />
          </Button>
          <Button
            onClick={() => swipe("up")}
            disabled={
              tokens.length === 0 ||
              blockchainLoading ||
              supabaseLoading ||
              !isConnected
            }
            className="h-20 w-20 rounded-full border-2 border-blaze-black bg-blaze-white text-blaze-black hover:bg-blaze-black/10 active:bg-blaze-black/20 disabled:opacity-50"
          >
            <ArrowUp className="w-12 h-12" />
          </Button>
          <Button
            onClick={() => swipe("right")}
            disabled={
              tokens.length === 0 ||
              blockchainLoading ||
              supabaseLoading ||
              !isConnected
            }
            className="h-20 w-20 rounded-full border-2 border-blaze-orange bg-blaze-orange text-blaze-black hover:bg-blaze-orange/80 active:bg-blaze-orange/90 disabled:opacity-50"
          >
            <Heart className="w-12 h-12" />
          </Button>
        </div>

        {/* Button labels */}
        <div className="flex items-center justify-center gap-4 w-full max-w-md">
          <p className="flex-1 text-center font-mono text-xs text-blaze-black/70">
            SKIP
          </p>
          <p className="flex-1 text-center font-mono text-xs text-blaze-black/70">
            INFO
          </p>
          <p className="flex-1 text-center font-mono text-xs text-blaze-black/70">
            WATCHLIST
          </p>
          <p className="flex-1 text-center font-mono text-xs text-blaze-black/70">
            BUY
          </p>
        </div>
      </div>
    </div>
  );
}

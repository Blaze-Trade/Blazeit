import { TokenCard } from "@/components/trade/TokenCard";
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
import { useSupabasePortfolio } from "@/hooks/useSupabasePortfolio";
import { useSupabaseTokens } from "@/hooks/useSupabaseTokens";
import { useSupabaseWatchlist } from "@/hooks/useSupabaseWatchlist";
import { api } from "@/lib/api-client";
import { CONTRACT_FUNCTIONS, createTransactionPayload } from "@/lib/contracts";
import { usePortfolioStore } from "@/stores/portfolioStore";
import {
  InputTransactionData,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import { MOCK_TOKENS } from "@shared/mock-data";
import type { Token } from "@shared/types";
import { ArrowUp, Heart, Loader2, Swords, Wallet, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TinderCard from "react-tinder-card";
type SwipeDirection = "left" | "right" | "up";
export function TradePage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [initialTokens, setInitialTokens] = useState<Token[]>([]);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [pendingBuyToken, setPendingBuyToken] = useState<Token | null>(null);
  const [buyQuantity, setBuyQuantity] = useState<number>(10); // Start with 10 tokens (safe for 0 decimal tokens)

  const {
    isConnected,
    address,
    buyToken: buyTokenStore,
    addToWatchlist,
    activeQuest,
    exitQuestMode,
  } = usePortfolioStore();

  // Get signAndSubmitTransaction from wallet
  const { signAndSubmitTransaction } = useWallet();

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
  const { buyToken: buyTokenSupabase } = useSupabasePortfolio(address);
  const { addToWatchlist: addToWatchlistSupabase } =
    useSupabaseWatchlist(address);
  const { simulateTransaction } = useAptos();
  const isInQuestMode = activeQuest !== null;

  // Update tokens when either source is loaded
  useEffect(() => {
    let tokensToUse: Token[] = [];

    if (blockchainTokens.length > 0) {
      tokensToUse = blockchainTokens;
    } else if (supabaseTokens.length > 0) {
      tokensToUse = supabaseTokens;
    } else if (
      !blockchainLoading &&
      !supabaseLoading &&
      blockchainTokens.length === 0 &&
      supabaseTokens.length === 0
    ) {
      // Fallback to mock tokens if no tokens are available from any source
      console.log(
        "No tokens found from blockchain or Supabase, using mock tokens as fallback"
      );
      tokensToUse = MOCK_TOKENS;
    }

    if (tokensToUse.length > 0) {
      // Shuffle tokens for variety
      const shuffledTokens = [...tokensToUse].sort(() => Math.random() - 0.5);
      setTokens(shuffledTokens);
      setInitialTokens(shuffledTokens);
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
    if (!isConnected || !address) {
      toast.error("Please connect your wallet to trade.");
      restoreCard(token.id);
      return;
    }

    if (direction === "right") {
      // Open quantity selector dialog instead of immediately buying
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
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-blaze-white border-2 border-blaze-black p-6 text-center">
          <h2 className="font-display text-4xl font-bold">ALL SWIPED</h2>
          <p className="font-mono text-lg mt-2">
            Check back later for more tokens.
          </p>
          {blockchainTokens.length === 0 &&
            !blockchainLoading &&
            !supabaseLoading && (
              <p className="font-mono text-sm mt-2 text-gray-600">
                Using demo tokens (no blockchain tokens found)
              </p>
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
          preventSwipe={["down"]}
        >
          <TokenCard token={token} />
        </TinderCard>
      );
    });
  };
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative p-4">
      <Toaster richColors closeButton />
      <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
        <DialogContent className="rounded-none border-2 border-blaze-black bg-blaze-white">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl">
              Buy {pendingBuyToken?.symbol}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="font-mono text-sm text-blaze-black/70">Quantity</p>
              <div className="px-1">
                <Slider
                  value={[buyQuantity]}
                  min={1}
                  max={1000}
                  step={1}
                  onValueChange={(v) => setBuyQuantity(Number(v[0]))}
                />
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="1"
                  min="1"
                  max="10000"
                  value={buyQuantity}
                  onChange={(e) =>
                    setBuyQuantity(
                      Math.min(
                        10000,
                        Math.max(1, parseFloat(e.target.value) || 1)
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
                    await simulateTransaction(
                      `Buying ${quantity} ${token.symbol}`
                    );
                    await api(`/api/quests/${activeQuest.id}/buy`, {
                      method: "POST",
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
                    // Build payload using the token's address and decimals from Supabase
                    // Convert human-readable quantity to smallest unit based on token decimals
                    // Tokens created through this app use 0 decimals (optimized for cubic curve):
                    // - With 0 decimals: 1 token = 1 smallest unit (whole numbers only!)
                    // - With 8 decimals: 1 token = 100,000,000 smallest units (legacy/external tokens)
                    // - Maximum safe amount with 0 decimals: ~10,000 tokens (10,000³ = 10^12)
                    const amountInSmallestUnit = Math.round(
                      quantity * Math.pow(10, token.decimals)
                    );

                    console.log(`🛒 Buying ${quantity} ${token.symbol}:`, {
                      tokenId: token.id,
                      tokenAddress: token.address,
                      decimals: token.decimals,
                      humanReadable: quantity,
                      smallestUnit: amountInSmallestUnit,
                      calculation: `${quantity} * 10^${token.decimals} = ${amountInSmallestUnit}`,
                    });

                    const transactionPayload = createTransactionPayload(
                      CONTRACT_FUNCTIONS.launchpad.buyToken,
                      [],
                      [token.address, amountInSmallestUnit]
                    );

                    console.log("📤 Transaction payload:", transactionPayload);

                    const payload: InputTransactionData = {
                      data: {
                        function:
                          transactionPayload.function as `${string}::${string}::${string}`,
                        typeArguments: transactionPayload.typeArguments,
                        functionArguments: transactionPayload.functionArguments,
                      },
                    };

                    const toastId = toast.loading(
                      `Buying ${quantity} ${token.symbol}...`,
                      {
                        description:
                          "Please approve the transaction in your wallet.",
                      }
                    );
                    const result = await signAndSubmitTransaction(payload);
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
                    } else {
                      toast.error(`Failed to buy ${token.symbol}`, {
                        id: toastId,
                      });
                      toast.dismiss(toastId);
                      restoreCard(token.id);
                    }
                  }
                } catch (error: any) {
                  const isUserRejection =
                    error?.message?.includes("User rejected") ||
                    error?.message?.includes("rejected");
                  const isAddressError =
                    error?.message?.includes(
                      "does not exist at this address"
                    ) || error?.message?.includes("object does not exist");
                  const isMintLimitError =
                    error?.message?.includes("Mint limit reached") ||
                    error?.message?.includes("mint limit");
                  const isSupplyError =
                    error?.message?.includes("Insufficient supply") ||
                    error?.message?.includes("supply");
                  const isOverflowError =
                    error?.message?.includes("arithmetic") ||
                    error?.message?.includes("overflow") ||
                    error?.message?.toLowerCase().includes("generic error");

                  console.error("❌ Token purchase failed:", error);
                  console.error("Error details:", {
                    message: error?.message,
                    code: error?.code,
                    name: error?.name,
                  });

                  let errorTitle = `Failed to buy ${token.symbol}`;
                  let errorDescription = error?.message || "Please try again.";

                  if (isUserRejection) {
                    errorTitle = "Transaction rejected";
                    errorDescription = "You cancelled the transaction.";
                  } else if (isAddressError) {
                    errorTitle = "Invalid token address";
                    errorDescription = `The token ${token.symbol} doesn't exist on the blockchain. The token may not have been properly deployed.`;
                  } else if (isMintLimitError) {
                    errorTitle = "Mint limit reached";
                    errorDescription = `You've reached the maximum amount of ${token.symbol} you can buy. The token has a per-address mint limit.`;
                  } else if (isSupplyError) {
                    errorTitle = "Insufficient token supply";
                    errorDescription = `Not enough ${token.symbol} tokens available. Try buying a smaller amount.`;
                  } else if (isOverflowError) {
                    errorTitle = "Arithmetic Overflow (Bonding Curve Issue)";
                    errorDescription = `This token was created with insufficient virtual liquidity, causing overflow in the bonding curve calculation. Token address: ${token.address.slice(
                      0,
                      10
                    )}... - Please contact the token creator to redeploy with higher liquidity (10B+ APT).`;
                  }

                  toast.error(errorTitle, {
                    description: errorDescription,
                  });
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
            to={`/quests/${activeQuest.id}`}
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
      <div className="flex items-center justify-center gap-4 mt-8">
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
    </div>
  );
}

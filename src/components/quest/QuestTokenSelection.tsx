import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAptos } from '@/hooks/useAptos';
import { useBlockchainTokens } from '@/hooks/useBlockchainTokens';
import { useSupabasePortfolio } from "@/hooks/useSupabasePortfolio";
import { useSupabaseQuests } from "@/hooks/useSupabaseQuests";
import { useSupabaseTokens } from "@/hooks/useSupabaseTokens";
import { usePortfolioStore } from "@/stores/portfolioStore";
import type { Quest, Token } from "@shared/types";
import { AlertTriangle, ArrowLeft, Check, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface TokenSelection {
  token: Token;
  quantity: number;
  investmentAmount: number;
}

interface QuestTokenSelectionProps {
  quest: Quest;
  onBack: () => void;
}

export function QuestTokenSelection({
  quest,
  onBack,
}: QuestTokenSelectionProps) {
  const navigate = useNavigate();
  const { transferAPT } = useAptos();
  const { address, joinQuest } = usePortfolioStore();
  const { joinQuest: joinQuestSupabase } = useSupabaseQuests();
  const { buyToken: buyTokenSupabase } = useSupabasePortfolio(address);
  const {
    tokens: supabaseTokens,
    loading: supabaseLoading,
    error: supabaseError,
  } = useSupabaseTokens();
  const {
    tokens: blockchainTokens,
    loading: blockchainLoading,
    error: blockchainError,
  } = useBlockchainTokens();

  const tokens = (blockchainTokens.length > 0 ? blockchainTokens : supabaseTokens);
  const tokensLoading = blockchainLoading || supabaseLoading;
  const tokensError = blockchainError || supabaseError;

  const [selectedTokens, setSelectedTokens] = useState<TokenSelection[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string>("");

  // Show error toast if tokens fail to load
  useEffect(() => {
    if (tokensError) {
      toast.error("Failed to fetch tokens");
    }
  }, [tokensError]);

  const addTokenSelection = (token: Token) => {
    if (selectedTokens.find((s) => s.token.id === token.id)) {
      toast.error("Token already selected");
      return;
    }

    const newSelection: TokenSelection = {
      token,
      quantity: 1,
      investmentAmount: token.price,
    };
    setSelectedTokens([...selectedTokens, newSelection]);
  };

  const removeTokenSelection = (tokenId: string) => {
    setSelectedTokens(selectedTokens.filter((s) => s.token.id !== tokenId));
  };

  const updateTokenQuantity = (tokenId: string, quantity: number) => {
    if (quantity <= 0) {
      removeTokenSelection(tokenId);
      return;
    }

    setSelectedTokens(
      selectedTokens.map((s) =>
        s.token.id === tokenId
          ? { ...s, quantity, investmentAmount: s.token.price * quantity }
          : s
      )
    );
  };

  const updateInvestmentAmount = (tokenId: string, amount: number) => {
    if (amount <= 0) {
      removeTokenSelection(tokenId);
      return;
    }

    setSelectedTokens(
      selectedTokens.map((s) =>
        s.token.id === tokenId
          ? { ...s, investmentAmount: amount, quantity: amount / s.token.price }
          : s
      )
    );
  };

  const totalInvestment = selectedTokens.reduce(
    (sum, s) => sum + s.investmentAmount,
    0
  );
  const totalWithFees = totalInvestment + quest.entryFee;

  const handleConfirmSelection = () => {
    if (selectedTokens.length === 0) {
      toast.error("Please select at least one token");
      return;
    }
    setShowConfirmation(true);
  };

  const handleFinalConfirmation = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    setConfirming(true);
    try {
      // Hardcoded address to send 1 APT to
      const recipientAddress =
        "0x9cc90ff526e7e8bdb3fc8d105b8e8abb73df9105888d46249499175c7085ef92";

      // Transfer 1 APT to the hardcoded address
      const transferResult = await transferAPT(
        recipientAddress,
        1, // 1 APT
        "Joining Quest - Transfer 1 APT"
      );

      if (transferResult.success) {
        // Store transaction hash for display
        setTransactionHash(transferResult.hash || "");

        // Add quest participation to Supabase
        const joinResult = await joinQuestSupabase(quest.id, address);
        if (joinResult.success) {
          // Add to local state as well
          joinQuest(quest);

          // Show success modal
          setShowSuccessModal(true);

          // Auto-redirect after 5 seconds
          setTimeout(() => {
            navigate(`/quests/${quest.id}`);
          }, 5000);
        } else {
          toast.error("Failed to save quest participation");
          console.error("Failed to join quest in database:", joinResult.error);
        }
      } else {
        toast.error("Transaction failed");
      }
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error("Failed to complete transaction");
    } finally {
      setConfirming(false);
    }
  };

  // Success Modal Component
  if (showSuccessModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-none border-4 border-blaze-black shadow-blaze-shadow max-w-md w-full p-8 space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center space-y-3">
            <h2 className="font-display text-3xl font-bold text-blaze-black">
              Transaction Successful!
            </h2>
            <p className="text-lg text-blaze-black/80">
              You have successfully joined <strong>{quest.name}</strong>
            </p>
          </div>

          {/* Transaction Details */}
          <div className="bg-blaze-black/5 p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-blaze-black/70">Amount Sent:</span>
              <span className="font-mono font-bold">1 APT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-blaze-black/70">
                Tokens Selected:
              </span>
              <span className="font-mono font-bold">
                {selectedTokens.length}
              </span>
            </div>
            {transactionHash && (
              <div className="pt-2 border-t border-blaze-black/10">
                <span className="text-xs text-blaze-black/50">
                  Transaction Hash:
                </span>
                <p className="font-mono text-xs break-all">
                  {transactionHash.slice(0, 20)}...
                </p>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => navigate(`/quests/${quest.id}`)}
              className="w-full h-12 rounded-none border-2 border-blaze-black bg-blaze-orange text-blaze-black font-bold uppercase hover:bg-blaze-black hover:text-blaze-white"
            >
              Go to Quest Dashboard
            </Button>
            <p className="text-center text-sm text-blaze-black/50">
              Redirecting automatically in 5 seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (tokensLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-blaze-black/10 w-1/3"></div>
            <div className="h-64 bg-blaze-black/10"></div>
          </div>
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Button
            variant="outline"
            onClick={() => setShowConfirmation(false)}
            className="border-2 border-blaze-black rounded-none h-12 px-4 flex items-center gap-2 font-bold uppercase text-lg hover:bg-blaze-black/5"
          >
            <ArrowLeft /> Back to Selection
          </Button>

          <Card className="rounded-none border-2 border-blaze-black shadow-blaze-shadow">
            <CardHeader className="border-b-2 border-blaze-black">
              <CardTitle className="font-display text-4xl font-bold">
                Confirm Quest Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {/* Quest Details */}
              <div className="space-y-4">
                <h3 className="font-display text-2xl font-bold">
                  Quest: {quest.name}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="border-2 border-blaze-black p-4">
                    <p className="text-sm uppercase tracking-wider text-blaze-black/70">
                      Entry Fee
                    </p>
                    <p className="text-2xl font-bold">${quest.entryFee}</p>
                  </div>
                  <div className="border-2 border-blaze-black p-4">
                    <p className="text-sm uppercase tracking-wider text-blaze-black/70">
                      Prize Pool
                    </p>
                    <p className="text-2xl font-bold">
                      ${quest.prizePool.toLocaleString()}
                    </p>
                  </div>
                  <div className="border-2 border-blaze-black p-4">
                    <p className="text-sm uppercase tracking-wider text-blaze-black/70">
                      Duration
                    </p>
                    <p className="text-2xl font-bold">{quest.duration}</p>
                  </div>
                  <div className="border-2 border-blaze-black p-4">
                    <p className="text-sm uppercase tracking-wider text-blaze-black/70">
                      Players
                    </p>
                    <p className="text-2xl font-bold">{quest.participants}</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-blaze-black" />

              {/* Selected Tokens */}
              <div className="space-y-4">
                <h3 className="font-display text-2xl font-bold">
                  Selected Tokens ({selectedTokens.length})
                </h3>
                <div className="space-y-3">
                  {selectedTokens.map((selection) => (
                    <div
                      key={selection.token.id}
                      className="flex items-center justify-between p-4 border-2 border-blaze-black"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={selection.token.logoUrl}
                          alt={selection.token.name}
                          className="w-12 h-12"
                        />
                        <div>
                          <p className="font-bold text-lg">
                            {selection.token.symbol}
                          </p>
                          <p className="text-sm text-blaze-black/70">
                            {selection.token.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {selection.quantity.toFixed(4)} tokens
                        </p>
                        <p className="text-sm text-blaze-black/70">
                          ${selection.investmentAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-blaze-black" />

              {/* Cost Breakdown */}
              <div className="space-y-4">
                <h3 className="font-display text-2xl font-bold">
                  Cost Breakdown
                </h3>
                <div className="space-y-2 font-mono">
                  <div className="flex justify-between text-lg">
                    <span>Token Investment:</span>
                    <span>${totalInvestment.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span>Quest Entry Fee:</span>
                    <span>${quest.entryFee.toFixed(2)}</span>
                  </div>
                  <Separator className="bg-blaze-black" />
                  <div className="flex justify-between text-2xl font-bold">
                    <span>Total Cost:</span>
                    <span>${totalWithFees.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 p-4 border-2 border-yellow-500 bg-yellow-50">
                <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div className="text-sm">
                  <p className="font-bold text-yellow-800">Important:</p>
                  <p className="text-yellow-700">
                    This will join the quest and immediately purchase the
                    selected tokens. Make sure you have sufficient funds in your
                    wallet.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={() => setShowConfirmation(false)}
                  variant="outline"
                  className="flex-1 h-14 rounded-none border-2 border-blaze-black text-xl font-bold uppercase"
                >
                  Modify Selection
                </Button>
                <Button
                  onClick={handleFinalConfirmation}
                  disabled={confirming}
                  className="flex-1 h-14 rounded-none border-2 border-blaze-black bg-blaze-orange text-blaze-black text-xl font-bold uppercase hover:bg-blaze-black hover:text-blaze-white"
                >
                  {confirming ? "Processing..." : "Confirm & Join Quest"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-2 border-blaze-black rounded-none h-12 px-4 flex items-center gap-2 font-bold uppercase text-lg hover:bg-blaze-black/5"
        >
          <ArrowLeft /> Back to Quest
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Token Selection */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-none border-2 border-blaze-black shadow-blaze-shadow">
              <CardHeader className="border-b-2 border-blaze-black">
                <CardTitle className="font-display text-3xl font-bold">
                  Select Tokens
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tokens.map((token) => {
                    const isSelected = selectedTokens.some(
                      (s) => s.token.id === token.id
                    );
                    return (
                      <div
                        key={token.id}
                        className={`p-4 border-2 cursor-pointer transition-colors ${
                          isSelected
                            ? "border-blaze-orange bg-blaze-orange/10"
                            : "border-blaze-black hover:bg-blaze-black/5"
                        }`}
                        onClick={() => !isSelected && addTokenSelection(token)}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={token.logoUrl}
                            alt={token.name}
                            className="w-10 h-10"
                          />
                          <div className="flex-1">
                            <p className="font-bold text-lg">{token.symbol}</p>
                            <p className="text-sm text-blaze-black/70">
                              {token.name}
                            </p>
                            <p className="font-mono font-bold">
                              ${token.price.toFixed(2)}
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="w-6 h-6 text-blaze-orange" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selection Summary */}
          <div className="space-y-6">
            <Card className="rounded-none border-2 border-blaze-black shadow-blaze-shadow">
              <CardHeader className="border-b-2 border-blaze-black">
                <CardTitle className="font-display text-2xl font-bold">
                  Portfolio ({selectedTokens.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {selectedTokens.length === 0 ? (
                  <p className="text-center text-blaze-black/70 py-8">
                    Select tokens to build your quest portfolio
                  </p>
                ) : (
                  <>
                    {selectedTokens.map((selection) => (
                      <div
                        key={selection.token.id}
                        className="space-y-3 p-4 border border-blaze-black/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={selection.token.logoUrl}
                              alt={selection.token.name}
                              className="w-8 h-8"
                            />
                            <span className="font-bold">
                              {selection.token.symbol}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              removeTokenSelection(selection.token.id)
                            }
                            className="text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-bold">Quantity</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateTokenQuantity(
                                  selection.token.id,
                                  selection.quantity - 0.1
                                )
                              }
                              className="h-8 w-8 p-0 rounded-none border-blaze-black"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Input
                              type="number"
                              value={selection.quantity.toFixed(4)}
                              onChange={(e) =>
                                updateTokenQuantity(
                                  selection.token.id,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="text-center h-8 rounded-none border-blaze-black"
                              step="0.0001"
                              min="0"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateTokenQuantity(
                                  selection.token.id,
                                  selection.quantity + 0.1
                                )
                              }
                              className="h-8 w-8 p-0 rounded-none border-blaze-black"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-bold">
                            Investment ($)
                          </Label>
                          <Input
                            type="number"
                            value={selection.investmentAmount.toFixed(2)}
                            onChange={(e) =>
                              updateInvestmentAmount(
                                selection.token.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-8 rounded-none border-blaze-black"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>
                    ))}

                    <Separator className="bg-blaze-black" />

                    <div className="space-y-2 font-mono">
                      <div className="flex justify-between">
                        <span>Investment:</span>
                        <span>${totalInvestment.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Entry Fee:</span>
                        <span>${quest.entryFee}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>${totalWithFees.toFixed(2)}</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleConfirmSelection}
                      className="w-full h-12 rounded-none border-2 border-blaze-black bg-blaze-orange text-blaze-black font-bold uppercase hover:bg-blaze-black hover:text-blaze-white"
                    >
                      Review & Confirm
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
